/**
 * Terrace cards for hospitality follow-ups, and colophon marks already stored as a trader name, retention status, and desk.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_terrace_card (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   host text not null default '',
 *   seat integer,
 *   grade text not null default '',
 *   pace text not null default '',
 *   sla integer,
 *   rank integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_colophon_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_colophon_review (
 *   trader_id text primary key
 * );
 */

export const TRC_KEY = "crmv4-terrace-card";
export const TRC_VIEW_KEY = "crmv4-terrace-views";
export const TRC_DENSITY_KEY = "crmv4-terrace-density";
export const CLP_KEY = "crmv4-colophon-hide";
export const CLP_REVIEW_KEY = "crmv4-colophon-review";

export type GradeName = "blank" | "ivory" | "champagne" | "graphite";

export type PaceName = "blank" | "linger" | "stroll" | "brisk";

export type TerraceTray = "open" | "held" | "archived";

export type SeatPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type TerraceDensity = "airy" | "tight";

export type TerraceSort = "seat" | "host";

export type TerraceCard = {
  id: string;
  title: string;
  note: string;
  host: string;
  seat: number | null;
  grade: string;
  pace: string;
  span: number | null;
  rank: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  seal: boolean;
  audit: string;
};

export type TerraceView = {
  id: string;
  name: string;
  tray: TerraceTray;
  query: string;
  host: string;
  grade: string;
  pace: string;
  seat: string;
  span: string;
  rank: string;
};

export type TerraceCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  rank: number;
  house: number;
  window: number;
  matched: number;
  seal: number;
  cooling: number;
};

export type ColophonLane = "" | "hall" | "ink" | "warm" | "cold" | "lost" | "cipher";

export type ColophonTone = "" | "gilt" | "linen" | "pale" | "ash" | "haze";

export type ColophonState = "" | "clear" | "set";

export type ColophonShape = "all" | "join" | "wide" | "hall" | "cipher" | "ink";

export type ColophonReview = "all" | "reviewed" | "fresh";

export type ColophonValue = string | { name?: unknown; ink?: unknown; press?: unknown; retention?: unknown; desk?: unknown; [key: string]: unknown } | null | undefined;

export type ColophonRow = { id: string; label: string; note: ColophonValue };

export type ColophonLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "archive", "open", "grade", "tag", "rank", "span", "seal"] as const;

const GRADES = ["ivory", "champagne", "graphite"] as const;

const PACES = ["linger", "stroll", "brisk"] as const;

const PACE_CYCLE = ["linger", "stroll", "brisk"] as const;

const RANK_CYCLE = [2, 5, 8] as const;

const PEAK_SEATS = new Set([3, 7]);

const QUIET_SEATS = new Set([1]);

const HOUSE = new Set(["CHAMPAGNE", "GRAPHITE"]);

const INK_LANE = new Set(["NEW", "LEAD", "FRESH", "OPEN"]);

const WARM_LANE = new Set(["ACTIVE", "WARM", "HOT", "CLIENT", "RETAINED"]);

const COLD_LANE = new Set(["COLD", "DORMANT", "STALE", "QUIET"]);

const LOST_LANE = new Set(["LOST", "CHURN", "INVALID", "CLOSED", "DEAD"]);

const LANE_ORDER = ["cipher", "ink", "warm", "cold", "lost", "hall"] as const;

const TONE_ORDER = ["gilt", "linen", "pale", "ash", "haze"] as const;

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const TRC_CAP = 7;

const VIEW_CAP = 5;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TerraceTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function gradeName(raw: unknown): Exclude<GradeName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (GRADES as readonly string[]).includes(text) ? (text as Exclude<GradeName, "blank">) : "";
}

function paceName(raw: unknown): Exclude<PaceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<PaceName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[wxyz]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: TerraceCard, tray: TerraceTray): boolean {
  if (tray === "held") return card.held && !card.archived;
  if (tray === "archived") return card.archived;
  return !card.held && !card.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

/** A blank title is left out. The saved title stays short. */
export function terraceLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function terraceNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A blank host stays blank. It is not filled in. */
export function terraceHost(raw: unknown): string {
  return clip(raw, 20);
}

/** A grade is IVORY, CHAMPAGNE, or GRAPHITE. Anything else stays blank. Letters are stored in capitals. */
export function gradeOf(raw: unknown): string {
  const name = gradeName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A seat is an integer from 1 through 8.
 * A blank value stays unset. 0 is not a seat.
 * 9 is not a seat.
 */
export function seatOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 8) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-8]$/.test(text)) return null;
  return Number(text);
}

