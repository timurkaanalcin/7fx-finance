/**
 * Morning orders for the opening desk, and the affiliate A code already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_morning_order (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   host text not null default '',
 *   lane integer,
 *   ink text not null default '',
 *   mark text not null default '',
 *   pace text not null default '',
 *   rank integer,
 *   span integer,
 *   pinned boolean not null default false,
 *   paused boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_affiliate_stem_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_affiliate_stem_review (
 *   customer_id text primary key
 * );
 */

export const ORDER_KEY = "crmv4-morning-orders";
export const ORDER_VIEW_KEY = "crmv4-morning-order-views";
export const STEM_KEY = "crmv4-affiliate-stem-hide";
export const STEM_REVIEW_KEY = "crmv4-affiliate-stem-review";

export type OrderInk = "blank" | "ivory" | "graphite" | "champagne";

export type OrderPace = "blank" | "calm" | "brisk" | "urgent";

export type OrderTray = "open" | "paused" | "closed";

export type LanePick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type MorningOrder = {
  id: string;
  title: string;
  note: string;
  host: string;
  lane: number | null;
  ink: string;
  mark: string;
  pace: string;
  rank: number | null;
  span: number | null;
  pinned: boolean;
  paused: boolean;
  closed: boolean;
  audit: string;
};

export type OrderView = {
  id: string;
  name: string;
  tray: OrderTray;
  query: string;
  host: string;
  ink: string;
  mark: string;
  pace: string;
  lane: string;
  rank: string;
  span: string;
};

export type OrderCounts = {
  open: number;
  paused: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type StemState = "" | "set" | "clear";

export type StemBand = "" | "pip" | "slip" | "card" | "roll";

export type StemDepth = "" | "plain" | "stack" | "pile" | "seam" | "rail" | "figure";

export type StemShape = "all" | "hash" | "even" | "at";

export type StemValue =
  | {
      affiliateB?: unknown;
      affiliateC?: unknown;
      city?: unknown;
      failedLoginCount?: unknown;
      loginBlockedAt?: unknown;
      loginBlockedMessage?: unknown;
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
      withdrawalsEnabled?: unknown;
      isTest?: unknown;
      name?: unknown;
      email?: unknown;
      country?: unknown;
      desk?: unknown;
      deskId?: unknown;
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
      retentionNote?: unknown;
      phone?: unknown;
      address?: unknown;
      lastCountry?: unknown;
      registrationCountry?: unknown;
      campaign?: unknown;
      referralCodeUsed?: unknown;
      affiliateA?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type StemRow = { id?: string; note?: StemValue; label?: string | null };

export type StemBandLine = { band: string; count: number };

export type StemDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "pace", "pin", "unpin", "pause", "resume", "close", "reopen", "ink"] as const;

const INKS = ["ivory", "graphite", "champagne"] as const;

const PACES = ["calm", "brisk", "urgent"] as const;

const PACE_ORDER = ["", "calm", "brisk", "urgent"] as const;

const PICKS = ["blank", "early", "mid", "late", "peak", "quiet"] as const;

const PEAKS = new Set([2, 5]);

const QUIETS = new Set([1, 3, 6]);

const RANKS = [1, 3, 5] as const;

const SPANS = [15, 45, 90] as const;

const HOME = new Set(["TR", "DE", "RU"]);

const STEM_BANDS = ["pip", "slip", "card", "roll"] as const;

const DEPTHS = ["plain", "stack", "pile", "seam", "rail", "figure"] as const;

const STATES = ["set", "clear"] as const;

const STEM_BLOCK = [
  "city",
  "failedLoginCount",
  "loginBlockedAt",
  "loginBlockedMessage",
  "loginEnabled",
  "tradingEnabled",
  "withdrawalsEnabled",
  "isTest",
  "name",
  "email",
  "country",
  "desk",
  "deskId",
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
  "retentionNote",
  "phone",
  "address",
  "lastCountry",
  "registrationCountry",
  "affiliateB",
  "affiliateC",
  "campaign",
  "referralCodeUsed",
] as const;

const ORDER_CAP = 8;

const VIEW_CAP = 6;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): OrderTray {
  return raw === "paused" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<OrderInk, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<OrderInk, "blank">) : "";
}