/** A span is 3, 9, or 15 hours. A blank value stays unset. */
export function spanOf(raw: unknown): 3 | 9 | 15 | null {
  if (raw === 3 || raw === "3") return 3;
  if (raw === 9 || raw === "9") return 9;
  if (raw === 15 || raw === "15") return 15;
  return null;
}

/** Rank is 2, 5, or 8. Anything else is not a rank. 2 is the resting rank. */
export function rankOf(raw: unknown): 2 | 5 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 5 || raw === "5") return 5;
  if (raw === 8 || raw === "8") return 8;
  return null;
}

export function seatBand(seat: unknown): "blank" | "early" | "mid" | "late" {
  const value = seatOf(seat);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak seats are 3 and 7. An unset seat is not a peak seat. */
export function peakSeat(seat: unknown): boolean {
  const value = seatOf(seat);
  return value !== null && PEAK_SEATS.has(value);
}

/** The quiet seat is 1. A peak seat is not quiet. An unset seat is not quiet. */
export function quietSeat(seat: unknown): boolean {
  const value = seatOf(seat);
  return value !== null && QUIET_SEATS.has(value);
}

/**
 * How far a seat sits behind the desk seat.
 * A positive gap means the card is behind. A negative gap means it is ahead.
 * A gap of zero means the same seat. An unset seat has no gap. Seats do not wrap.
 */
export function seatGap(seat: unknown, desk: unknown): number | null {
  const from = seatOf(seat);
  const at = seatOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** CHAMPAGNE and GRAPHITE are house grades. IVORY is a guest grade. A blank grade is not house. */
export function houseGrade(grade: unknown): boolean {
  return HOUSE.has(gradeOf(grade));
}

export function terraceDensity(raw: unknown): TerraceDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function terraceSort(raw: unknown): TerraceSort {
  return raw === "host" ? "host" : "seat";
}

function readOne(raw: unknown): TerraceCard | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = terraceLine(row.title);
  if (!id || !title) return null;
  const rank = rankOf(row.rank);
  return {
    id,
    title,
    note: terraceNote(row.note),
    host: terraceHost(row.host),
    seat: seatOf(row.seat),
    grade: gradeOf(row.grade),
    pace: paceName(row.pace),
    span: spanOf(row.span),
    rank: rank === null ? 2 : rank,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    seal: row.seal === true,
    audit: auditCode(row.audit),
  };
}

export function readTerraces(raw: unknown): TerraceCard[] {
  if (!Array.isArray(raw)) return [];
  const out: TerraceCard[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, TRC_CAP);
}

export function addTerrace(
  cards: readonly TerraceCard[],
  card: {
    id: string;
    title: string;
    note?: string;
    host?: string;
    seat?: unknown;
    grade?: string;
    pace?: string;
    span?: unknown;
    rank?: unknown;
    tags?: unknown;
  },
): TerraceCard[] {
  const current = readTerraces(cards);
  const id = String(card.id || "").trim();
  const title = terraceLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rank = rankOf(card.rank);
  const next: TerraceCard = {
    id,
    title,
    note: terraceNote(card.note),
    host: terraceHost(card.host),
    seat: seatOf(card.seat),
    grade: gradeOf(card.grade),
    pace: paceName(card.pace),
    span: spanOf(card.span),
    rank: rank === null ? 2 : rank,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, TRC_CAP);
}

/** A blank pace becomes linger, linger becomes stroll, stroll becomes brisk, and brisk returns to linger. */
export function cyclePace(cards: readonly TerraceCard[], id: string): TerraceCard[] {
  return readTerraces(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_CYCLE.indexOf(card.pace as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    if (!next || next === card.pace) return card;
    return { ...card, pace: next, audit: "pace" };
  });
}

/** Rank steps 2 to 5, 5 to 8, and 8 back to 2. */
export function cycleRank(cards: readonly TerraceCard[], id: string): TerraceCard[] {
  return readTerraces(cards).map((card) => {
    if (card.id !== id) return card;
    const at = RANK_CYCLE.indexOf(card.rank as (typeof RANK_CYCLE)[number]);
    const next = at < 0 ? RANK_CYCLE[0] : RANK_CYCLE[(at + 1) % RANK_CYCLE.length];
    if (next === card.rank) return card;
    return { ...card, rank: next, audit: "rank" };
  });
}

/** A blank title is left as it is. */
export function editTerrace(cards: readonly TerraceCard[], id: string, title: unknown): TerraceCard[] {
  const next = terraceLine(title);
  if (!next) return readTerraces(cards);
  const current = readTerraces(cards);
  if (current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

export function editTerraceNote(cards: readonly TerraceCard[], id: string, note: unknown): TerraceCard[] {
  const next = terraceNote(note);
  return readTerraces(cards).map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "note" } : card));
}

export function addTerraceTag(cards: readonly TerraceCard[], id: string, tag: unknown): TerraceCard[] {
  const next = tagsOf(tag);
  if (!next.length) return readTerraces(cards);
  return readTerraces(cards).map((card) => {
    if (card.id !== id) return card;
    const tags = tagsOf([...card.tags, ...next]);
    if (tags.join() === card.tags.join()) return card;
    return { ...card, tags, audit: "tag" };
  });
}

export function setTerraceRank(cards: readonly TerraceCard[], id: string, rank: unknown): TerraceCard[] {
  const next = rankOf(rank);
  if (next === null) return readTerraces(cards);
  return readTerraces(cards).map((card) => (card.id === id && card.rank !== next ? { ...card, rank: next, audit: "rank" } : card));
}

/** Snooze steps a blank span to 9, 3 to 9, and 9 to 15. A span of 15 stays. */
export function snoozeTerrace(cards: readonly TerraceCard[], id: string): TerraceCard[] {
  return readTerraces(cards).map((card) => {
    if (card.id !== id || card.span === 15) return card;
    const next = card.span === 9 ? 15 : 9;
    return { ...card, span: next, audit: "span" };
  });
}

export function setTerracePin(cards: readonly TerraceCard[], id: string, pinned: boolean): TerraceCard[] {
  return readTerraces(cards).map((card) => (card.id === id && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function pinFocusedTerrace(cards: readonly TerraceCard[], shownIds: readonly string[], index: number): TerraceCard[] {
  const id = shownIds[index];
  if (!id) return readTerraces(cards);
  const card = readTerraces(cards).find((item) => item.id === id);
  if (!card) return readTerraces(cards);
  return setTerracePin(cards, id, !card.pinned);
}

export function snoozeFocusedTerrace(cards: readonly TerraceCard[], shownIds: readonly string[], index: number): TerraceCard[] {
  const id = shownIds[index];
  return id ? snoozeTerrace(cards, id) : readTerraces(cards);
}

export function holdFocusedTerrace(cards: readonly TerraceCard[], shownIds: readonly string[], index: number): TerraceCard[] {
  const id = shownIds[index];
  if (!id) return readTerraces(cards);
  const card = readTerraces(cards).find((item) => item.id === id);
  if (!card || card.archived) return readTerraces(cards);
  return setTerraceHold(cards, id, !card.held);
}

export function paceFocusedTerrace(cards: readonly TerraceCard[], shownIds: readonly string[], index: number): TerraceCard[] {
  const id = shownIds[index];
  return id ? cyclePace(cards, id) : readTerraces(cards);
}

export function rankFocusedTerrace(cards: readonly TerraceCard[], shownIds: readonly string[], index: number): TerraceCard[] {
  const id = shownIds[index];
  return id ? cycleRank(cards, id) : readTerraces(cards);
}

export function sealFocusedTerrace(cards: readonly TerraceCard[], shownIds: readonly string[], index: number): TerraceCard[] {
  const id = shownIds[index];
  if (!id) return readTerraces(cards);
  const card = readTerraces(cards).find((item) => item.id === id);
  if (!card) return readTerraces(cards);
  return setTerraceSeal(cards, id, !card.seal);
}

export function tagFocusedTerrace(cards: readonly TerraceCard[], shownIds: readonly string[], index: number): TerraceCard[] {
  const id = shownIds[index];
  return id ? addTerraceTag(cards, id, "w") : readTerraces(cards);
}

export function setTerraceHold(cards: readonly TerraceCard[], id: string, held: boolean): TerraceCard[] {
  return readTerraces(cards).map((card) => (card.id === id && !card.archived && card.held !== held ? { ...card, held, audit: held ? "hold" : "resume" } : card));
}

export function setTerraceArchive(cards: readonly TerraceCard[], id: string, archived: boolean): TerraceCard[] {
  return readTerraces(cards).map((card) => (card.id === id && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function setTerraceSeal(cards: readonly TerraceCard[], id: string, seal: boolean): TerraceCard[] {
  return readTerraces(cards).map((card) => (card.id === id && card.seal !== seal ? { ...card, seal, audit: "seal" } : card));
}

export function bulkTerraceGrade(cards: readonly TerraceCard[], ids: readonly string[], grade: unknown): TerraceCard[] {
  const next = gradeOf(grade);
  if (!next) return readTerraces(cards);
  const want = new Set(ids);
  return readTerraces(cards).map((card) => (want.has(card.id) && card.grade !== next ? { ...card, grade: next, audit: "grade" } : card));
}

export function bulkTerracePin(cards: readonly TerraceCard[], ids: readonly string[], pinned: boolean): TerraceCard[] {
  const want = new Set(ids);
  return readTerraces(cards).map((card) => (want.has(card.id) && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkTerraceArchive(cards: readonly TerraceCard[], ids: readonly string[], archived: boolean): TerraceCard[] {
  const want = new Set(ids);
  return readTerraces(cards).map((card) => (want.has(card.id) && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function bulkTerracePace(cards: readonly TerraceCard[], ids: readonly string[], pace: unknown): TerraceCard[] {
  const next = paceName(pace);
  if (!next) return readTerraces(cards);
  const want = new Set(ids);
  return readTerraces(cards).map((card) => (want.has(card.id) && card.pace !== next ? { ...card, pace: next, audit: "pace" } : card));
}

export function bulkTerraceTag(cards: readonly TerraceCard[], ids: readonly string[], tag: unknown): TerraceCard[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addTerraceTag(rows, id, tag) : rows), readTerraces(cards));
}

/** An open card whose seat sits more than three seats behind the desk. A raised rank, a hold, or an archive is not late. */
export function lateTerrace(card: TerraceCard, desk: unknown): boolean {
  const gap = seatGap(card.seat, desk);
  return inTray(card, "open") && card.rank === 2 && gap !== null && gap > 3;
}

/** An open card with a span of 3 hours is due now. A raised rank, a hold, or an archive is not. */
export function soonTerrace(card: TerraceCard): boolean {
  return inTray(card, "open") && card.rank === 2 && card.span === 3;
}

/** An open resting card on a brisk pace whose seat is 1. That quiet brisk card is cooling. */
export function coolingTerrace(card: TerraceCard): boolean {
  return inTray(card, "open") && card.rank === 2 && card.pace === "brisk" && card.seat === 1;
}

export function reminderTerraces(cards: readonly TerraceCard[], desk: unknown): TerraceCard[] {
  return readTerraces(cards).filter((card) => lateTerrace(card, desk) || soonTerrace(card));
}

export function coolingTerraces(cards: readonly TerraceCard[]): TerraceCard[] {
  return readTerraces(cards).filter((card) => coolingTerrace(card));
}

/** Open resting cards whose seat sits within two seats of the desk. */
export function windowTerraces(cards: readonly TerraceCard[], desk: unknown): TerraceCard[] {
  return readTerraces(cards).filter((card) => {
    const gap = seatGap(card.seat, desk);
    return inTray(card, "open") && card.rank === 2 && gap !== null && gap >= -2 && gap <= 2;
  });
}

export function matchedTerraces(cards: readonly TerraceCard[], desk: unknown): number {
  const at = seatOf(desk);
  if (at === null) return 0;
  return readTerraces(cards).filter((card) => inTray(card, "open") && card.rank === 2 && card.seat === at).length;
}

function seatHit(seat: number | null, exact: number | null, pick: SeatPick | null): boolean {
  if (exact !== null) return seat === exact;
  if (pick === null) return true;
  if (pick === "blank") return seat === null;
  if (pick === "peak") return peakSeat(seat);
  if (pick === "quiet") return quietSeat(seat);
  return seatBand(seat) === pick;
}

export function seatArg(filter: string): { exact: number | null; pick: SeatPick | null } | null {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  const exact = seatOf(filter);
  return exact === null ? null : { exact, pick: null };
}

export function activeSeat(filter: string): string {
  return seatArg(filter) ? filter : "all";
}

export function spanArg(filter: string): 3 | 9 | 15 | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

export function activeSpan(filter: string): string {
  const span = spanArg(filter);
  return span === null && filter !== "all" ? "all" : filter === "all" || span ? filter : "all";
}

export function paceArg(filter: string): Exclude<PaceName, "blank"> | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const name = paceName(filter);
  return name || null;
}

export function activePace(filter: string, paces: readonly string[]): string {
  return paces.includes(filter) || filter === "all" || filter === "blank" ? filter : "all";
}

export function rankArg(filter: string): 2 | 5 | 8 | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

export function activeRank(filter: string): string {
  return rankArg(filter) || filter === "all" ? (rankArg(filter) === null && filter !== "all" ? "all" : filter) : "all";
}

export function gradeArg(filter: string): string | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const grade = gradeOf(filter);
  return grade || null;
}

export function activeGrade(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  return gradeOf(filter) ? filter.toLowerCase() : "all";
}

export function hostArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  const host = terraceHost(filter);
  return host || null;
}

export function activeHost(filter: string, hosts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return hosts.includes(filter) ? filter : "all";
}

export function moveTerraceFocus(index: number, count: number, step: number): number {
  if (count <= 0) return 0;
  return (index + step + count) % count;
}

/** An empty book suggests ivory. When house grades outnumber ivory, ivory is suggested. Otherwise champagne. */
export function suggestGrade(cards: readonly TerraceCard[]): string {
  const rows = readTerraces(cards).filter((card) => card.grade);
  if (!rows.length) return "IVORY";
  const house = rows.filter((card) => houseGrade(card.grade)).length;
  return house > rows.length - house ? "IVORY" : "CHAMPAGNE";
}

/** An empty book suggests 9 hours. A late card suggests 15. */
export function suggestSpan(cards: readonly TerraceCard[], desk: unknown): 9 | 15 {
  const rows = readTerraces(cards);
  if (!rows.length) return 9;
  return rows.some((card) => lateTerrace(card, desk)) ? 15 : 9;
}

/** The host with the fewest open cards. A tie keeps the earlier name. A blank roster has no host. */
export function fairHost(cards: readonly TerraceCard[], roster: string): string {
  const names: string[] = [];
  for (const part of roster.split(",")) {
    const name = terraceHost(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return "";
  const open = readTerraces(cards).filter((card) => inTray(card, "open"));
  let best = names[0];
  let bestCount = open.filter((card) => card.host === best).length;
  for (const name of names.slice(1)) {
    const count = open.filter((card) => card.host === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function suggestHost(cards: readonly TerraceCard[], roster: string): string {
  return fairHost(cards, roster);
}

/** The host with the most open cards. A tie keeps the name that sorts later. */
export function busiestHost(cards: readonly TerraceCard[]): string {
  const rows = readTerraces(cards).filter((card) => inTray(card, "open") && card.host);
  const names: string[] = [];
  for (const card of rows) if (!names.includes(card.host)) names.push(card.host);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = rows.filter((card) => card.host === best).length;
  for (const name of names) {
    const count = rows.filter((card) => card.host === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function terraceCounts(cards: readonly TerraceCard[], desk: unknown): TerraceCounts {
  const rows = readTerraces(cards);
  const open = rows.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    held: rows.filter((card) => inTray(card, "held")).length,
    archived: rows.filter((card) => inTray(card, "archived")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakSeat(card.seat)).length,
    late: open.filter((card) => lateTerrace(card, desk)).length,
    soon: open.filter((card) => soonTerrace(card)).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseGrade(card.grade)).length,
    window: windowTerraces(rows, desk).length,
    matched: matchedTerraces(rows, desk),
    seal: open.filter((card) => card.seal).length,
    cooling: open.filter((card) => coolingTerrace(card)).length,
  };
}

export function terraceShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function lateTerraceShare(cards: readonly TerraceCard[], desk: unknown): number {
  const counts = terraceCounts(cards, desk);
  return terraceShare(counts.late, counts.open);
}

export function rankLoad(cards: readonly TerraceCard[]): number {
  return terraceCounts(cards, 4).rank;
}

/** Open cards that share a seat with another open resting card. */
export function clashSeatCount(cards: readonly TerraceCard[]): number {
  const open = readTerraces(cards).filter((card) => inTray(card, "open") && card.rank === 2 && card.seat !== null);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.seat === card.seat)).length;
}

/** Open cards that share a host and a span with another open card. */
export function spanClashCount(cards: readonly TerraceCard[]): number {
  const open = readTerraces(cards).filter((card) => inTray(card, "open") && card.host && card.span !== null);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.host === card.host && other.span === card.span)).length;
}

export function pairHostCount(cards: readonly TerraceCard[]): number {
  const open = readTerraces(cards).filter((card) => inTray(card, "open") && card.host);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.host === card.host)).length;
}

/** Open cards whose seat is exactly two away from another open card. */
export function neighborTerraceCount(cards: readonly TerraceCard[]): number {
  const open = readTerraces(cards).filter((card) => inTray(card, "open") && card.seat !== null);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.seat !== null && Math.abs(other.seat - (card.seat as number)) === 2)).length;
}

export function terraceTimeline(cards: readonly TerraceCard[]): { seat: number; titles: string[] }[] {
  const map = new Map<number, string[]>();
  for (const card of readTerraces(cards)) {
    if (!inTray(card, "open") || card.seat === null) continue;
    const list = map.get(card.seat) || [];
    list.push(card.title);
    map.set(card.seat, list);
  }
  return Array.from(map.keys()).sort((a, b) => a - b).map((seat) => ({ seat, titles: map.get(seat) || [] }));
}

export function terraceHosts(cards: readonly TerraceCard[]): string[] {
  const names: string[] = [];
  for (const card of readTerraces(cards)) if (card.host && !names.includes(card.host)) names.push(card.host);
  return names;
}

export function terraceGrades(cards: readonly TerraceCard[]): string[] {
  const names: string[] = [];
  for (const card of readTerraces(cards)) if (card.grade && !names.includes(card.grade)) names.push(card.grade);
  return names;
}

export function nextTerrace(cards: readonly TerraceCard[], id: string): TerraceCard | null {
  const open = readTerraces(cards)
    .filter((card) => inTray(card, "open"))
    .slice()
    .sort((a, b) => (a.seat ?? 99) - (b.seat ?? 99) || a.title.localeCompare(b.title));
  const at = open.findIndex((card) => card.id === id);
  if (at < 0 || at === open.length - 1) return null;
  return open[at + 1];
}

export function sortTerraces(cards: readonly TerraceCard[], sort: TerraceSort): TerraceCard[] {
  return readTerraces(cards).slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "host") return a.host.localeCompare(b.host) || a.title.localeCompare(b.title);
    return (a.seat ?? 99) - (b.seat ?? 99) || a.title.localeCompare(b.title);
  });
}

export function visibleTerraces(
  cards: readonly TerraceCard[],
  tray: TerraceTray,
  query: string,
  host: string | null,
  grade: string | "blank" | null,
  pace: Exclude<PaceName, "blank"> | "blank" | null,
  seat: { exact: number | null; pick: SeatPick | null } | null,
  span: 3 | 9 | 15 | "blank" | null,
  rank: 2 | 5 | 8 | "blank" | null,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
  briskOnly: boolean,
): TerraceCard[] {
  const text = query.trim().toLowerCase();
  return readTerraces(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.host}`.toLowerCase().includes(text)) return false;
    if (host !== null && card.host !== host) return false;
    if (grade === "blank" && card.grade) return false;
    if (grade && grade !== "blank" && card.grade !== grade) return false;
    if (pace === "blank" && card.pace) return false;
    if (pace && pace !== "blank" && card.pace !== pace) return false;
    if (seat && !seatHit(card.seat, seat.exact, seat.pick)) return false;
    if (span === "blank" && card.span !== null) return false;
    if (typeof span === "number" && card.span !== span) return false;
    if (rank === "blank") return false;
    if (typeof rank === "number" && card.rank !== rank) return false;
    if (houseOnly && !houseGrade(card.grade)) return false;
    if (peakOnly && !peakSeat(card.seat)) return false;
    if (quietOnly && !quietSeat(card.seat)) return false;
    if (restingOnly && card.rank !== 2) return false;
    if (briskOnly && card.pace !== "brisk") return false;
    return true;
  });
}

export function terraceCopy(card: TerraceCard): string {
  return [card.title, card.host, card.seat ?? "", card.grade, card.pace, card.span ?? "", card.rank, card.tags.join(" ")].join(" · ");
}

export function terracesCsv(cards: readonly TerraceCard[], desk: unknown): string {
  const lines = ["title,host,seat,grade,pace,sla,rank,tags,pinned,held,archived,seal,gap,late,soon,cooling,peak,quiet,house,band,audit,note"];
  for (const card of readTerraces(cards)) {
    const gap = seatGap(card.seat, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.host),
      card.seat === null ? "" : String(card.seat),
      card.grade,
      card.pace,
      card.span === null ? "" : String(card.span),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.archived ? "1" : "0",
      card.seal ? "1" : "0",
      gap === null ? "" : String(gap),
      lateTerrace(card, desk) ? "1" : "0",
      soonTerrace(card) ? "1" : "0",
      coolingTerrace(card) ? "1" : "0",
      peakSeat(card.seat) ? "1" : "0",
      quietSeat(card.seat) ? "1" : "0",
      houseGrade(card.grade) ? "1" : "0",
      seatBand(card.seat),
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}

function readView(raw: unknown): TerraceView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 40),
    host: clip(row.host, 20) || "all",
    grade: activeGrade(clip(row.grade, 12) || "all"),
    pace: clip(row.pace, 8) || "all",
    seat: activeSeat(clip(row.seat, 8) || "all"),
    span: activeSpan(clip(row.span, 4) || "all"),
    rank: activeRank(clip(row.rank, 4) || "all"),
  };
}

export function readTerraceViews(raw: unknown): TerraceView[] {
  if (!Array.isArray(raw)) return [];
  const out: TerraceView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addTerraceView(views: readonly TerraceView[], view: TerraceView): TerraceView[] {
  const current = readTerraceViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name, tray: trayOf(view.tray) }, ...current].slice(0, VIEW_CAP);
}

export function dropTerraceView(views: readonly TerraceView[], id: string): TerraceView[] {
  return readTerraceViews(views).filter((view) => view.id !== id);
}

function colophonParts(value: ColophonValue): { ok: boolean; name: string; ink: string; press: string } {
  if (typeof value === "string") return { ok: true, name: clip(value, 48), ink: "", press: "" };
  if (!value || typeof value !== "object") return { ok: false, name: "", ink: "", press: "" };
  for (const key of MONEY_KEYS) if (key in value) return { ok: false, name: "", ink: "", press: "" };
  const ink = clip(value.ink ?? value.retention, 24).toUpperCase().replace(/[^A-Z]/g, "");
  const press = clip(value.press ?? value.desk, 24);
  return { ok: true, name: clip(value.name, 48), ink, press };
}

export function colophonState(value: ColophonValue): ColophonState {
  const found = colophonParts(value);
  if (!found.ok) return "";
  return found.name ? "set" : "clear";
}

function lettersOf(name: string): string {
  return name.replace(/[^A-Za-z]/g, "");
}

function wordsOf(name: string): string[] {
  return name.split(/\s+/).filter(Boolean);
}

/** The mark is the first letter of the first word and the last letter of the last word. */
export function colophonMark(value: ColophonValue): string {
  const found = colophonParts(value);
  if (!found.ok || !found.name) return "";
  const words = wordsOf(found.name);
  if (!words.length) return "";
  const firstLetters = lettersOf(words[0]);
  const lastWord = [...words].reverse().find((word) => lettersOf(word)) || words[words.length - 1];
  const lastLetters = lettersOf(lastWord);
  const a = firstLetters[0] || "";
  const b = lastLetters.slice(-1) || "";
  return (a + b).toUpperCase();
}

/**
 * A digit in the name is a cipher and wins over the retention status.
 * A blank status is a hall. New, lead, fresh, or open is ink.
 * Active, warm, hot, client, or retained is warm.
 * Cold, dormant, stale, or quiet is cold.
 * Lost, churn, invalid, closed, or dead is lost.
 * Any other status is ink.
 */
export function colophonLane(value: ColophonValue): ColophonLane {
  const found = colophonParts(value);
  if (!found.ok || !found.name) return "";
  if (/\d/.test(found.name)) return "cipher";
  if (!found.ink) return "hall";
  if (INK_LANE.has(found.ink)) return "ink";
  if (WARM_LANE.has(found.ink)) return "warm";
  if (COLD_LANE.has(found.ink)) return "cold";
  if (LOST_LANE.has(found.ink)) return "lost";
  return "ink";
}

/**
 * A blank desk is haze. XX, NONE, or a dash is ash.
 * A desk that starts with a digit is pale.
 * A through M is gilt. N through Z is linen. Anything else is ash.
 */
export function colophonTone(value: ColophonValue): ColophonTone {
  const found = colophonParts(value);
  if (!found.ok || !found.name) return "";
  if (!found.press) return "haze";
  const token = found.press.toUpperCase();
  if (token === "XX" || token === "NONE" || token === "-") return "ash";
  const first = found.press.trim()[0] || "";
  if (/\d/.test(first)) return "pale";
  if (/[A-Ma-m]/.test(first)) return "gilt";
  if (/[N-Zn-z]/.test(first)) return "linen";
  return "ash";
}

export function joinedColophon(value: ColophonValue): boolean {
  const found = colophonParts(value);
  return found.ok && found.name.includes("+");
}

export function wideColophon(value: ColophonValue): boolean {
  const found = colophonParts(value);
  return found.ok && lettersOf(found.name).length >= 16;
}

/** 0 is blank, 1 is one word, 2 is two words or more. */
export function colophonStep(value: ColophonValue): 0 | 1 | 2 {
  const found = colophonParts(value);
  if (!found.ok || !found.name) return 0;
  const words = wordsOf(found.name);
  if (words.length <= 1) return 1;
  return 2;
}

export function colophonLanes(rows: readonly ColophonRow[]): ColophonLaneLine[] {
  const lanes = ["hall", "ink", "warm", "cold", "lost", "cipher"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => colophonLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps cipher, then ink, warm, cold, lost, and hall. */
export function leadingColophon(rows: readonly ColophonRow[]): string {
  const lines = colophonLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingColophonTone(rows: readonly ColophonRow[]): string {
  const lines = TONE_ORDER.map((tone) => ({ tone, count: rows.filter((row) => colophonTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || TONE_ORDER.indexOf(a.tone) - TONE_ORDER.indexOf(b.tone))[0].tone;
}

export function colophonShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function sharedColophonCount(rows: readonly ColophonRow[]): number {
  const marks = rows.map((row) => colophonMark(row.note)).filter(Boolean);
  return rows.filter((row) => {
    const mark = colophonMark(row.note);
    return Boolean(mark) && marks.filter((item) => item === mark).length > 1;
  }).length;
}

export function hallColophonCount(rows: readonly ColophonRow[]): number {
  return rows.filter((row) => colophonLane(row.note) === "hall").length;
}

export function inkColophonCount(rows: readonly ColophonRow[]): number {
  return rows.filter((row) => colophonLane(row.note) === "ink").length;
}

export function warmColophonCount(rows: readonly ColophonRow[]): number {
  return rows.filter((row) => colophonLane(row.note) === "warm").length;
}

export function coldColophonCount(rows: readonly ColophonRow[]): number {
  return rows.filter((row) => colophonLane(row.note) === "cold").length;
}

export function lostColophonCount(rows: readonly ColophonRow[]): number {
  return rows.filter((row) => colophonLane(row.note) === "lost").length;
}

export function cipherColophonCount(rows: readonly ColophonRow[]): number {
  return rows.filter((row) => colophonLane(row.note) === "cipher").length;
}

export function giltColophonCount(rows: readonly ColophonRow[]): number {
  return rows.filter((row) => colophonTone(row.note) === "gilt").length;
}

export function joinedColophonCount(rows: readonly ColophonRow[]): number {
  return rows.filter((row) => joinedColophon(row.note)).length;
}

export function presentColophonLanes(rows: readonly ColophonRow[]): string[] {
  return colophonLanes(rows).map((line) => line.lane);
}

export function readHiddenColophons(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if (!allow.has(lane) || out.includes(lane)) continue;
    out.push(lane);
  }
  return out;
}

export function readReviewedColophons(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (!allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function toggleColophon(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleColophonReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkColophonReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleColophonLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function colophonLaneArg(filter: string): ColophonLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "hall" || filter === "ink" || filter === "warm" || filter === "cold" || filter === "lost" || filter === "cipher") return filter;
  return null;
}

export function activeColophonLane(filter: string, lanes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return lanes.includes(filter) ? filter : "all";
}

export function colophonToneArg(filter: string): ColophonTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "linen" || filter === "pale" || filter === "ash" || filter === "haze") return filter;
  return null;
}

export function activeColophonTone(filter: string): string {
  return colophonToneArg(filter) || filter === "all" ? filter : "all";
}

export function visibleColophons(
  rows: readonly ColophonRow[],
  lane: ColophonLane | "blank" | null,
  tone: ColophonTone | null,
  query: string,
  review: ColophonReview,
  reviewed: readonly string[],
  shape: ColophonShape,
): ColophonRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const found = colophonParts(row.note);
    if (!found.ok) return false;
    if (text && !`${found.name} ${row.label}`.toLowerCase().includes(text)) return false;
    const current = colophonLane(row.note);
    if (lane === "blank" && current) return false;
    if (lane && lane !== "blank" && current !== lane) return false;
    if (tone && colophonTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "join" && !joinedColophon(row.note)) return false;
    if (shape === "wide" && !wideColophon(row.note)) return false;
    if (shape === "hall" && current !== "hall") return false;
    if (shape === "cipher" && current !== "cipher") return false;
    if (shape === "ink" && current !== "ink") return false;
    return true;
  });
}

export function colophonsCsv(rows: readonly ColophonRow[]): string {
  const lines = ["lane,count"];
  for (const line of colophonLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function colophonRowsCsv(rows: readonly ColophonRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,tone,step,join,wide,hall,ink,warm,cold,lost,cipher,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = colophonParts(row.note);
    if (!found.ok) continue;
    const lane = colophonLane(row.note);
    lines.push([
      csvCell(found.name),
      colophonMark(row.note),
      lane,
      colophonTone(row.note),
      String(colophonStep(row.note)),
      joinedColophon(row.note) ? "1" : "0",
      wideColophon(row.note) ? "1" : "0",
      lane === "hall" ? "1" : "0",
      lane === "ink" ? "1" : "0",
      lane === "warm" ? "1" : "0",
      lane === "cold" ? "1" : "0",
      lane === "lost" ? "1" : "0",
      lane === "cipher" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function colophonCopy(value: ColophonValue): string {
  const found = colophonParts(value);
  if (!found.ok) return "";
  return [found.name, colophonMark(value), colophonLane(value), colophonTone(value)].join(" · ");
}