function paceName(raw: unknown): Exclude<OrderPace, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<OrderPace, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function orderLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function orderNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank host stays blank. It is not filled in. */
export function hostLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A mark is exactly two letters. Anything else stays blank. Letters are stored in capitals. */
export function orderMark(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : "";
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
 * A rank is 1, 3, or 5.
 * A blank value stays unset. 0 and 2 are not ranks.
 * A leading zero is not a rank.
 */
export function rankOf(raw: unknown): number | null {
  if (typeof raw === "number" && (RANKS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:1|3|5)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A span is 15, 45, or 90 minutes. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): number | null {
  if (typeof raw === "number" && (SPANS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:15|45|90)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Ivory, graphite, champagne, or blank. Anything else is blank. */
export function inkOf(raw: unknown): OrderInk {
  return inkName(raw) || "blank";
}

/** Calm, brisk, urgent, or blank. Anything else is blank. */
export function paceOf(raw: unknown): OrderPace {
  return paceName(raw) || "blank";
}

/** Early is 1–2. Mid is 3–4. Late is 5–6. An unset lane is blank. */
export function laneBand(lane: unknown): "blank" | "early" | "mid" | "late" {
  const value = laneOf(lane);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
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
 * A positive step means the typed lane is ahead of the order.
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

/** TR, DE, and RU are home marks. A blank mark is not. */
export function homeDesk(mark: unknown): boolean {
  return HOME.has(orderMark(mark));
}

export function readOrders(raw: unknown): MorningOrder[] {
  if (!Array.isArray(raw)) return [];
  const out: MorningOrder[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<MorningOrder>;
    const id = String(row.id || "").trim();
    const title = orderLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: orderNote(row.note),
      host: hostLabel(row.host),
      lane: laneOf(row.lane),
      ink: inkName(row.ink),
      mark: orderMark(row.mark),
      pace: paceName(row.pace),
      rank: rankOf(row.rank),
      span: spanOf(row.span),
      pinned: row.pinned === true,
      paused: row.paused === true,
      closed: row.closed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, ORDER_CAP);
}

export function addOrder(
  cards: readonly MorningOrder[],
  card: {
    id: string;
    title: string;
    note?: string;
    host?: string;
    lane?: unknown;
    ink?: string;
    mark?: string;
    pace?: string;
    rank?: unknown;
    span?: unknown;
  },
): MorningOrder[] {
  const current = readOrders(cards);
  const id = String(card.id || "").trim();
  const title = orderLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: MorningOrder = {
    id,
    title,
    note: orderNote(card.note),
    host: hostLabel(card.host),
    lane: laneOf(card.lane),
    ink: inkName(card.ink),
    mark: orderMark(card.mark),
    pace: paceName(card.pace),
    rank: rankOf(card.rank),
    span: spanOf(card.span),
    pinned: false,
    paused: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, ORDER_CAP);
}

/** Blank becomes calm. Calm becomes brisk, brisk becomes urgent, and urgent returns to calm. */
export function cyclePace(cards: readonly MorningOrder[], id: string): MorningOrder[] {
  return readOrders(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_ORDER.indexOf(card.pace as (typeof PACE_ORDER)[number]);
    const next = at < 0 || at >= PACES.length ? PACES[0] : PACES[at % PACES.length];
    if (!next || next === card.pace) return card;
    return { ...card, pace: next, audit: "pace" };
  });
}

export function setOrderPin(cards: readonly MorningOrder[], id: string, pinned: boolean): MorningOrder[] {
  return readOrders(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setOrderPause(cards: readonly MorningOrder[], id: string, paused: boolean): MorningOrder[] {
  return readOrders(cards).map((card) => (card.id === id ? { ...card, paused, audit: paused ? "pause" : "resume" } : card));
}

export function setOrderClose(cards: readonly MorningOrder[], id: string, closed: boolean): MorningOrder[] {
  return readOrders(cards).map((card) => (card.id === id ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editOrder(cards: readonly MorningOrder[], id: string, title: string): MorningOrder[] {
  const current = readOrders(cards);
  const next = orderLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editOrderNote(cards: readonly MorningOrder[], id: string, note: string): MorningOrder[] {
  const current = readOrders(cards);
  const next = orderNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkOrderPin(cards: readonly MorningOrder[], ids: readonly string[], pinned: boolean): MorningOrder[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readOrders(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkOrderInk(cards: readonly MorningOrder[], ids: readonly string[], ink: unknown): MorningOrder[] {
  const next = inkName(ink);
  if (!next) return readOrders(cards);
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readOrders(cards).map((card) => (want.has(card.id) ? { ...card, ink: next, audit: "ink" } : card));
}

export function bulkOrderClose(cards: readonly MorningOrder[], ids: readonly string[], closed: boolean): MorningOrder[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readOrders(cards).map((card) => (want.has(card.id) ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

export function resetOrders(): MorningOrder[] {
  return [];
}

function inTray(card: MorningOrder, tray: OrderTray): boolean {
  if (tray === "closed") return card.closed;
  if (tray === "paused") return card.paused && !card.closed;
  return !card.paused && !card.closed;
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
  if (pace === "urgent") return 3;
  if (pace === "brisk") return 2;
  if (pace === "calm") return 1;
  return 0;
}

function waitingPeak(card: MorningOrder): boolean {
  return peakLane(card.lane) && inTray(card, "open");
}

/** An open order whose lane sits more than one step behind the desk clock. A paused or closed order is not late. */
export function lateOrder(card: MorningOrder, desk: unknown): boolean {
  const gap = laneGap(card.lane, desk);
  return inTray(card, "open") && gap !== null && gap > 1;
}

/** An open order with a 15 minute span is due soon. A paused or closed order is not. */
export function soonOrder(card: MorningOrder): boolean {
  return inTray(card, "open") && card.span === 15;
}

/** Search matches the title, the note, and the mark. The host, the lane, and the ink are not part of the query. */
export function visibleOrders(
  cards: readonly MorningOrder[],
  tray: OrderTray,
  query: string,
  host: string | null,
  ink: OrderInk | null,
  mark: string | null,
  pace: OrderPace | null,
  exact: number | null,
  pick: LanePick | null,
  rank: number | "blank" | null,
  span: number | "blank" | null,
  urgentOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): MorningOrder[] {
  const text = query.trim().toLowerCase();
  const wantHost = host === null ? null : hostLabel(host);
  const wantMark = mark === null ? null : orderMark(mark);
  return readOrders(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (wantHost !== null && card.host !== wantHost) return false;
      if (ink !== null && inkOf(card.ink) !== ink) return false;
      if (wantMark !== null && card.mark !== wantMark) return false;
      if (pace !== null && paceOf(card.pace) !== pace) return false;
      if (!laneHit(card.lane, exact, pick)) return false;
      if (rank === "blank" && card.rank !== null) return false;
      if (typeof rank === "number" && card.rank !== rank) return false;
      if (span === "blank" && card.span !== null) return false;
      if (typeof span === "number" && card.span !== span) return false;
      if (urgentOnly && card.pace !== "urgent") return false;
      if (peakOnly && !peakLane(card.lane)) return false;
      if (homeOnly && !homeDesk(card.mark)) return false;
      if (!text) return true;
      return card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.mark.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (paceScore(a.pace) !== paceScore(b.pace)) return paceScore(b.pace) - paceScore(a.pace);
      return a.title.localeCompare(b.title);
    });
}

export function orderTimeline(cards: readonly MorningOrder[], query: string): MorningOrder[] {
  const text = query.trim().toLowerCase();
  return readOrders(cards)
    .filter((card) => card.lane !== null)
    .filter((card) => !text || card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text))
    .sort((a, b) => (a.lane ?? 0) - (b.lane ?? 0) || a.title.localeCompare(b.title));
}

export function orderCounts(cards: readonly MorningOrder[], desk: unknown): OrderCounts {
  const rows = readOrders(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    paused: rows.filter((card) => inTray(card, "paused")).length,
    closed: rows.filter((card) => inTray(card, "closed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => waitingPeak(card)).length,
    late: rows.filter((card) => lateOrder(card, desk)).length,
    soon: rows.filter((card) => soonOrder(card)).length,
    home: rows.filter((card) => homeDesk(card.mark)).length,
  };
}

export function orderShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function orderHosts(cards: readonly MorningOrder[]): string[] {
  const seen = new Set<string>();
  for (const card of readOrders(cards)) if (card.host) seen.add(card.host);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function orderMarks(cards: readonly MorningOrder[]): string[] {
  const seen = new Set<string>();
  for (const card of readOrders(cards)) if (card.mark) seen.add(card.mark);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function orderInks(cards: readonly MorningOrder[]): Exclude<OrderInk, "blank">[] {
  const seen = new Set<string>();
  for (const card of readOrders(cards)) if (card.ink) seen.add(card.ink);
  return INKS.filter((ink) => seen.has(ink));
}

export function orderPaces(cards: readonly MorningOrder[]): Exclude<OrderPace, "blank">[] {
  const seen = new Set<string>();
  for (const card of readOrders(cards)) if (card.pace) seen.add(card.pace);
  return PACES.filter((pace) => seen.has(pace));
}

export function inkCounts(cards: readonly MorningOrder[]): { ink: Exclude<OrderInk, "blank">; count: number }[] {
  const rows = readOrders(cards);
  return INKS.map((ink) => ({ ink, count: rows.filter((card) => card.ink === ink).length })).filter((row) => row.count > 0);
}

export function usedLanes(cards: readonly MorningOrder[]): number {
  return new Set(readOrders(cards).map((card) => card.lane).filter((lane): lane is number => lane !== null)).size;
}

export function clashLaneIds(cards: readonly MorningOrder[]): string[] {
  const open = readOrders(cards).filter((card) => inTray(card, "open") && card.lane !== null && card.ink);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.ink === card.ink && other.lane === card.lane)).map((card) => card.id);
}

export function clashLaneCount(cards: readonly MorningOrder[]): number {
  return clashLaneIds(cards).length;
}

export function rankClashIds(cards: readonly MorningOrder[]): string[] {
  const open = readOrders(cards).filter((card) => inTray(card, "open") && card.rank !== null && card.ink);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.ink === card.ink && other.rank === card.rank)).map((card) => card.id);
}

export function rankClashCount(cards: readonly MorningOrder[]): number {
  return rankClashIds(cards).length;
}

/** The next open order at or after the desk lane. Urgent paces wait. A blank desk lane stays blank. */
export function nextOrder(cards: readonly MorningOrder[], desk: unknown): string {
  const now = laneOf(desk);
  if (now === null) return "";
  const waiting = readOrders(cards).filter((card) => inTray(card, "open") && card.lane !== null && card.pace !== "urgent");
  if (!waiting.length) return "";
  const byLane = (a: MorningOrder, b: MorningOrder) => (a.lane ?? 0) - (b.lane ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.lane ?? 0) >= now).sort(byLane);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byLane)[0].id;
}

/**
 * The ink with the fewest open orders.
 * A tie keeps ivory, then graphite, then champagne.
 * Orders with no ink are not a load. An empty desk still suggests ivory.
 */
export function suggestInk(cards: readonly MorningOrder[]): Exclude<OrderInk, "blank"> {
  const rows = readOrders(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<OrderInk, "blank"> = "ivory";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const ink of INKS) {
    const count = rows.filter((card) => card.ink === ink).length;
    if (count < bestCount) {
      best = ink;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The host carrying the fewest open orders.
 * A tie keeps the earlier name. A blank host is not a load.
 * An empty desk stays blank.
 */
export function suggestHost(cards: readonly MorningOrder[]): string {
  const rows = readOrders(cards).filter((card) => inTray(card, "open") && card.host);
  let best = "";
  let bestCount = Number.POSITIVE_INFINITY;
  const names = Array.from(new Set(rows.map((card) => card.host))).sort((a, b) => a.localeCompare(b));
  for (const host of names) {
    const count = rows.filter((card) => card.host === host).length;
    if (count < bestCount) {
      best = host;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open orders.
 * A tie keeps 45, then 15, then 90.
 * An empty desk still suggests 45.
 */
export function suggestSpan(cards: readonly MorningOrder[]): (typeof SPANS)[number] {
  const rows = readOrders(cards).filter((card) => inTray(card, "open"));
  const order = [45, 15, 90] as const;
  let best: (typeof SPANS)[number] = 45;
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
 * The roster name with the fewest open orders.
 * A blank roster falls back to the least-loaded host already on the desk.
 * A tie keeps the earlier name.
 */
export function fairHost(cards: readonly MorningOrder[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = hostLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestHost(cards);
  const open = readOrders(cards).filter((card) => inTray(card, "open"));
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  let best = sorted[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of sorted) {
    const count = open.filter((card) => card.host === name).length;
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

/** The CSV is the orders saved in this browser. The gap and the late mark use the lane you pass. */
export function ordersCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,host,lane,ink,mark,pace,rank,span,band,pinned,paused,closed,gap,late,soon,home,note,audit"];
  for (const card of readOrders(raw)) {
    const gap = laneGap(card.lane, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.host),
      card.lane === null ? "" : String(card.lane),
      card.ink,
      csvCell(card.mark),
      card.pace,
      card.rank === null ? "" : String(card.rank),
      card.span === null ? "" : String(card.span),
      laneBand(card.lane),
      card.pinned ? "1" : "0",
      card.paused ? "1" : "0",
      card.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateOrder(card, desk) ? "1" : "0",
      soonOrder(card) ? "1" : "0",
      homeDesk(card.mark) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

export function orderCopy(card: MorningOrder): string {
  return [card.title, card.host, card.lane ?? "", card.ink, card.mark, card.pace, card.rank ?? "", card.span ?? "", card.note].filter((part) => part !== "").join(" · ");
}

function hostSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return hostLabel(raw) || "all";
}

function inkSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return inkName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return orderMark(raw) || "all";
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

/** All, blank, and the ranks 1, 3, and 5 stay. Anything else is all. */
export function activeRank(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const rank = rankOf(filter);
  return rank === null ? "all" : String(rank);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

/** All, blank, and the spans 15, 45, and 90 stay. Anything else is all. */
export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const span = spanOf(filter);
  return span === null ? "all" : String(span);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

export function activeHost(filter: string, hosts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const host = hostLabel(filter);
  return host && hosts.includes(host) ? host : "all";
}

export function hostArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return hostLabel(filter) || null;
}

export function activeInk(filter: string, inks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ink = inkName(filter);
  return ink && inks.includes(ink) ? ink : "all";
}

export function inkArg(filter: string): OrderInk | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return inkName(filter) || null;
}

export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = orderMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return orderMark(filter) || null;
}

export function activePace(filter: string, paces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pace = paceName(filter);
  return pace && paces.includes(pace) ? pace : "all";
}

export function paceArg(filter: string): OrderPace | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function readOrderViews(raw: unknown): OrderView[] {
  if (!Array.isArray(raw)) return [];
  const out: OrderView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OrderView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      host: hostSlot(row.host),
      ink: inkSlot(row.ink),
      mark: markSlot(row.mark),
      pace: paceSlot(row.pace),
      lane: activeLane(String(row.lane || "all")),
      rank: activeRank(String(row.rank || "all")),
      span: activeSpan(String(row.span || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addOrderView(views: readonly OrderView[], view: OrderView): OrderView[] {
  const current = readOrderViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    host: hostSlot(view.host),
    ink: inkSlot(view.ink),
    mark: markSlot(view.mark),
    pace: paceSlot(view.pace),
    lane: activeLane(view.lane),
    rank: activeRank(view.rank),
    span: activeSpan(view.span),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropOrderView(views: readonly OrderView[], id: string): OrderView[] {
  return readOrderViews(views).filter((view) => view.id !== id);
}

function stemText(raw: unknown): string {
  return clip(raw, 48);
}

function stemBody(value: StemValue): { text: string; explicit: boolean } | null {
  if (typeof value === "number") return { text: "", explicit: false };
  if (typeof value === "string") return { text: stemText(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: "", explicit: false };
  if (STEM_BLOCK.some((key) => key in value)) return null;
  if (!("affiliateA" in value)) return { text: "", explicit: false };
  const inner = value.affiliateA;
  if (inner === null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: "", explicit: false };
  return { text: stemText(inner), explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set affiliate A code is text. A clear code is an explicit blank. A missing field stays unmarked.
 * A referral code, a campaign, and the other blocked fields are not an affiliate A code.
 */
export function stemState(value: StemValue): StemState {
  const body = stemBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/** The clipped affiliate A code. A clear or unmarked value stays blank. */
export function stemCopy(value: StemValue): string {
  const body = stemBody(value);
  return body?.text || "";
}

/**
 * Pip is 1–2 characters. Slip is 3–6. Card is 7–12. Thirteen and above is a roll.
 * A blank affiliate A code has no band.
 */
export function stemBand(value: StemValue): StemBand {
  const text = stemCopy(value);
  if (!text) return "";
  const length = text.length;
  if (length <= 2) return "pip";
  if (length <= 6) return "slip";
  if (length <= 12) return "card";
  return "roll";
}

/**
 * Figure is any digit. Rail is a dot or an underscore and no digit. Seam is a hyphen and neither.
 * Pile is four words or more. Stack is two or three words. One word is plain.
 * A blank affiliate A code has no depth.
 */
export function stemDepth(value: StemValue): StemDepth {
  const text = stemCopy(value);
  if (!text) return "";
  if (/\d/.test(text)) return "figure";
  if (text.includes("_") || text.includes(".")) return "rail";
  if (text.includes("-")) return "seam";
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 4) return "pile";
  if (words >= 2) return "stack";
  return "plain";
}

/** How many words the affiliate A code carries. A blank code stays at zero. */
export function stemWords(value: StemValue): number {
  const text = stemCopy(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** An affiliate A code that starts with #. A clear code is not a hash stem. */
export function hashStem(value: StemValue): boolean {
  return stemCopy(value).startsWith("#");
}

/** A set affiliate A code with an even digit count. An odd count is not even. Letters do not count. */
export function evenStem(value: StemValue): boolean {
  const digits = stemCopy(value).replace(/\D/g, "");
  return Boolean(digits) && digits.length % 2 === 0;
}

/** An affiliate A code that contains @. A clear code is not an at stem. */
export function atStem(value: StemValue): boolean {
  return stemCopy(value).includes("@");
}

/** How many set affiliate A codes start with #. */
export function hashStemCount(rows: readonly StemRow[]): number {
  return rows.filter((row) => stemState(row.note) === "set" && hashStem(row.note)).length;
}

/** How many set affiliate A codes have an even digit count. */
export function evenStemCount(rows: readonly StemRow[]): number {
  return rows.filter((row) => stemState(row.note) === "set" && evenStem(row.note)).length;
}

/** How many set affiliate A codes contain @. */
export function atStemCount(rows: readonly StemRow[]): number {
  return rows.filter((row) => stemState(row.note) === "set" && atStem(row.note)).length;
}

/** How many distinct set codes are shared by two or more customers. */
export function sharedStemCount(rows: readonly StemRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (stemState(row.note) !== "set") continue;
    const code = stemCopy(row.note);
    if (!code) continue;
    map.set(code, (map.get(code) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function stemBands(rows: readonly StemRow[]): StemBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = stemState(row.note);
    if (state === "") continue;
    const band = state === "set" ? stemBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: StemBandLine[] = [];
  for (const band of ["", ...STEM_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function stemDepths(rows: readonly StemRow[]): StemDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = stemDepth(row.note);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: StemDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps pip, then slip, card, and roll. An unmarked field is not a lead. */
export function leadingStem(rows: readonly StemRow[]): string {
  const named = stemBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => STEM_BANDS.indexOf(band as (typeof STEM_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps the earlier depth. A blank code is not a lead. */
export function leadingStemDepth(rows: readonly StemRow[]): string {
  const named = stemDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function stemShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandStem(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((STEM_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentStems(rows: readonly StemRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = stemState(row.note);
    const token = state === "set" ? stemBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenStems(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandStem(item);
    if (!band || !known.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleStem(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandStem(band);
  if (!token || !present.includes(token)) return readHiddenStems(hidden, present);
  const current = readHiddenStems(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleStemBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenStems(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

export function stemArg(filter: string): StemBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandStem(filter);
  return band && band !== "blank" ? (band as StemBand) : null;
}

export function activeStem(filter: string, present: readonly string[]): string {
  if (filter === "all") return "all";
  const band = filter === "blank" ? "blank" : bandStem(filter);
  return band && present.includes(band) ? band : "all";
}

function depthStem(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (DEPTHS as readonly string[]).includes(text) ? text : "";
}

export function stemDepthArg(filter: string): StemDepth | null {
  if (filter === "all") return null;
  const depth = depthStem(filter);
  return depth ? (depth as StemDepth) : null;
}

export function activeStemDepth(filter: string): string {
  if (filter === "all") return "all";
  return depthStem(filter) || "all";
}

function rowId(row: StemRow): string {
  return String(row.id || "").trim();
}

export function readReviewedStems(raw: unknown, present: readonly string[]): string[] {
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

export function toggleStemReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedStems(reviewed, present);
  const current = readReviewedStems(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkStemReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedStems(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the depth, and the affiliate code are not part of the query. */
export function visibleStemCustomers<T extends StemRow>(
  rows: readonly T[],
  band: StemBand | "blank" | null,
  depth: StemDepth | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: StemShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = stemState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && stemBand(row.note) !== band) return false;
    if (depth !== null && stemDepth(row.note) !== depth) return false;
    if (shape === "hash" && !hashStem(row.note)) return false;
    if (shape === "even" && (state !== "set" || !evenStem(row.note))) return false;
    if (shape === "at" && !atStem(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function stemsCsv(rows: readonly StemRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = stemState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of stemBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of stemDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  lines.push(["shape", "hash", String(hashStemCount(rows))].join(","));
  lines.push(["shape", "even", String(evenStemCount(rows))].join(","));
  lines.push(["shape", "at", String(atStemCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedStemCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function stemRowsCsv(rows: readonly StemRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,depth,words,hash,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(stemBand(row.note)),
      csvCell(stemDepth(row.note)),
      String(stemWords(row.note)),
      hashStem(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
