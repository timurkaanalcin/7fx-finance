/**
 * Seat cards for the customers salon, and group marks already stored as tradingGroup on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_seat_card (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   host text not null default '',
 *   seat integer,
 *   cloth text not null default '',
 *   pace text not null default '',
 *   wait integer,
 *   rank integer not null default 0,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_group_mark_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_group_mark_review (
 *   customer_id text primary key
 * );
 */

export const STC_KEY = "crmv4-seat-card";
export const STC_VIEW_KEY = "crmv4-seat-views";
export const STC_DENSITY_KEY = "crmv4-seat-density";
export const GMK_KEY = "crmv4-group-mark-hide";
export const GMK_REVIEW_KEY = "crmv4-group-mark-review";

export type ClothName = "blank" | "slate" | "ivory" | "gilt";

export type PaceName = "blank" | "still" | "walk" | "rush";

export type SeatTray = "open" | "held" | "archived";

export type SeatPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type SeatDensity = "airy" | "tight";

export type SeatSort = "seat" | "host";

export type SeatCard = {
  id: string;
  title: string;
  note: string;
  host: string;
  seat: number | null;
  cloth: string;
  pace: string;
  wait: number | null;
  rank: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  audit: string;
};

export type SeatView = {
  id: string;
  name: string;
  tray: SeatTray;
  query: string;
  host: string;
  cloth: string;
  pace: string;
  seat: string;
  wait: string;
  rank: string;
};

export type SeatCounts = {
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
};

const AUDITS = ["save", "edit", "pace", "pin", "unpin", "hold", "resume", "archive", "open", "cloth", "tag", "rank", "wait"] as const;

const CLOTHS = ["slate", "ivory", "gilt"] as const;

const PACES = ["still", "walk", "rush"] as const;

const PACE_CYCLE = ["still", "walk", "rush"] as const;

const PEAK_SEATS = new Set([3, 6]);

const QUIET_SEATS = new Set([8]);

const HOUSE = new Set(["IVORY", "GILT"]);

const PEN_CAP = 12;

const VIEW_CAP = 6;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SeatTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ClothName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<ClothName, "blank">) : "";
}

function paceName(raw: unknown): Exclude<PaceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<PaceName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function cardLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function cardNote(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank host stays blank. It is not filled in. */
export function hostLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A cloth is SLATE, IVORY, or GILT. Anything else stays blank. Letters are stored in capitals. */
export function clothOf(raw: unknown): string {
  const name = clothName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A seat is an integer from 1 through 8.
 * A blank value stays unset. 0 is not a seat.
 * A second digit is not a seat.
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

/** A wait is 5, 15, or 45. A blank value stays unset. A leading zero is not a wait. */
export function waitOf(raw: unknown): 5 | 15 | 45 | null {
  if (raw === 5 || raw === "5") return 5;
  if (raw === 15 || raw === "15") return 15;
  if (raw === 45 || raw === "45") return 45;
  return null;
}

/** Rank is 0, 2, or 4. Anything else is not a rank. 0 clears the rank. */
export function rankOf(raw: unknown): 0 | 2 | 4 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  return null;
}

export function seatBand(seat: unknown): "blank" | "early" | "mid" | "late" {
  const value = seatOf(seat);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 6) return "mid";
  return "late";
}

/** Peak seats are 2 and 5. An unset seat is not a peak seat. */
export function peakSeat(seat: unknown): boolean {
  const value = seatOf(seat);
  return value !== null && PEAK_SEATS.has(value);
}

/** The quiet seat is 9. A peak seat is not quiet. An unset seat is not quiet. */
export function quietSeat(seat: unknown): boolean {
  const value = seatOf(seat);
  return value !== null && QUIET_SEATS.has(value);
}

/**
 * How far a seat sits behind the desk seat.
 * A positive gap means the card is behind. A negative gap means it is ahead.
 * A gap of zero means the same seat. An unset seat has no gap. Nibs do not wrap.
 */
export function seatGap(seat: unknown, desk: unknown): number | null {
  const from = seatOf(seat);
  const at = seatOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** IVORY and GILT are house cloths. SLATE is a guest cloth. A blank cloth is not a house cloth. */
export function houseCloth(cloth: unknown): boolean {
  return HOUSE.has(clothOf(cloth));
}

/** Airy or tight. Anything else stays airy. */
export function densityOf(raw: unknown): SeatDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** Nib or host. Anything else stays on the seat. */
export function sortMode(raw: unknown): SeatSort {
  return raw === "host" ? "host" : "seat";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[e-g]$/.test(text) ? text : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,\s]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = tagOf(part);
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length >= TAG_CAP) break;
  }
  return out;
}

function readOne(raw: unknown): SeatCard | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<SeatCard>;
  const id = clip(row.id, 24);
  const title = cardLine(row.title);
  if (!id || !title) return null;
  const rank = rankOf(row.rank);
  return {
    id,
    title,
    note: cardNote(row.note),
    host: hostLabel(row.host),
    seat: seatOf(row.seat),
    cloth: clothOf(row.cloth),
    pace: paceName(row.pace),
    wait: waitOf(row.wait),
    rank: rank === null ? 0 : rank,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    audit: auditCode(row.audit),
  };
}

export function readCards(raw: unknown): SeatCard[] {
  if (!Array.isArray(raw)) return [];
  const out: SeatCard[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, PEN_CAP);
}

export function addCard(
  cards: readonly SeatCard[],
  card: {
    id: string;
    title: string;
    note?: string;
    host?: string;
    seat?: unknown;
    cloth?: string;
    pace?: string;
    wait?: unknown;
    rank?: unknown;
    tags?: unknown;
  },
): SeatCard[] {
  const current = readCards(cards);
  const id = String(card.id || "").trim();
  const title = cardLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rank = rankOf(card.rank);
  const next: SeatCard = {
    id,
    title,
    note: cardNote(card.note),
    host: hostLabel(card.host),
    seat: seatOf(card.seat),
    cloth: clothOf(card.cloth),
    pace: paceName(card.pace),
    wait: waitOf(card.wait),
    rank: rank === null ? 0 : rank,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    archived: false,
    audit: "save",
  };
  return [next, ...current].slice(0, PEN_CAP);
}

/** A blank pace becomes dry, dry becomes wet, wet becomes flood, and flood returns to dry. */
export function cyclePace(cards: readonly SeatCard[], id: string): SeatCard[] {
  return readCards(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_CYCLE.indexOf(card.pace as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    if (!next || next === card.pace) return card;
    return { ...card, pace: next, audit: "pace" };
  });
}

/** A blank title is left as it is. */
export function editCard(cards: readonly SeatCard[], id: string, title: unknown): SeatCard[] {
  const next = cardLine(title);
  if (!next) return readCards(cards);
  const current = readCards(cards);
  if (current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left as it is. */
export function editCardNote(cards: readonly SeatCard[], id: string, note: unknown): SeatCard[] {
  const next = cardNote(note);
  if (!next) return readCards(cards);
  return readCards(cards).map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

/** A tag that is already on the card, or a fourth tag, is left out. A tag is one letter from e to g. */
export function addCardTag(cards: readonly SeatCard[], id: string, tag: unknown): SeatCard[] {
  const next = tagOf(tag);
  if (!next) return readCards(cards);
  return readCards(cards).map((card) => {
    if (card.id !== id || card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** An unknown rank is left as it is. 0 clears the rank. */
export function setCardRank(cards: readonly SeatCard[], id: string, rank: unknown): SeatCard[] {
  const next = rankOf(rank);
  if (next === null) return readCards(cards);
  return readCards(cards).map((card) => (card.id === id && card.rank !== next ? { ...card, rank: next, audit: "rank" } : card));
}

/** Three wait become 6, six wait become 9, and nine wait stay. An unset count becomes 3. */
export function snoozeCard(cards: readonly SeatCard[], id: string): SeatCard[] {
  return readCards(cards).map((card) => {
    if (card.id !== id) return card;
    const next = card.wait === 5 ? 15 : card.wait === 15 ? 45 : card.wait === 45 ? 45 : 5;
    if (next === card.wait) return card;
    return { ...card, wait: next, audit: "wait" };
  });
}

export function setCardPin(cards: readonly SeatCard[], id: string, pinned: boolean): SeatCard[] {
  return readCards(cards).map((card) => (card.id === id && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

/** P toggles the pin on the focused row of the board currently shown. */
export function pinFocused(cards: readonly SeatCard[], shownIds: readonly string[], index: number): SeatCard[] {
  if (!shownIds.length) return readCards(cards);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readCards(cards).find((card) => card.id === id);
  if (!row) return readCards(cards);
  return setCardPin(cards, id, !row.pinned);
}

/** L lengthens the wait on the focused card. */
export function snoozeFocused(cards: readonly SeatCard[], shownIds: readonly string[], index: number): SeatCard[] {
  if (!shownIds.length) return readCards(cards);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readCards(cards).some((card) => card.id === id)) return readCards(cards);
  return snoozeCard(cards, id);
}

/** H toggles the hold on the focused row. */
export function holdFocused(cards: readonly SeatCard[], shownIds: readonly string[], index: number): SeatCard[] {
  if (!shownIds.length) return readCards(cards);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readCards(cards).find((card) => card.id === id);
  if (!row) return readCards(cards);
  return setCardHold(cards, id, !row.held);
}

/** S cycles the pace on the focused card. */
export function paceFocused(cards: readonly SeatCard[], shownIds: readonly string[], index: number): SeatCard[] {
  if (!shownIds.length) return readCards(cards);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readCards(cards).some((card) => card.id === id)) return readCards(cards);
  return cyclePace(cards, id);
}

export function setCardHold(cards: readonly SeatCard[], id: string, held: boolean): SeatCard[] {
  return readCards(cards).map((card) => (card.id === id && card.held !== held ? { ...card, held, audit: held ? "hold" : "resume" } : card));
}

export function setCardArchive(cards: readonly SeatCard[], id: string, archived: boolean): SeatCard[] {
  return readCards(cards).map((card) => (card.id === id && card.archived !== archived ? { ...card, archived, audit: archived ? "archive" : "open" } : card));
}

export function bulkCardCloth(cards: readonly SeatCard[], ids: readonly string[], cloth: unknown): SeatCard[] {
  const next = clothOf(cloth);
  if (!next) return readCards(cards);
  const picked = new Set(ids);
  return readCards(cards).map((card) => (picked.has(card.id) && card.cloth !== next ? { ...card, cloth: next, audit: "cloth" } : card));
}

export function bulkCardPin(cards: readonly SeatCard[], ids: readonly string[], pinned: boolean): SeatCard[] {
  const picked = new Set(ids);
  return readCards(cards).map((card) => (picked.has(card.id) && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkCardArchive(cards: readonly SeatCard[], ids: readonly string[], archived: boolean): SeatCard[] {
  const picked = new Set(ids);
  return readCards(cards).map((card) => (picked.has(card.id) && card.archived !== archived ? { ...card, archived, audit: archived ? "archive" : "open" } : card));
}

export function bulkCardPace(cards: readonly SeatCard[], ids: readonly string[], pace: unknown): SeatCard[] {
  const next = paceName(pace);
  if (!next) return readCards(cards);
  const picked = new Set(ids);
  return readCards(cards).map((card) => (picked.has(card.id) && card.pace !== next ? { ...card, pace: next, audit: "pace" } : card));
}

export function bulkCardTag(cards: readonly SeatCard[], ids: readonly string[], tag: unknown): SeatCard[] {
  return ids.reduce((rows, id) => addCardTag(rows, id, tag), readCards(cards));
}

export function resetCards(): SeatCard[] {
  return [];
}

function inTray(card: SeatCard, tray: SeatTray): boolean {
  if (tray === "archived") return card.archived;
  if (tray === "held") return card.held && !card.archived;
  return !card.held && !card.archived;
}

function seatHit(seat: number | null, exact: number | null, pick: SeatPick | null): boolean {
  if (exact !== null) return seat === exact;
  if (pick === null) return true;
  if (pick === "blank") return seat === null;
  if (pick === "peak") return peakSeat(seat);
  if (pick === "quiet") return quietSeat(seat);
  return seatBand(seat) === pick;
}

/** An open card whose seat sits more than two seats behind the desk. Rank, a hold, or an archive is not late. */
export function lateCard(card: SeatCard, desk: unknown): boolean {
  const gap = seatGap(card.seat, desk);
  return inTray(card, "open") && card.rank === 0 && gap !== null && gap > 2;
}

/** An open card with 3 wait is due now. Weight, a hold, or an archive is not. */
export function soonCard(card: SeatCard): boolean {
  return inTray(card, "open") && card.rank === 0 && card.wait === 5;
}

/** Open cards that are late or due now. A ranked card stays off the reminder list. */
export function reminderCards(cards: readonly SeatCard[], desk: unknown): SeatCard[] {
  return readCards(cards).filter((card) => lateCard(card, desk) || soonCard(card));
}

/** Open cards whose seat sits within two seats of the desk. Rank, a hold, or an archive stays out. */
export function windowCards(cards: readonly SeatCard[], desk: unknown): SeatCard[] {
  return readCards(cards).filter((card) => {
    const gap = seatGap(card.seat, desk);
    return inTray(card, "open") && card.rank === 0 && gap !== null && Math.abs(gap) <= 2;
  });
}

/** Open light cards whose seat is the desk seat. */
export function matchedCards(cards: readonly SeatCard[], desk: unknown): number {
  const at = seatOf(desk);
  if (at === null) return 0;
  return readCards(cards).filter((card) => inTray(card, "open") && card.rank === 0 && card.seat === at).length;
}

/** Search matches the title, the note, the host, and the tags. */
export function visibleCards(
  cards: readonly SeatCard[],
  tray: SeatTray,
  query: string,
  host: string | null,
  cloth: string | null,
  pace: string | null,
  exact: number | null,
  pick: SeatPick | null,
  wait: number | "blank" | null,
  rank: number | "blank" | null,
  rushOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  lightOnly: boolean,
): SeatCard[] {
  const text = query.trim().toLowerCase();
  return readCards(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text) {
      const hay = `${card.title} ${card.note} ${card.host} ${card.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (host !== null && card.host !== host) return false;
    if (cloth === "blank" ? Boolean(card.cloth) : cloth && card.cloth !== cloth) return false;
    if (pace === "blank" ? Boolean(card.pace) : pace && card.pace !== pace) return false;
    if (!seatHit(card.seat, exact, pick)) return false;
    if (wait === "blank" ? card.wait !== null : wait !== null && card.wait !== wait) return false;
    if (rank === "blank" ? card.rank !== 0 : rank !== null && card.rank !== rank) return false;
    if (rushOnly && card.pace !== "rush") return false;
    if (peakOnly && !peakSeat(card.seat)) return false;
    if (houseOnly && !houseCloth(card.cloth)) return false;
    if (quietOnly && !quietSeat(card.seat)) return false;
    if (lightOnly && card.rank !== 0) return false;
    return true;
  });
}

export function sortCards(cards: readonly SeatCard[], mode: SeatSort): SeatCard[] {
  const rows = cards.slice();
  if (mode === "host") return rows.sort((a, b) => a.host.localeCompare(b.host) || (a.seat ?? 99) - (b.seat ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.seat ?? 99) - (b.seat ?? 99) || a.title.localeCompare(b.title));
}

export function cardLedger(cards: readonly SeatCard[], query: string): SeatCard[] {
  const text = query.trim().toLowerCase();
  return sortCards(
    readCards(cards).filter((card) => card.seat !== null && (!text || card.title.toLowerCase().includes(text))),
    "seat",
  );
}

export function cardCounts(cards: readonly SeatCard[], desk: unknown): SeatCounts {
  const rows = readCards(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    archived: rows.filter((card) => inTray(card, "archived")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => inTray(card, "open") && card.rank === 0 && peakSeat(card.seat)).length,
    late: rows.filter((card) => lateCard(card, desk)).length,
    soon: rows.filter((card) => soonCard(card)).length,
    rank: rows.filter((card) => inTray(card, "open") && card.rank > 0).length,
    house: rows.filter((card) => inTray(card, "open") && houseCloth(card.cloth)).length,
    window: windowCards(rows, desk).length,
    matched: matchedCards(rows, desk),
  };
}

export function cardShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open cards as a share of every open card. */
export function lateShare(cards: readonly SeatCard[], desk: unknown): number {
  const rows = readCards(cards);
  const open = rows.filter((card) => inTray(card, "open")).length;
  const late = rows.filter((card) => lateCard(card, desk)).length;
  return cardShare(late, open);
}

/** Distinct seats on open cards. */
export function usedSeats(cards: readonly SeatCard[]): number {
  const seats = new Set<number>();
  for (const card of readCards(cards)) {
    if (inTray(card, "open") && card.seat !== null) seats.add(card.seat);
  }
  return seats.size;
}

/** Open cards that share a seat and an cloth. A different cloth on the same seat is not a clash. */
export function clashSeatCount(cards: readonly SeatCard[]): number {
  const groups = new Map<string, number>();
  for (const card of readCards(cards)) {
    if (!inTray(card, "open") || card.seat === null || !card.cloth) continue;
    const key = `${card.seat}:${card.cloth}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open cards that share a drop count. An unset count is not a clash. */
export function waitClashCount(cards: readonly SeatCard[]): number {
  const groups = new Map<number, number>();
  for (const card of readCards(cards)) {
    if (!inTray(card, "open") || card.wait === null) continue;
    groups.set(card.wait, (groups.get(card.wait) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open cards in the same cloth whose seats differ by three.
 * The count is the cards that have at least one neighbor.
 */
export function adjacentCardCount(cards: readonly SeatCard[]): number {
  const open = readCards(cards).filter((card) => inTray(card, "open") && card.seat !== null && card.cloth);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.cloth === right.cloth && Math.abs((left.seat ?? 0) - (right.seat ?? 0)) === 3) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The cloth with the fewest open cards.
 * A tie keeps SLATE, then IVORY, then GILT.
 * An empty desk still suggests SLATE.
 */
export function suggestCloth(cards: readonly SeatCard[]): "SLATE" | "IVORY" | "GILT" {
  const rows = readCards(cards).filter((card) => inTray(card, "open"));
  const order = ["SLATE", "IVORY", "GILT"] as const;
  let best: "SLATE" | "IVORY" | "GILT" = "SLATE";
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
 * The wait with the fewest open cards.
 * A tie keeps 15, then 5, then 45.
 * An empty desk still suggests 15.
 */
export function suggestWait(cards: readonly SeatCard[]): 5 | 15 | 45 {
  const rows = readCards(cards).filter((card) => inTray(card, "open"));
  const order = [15, 5, 45] as const;
  let best: 5 | 15 | 45 = 15;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const wait of order) {
    const count = rows.filter((card) => card.wait === wait).length;
    if (count < bestCount) {
      best = wait;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open host. A blank host is skipped. An empty desk stays blank. */
export function suggestHost(cards: readonly SeatCard[]): string {
  const found = readCards(cards).find((card) => inTray(card, "open") && card.host);
  return found ? found.host : "";
}

/**
 * The host carrying the fewest open cards.
 * A tie keeps the earlier name. A blank host is not a load.
 * An empty roster falls back to the newest host.
 */
export function fairHost(cards: readonly SeatCard[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = hostLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestHost(cards);
  const open = readCards(cards).filter((card) => inTray(card, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.host === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The host with the most open cards. A tie keeps the newer name on the desk. */
export function busiestHost(cards: readonly SeatCard[]): string {
  const rows = readCards(cards).filter((card) => inTray(card, "open") && card.host);
  const names: string[] = [];
  for (const card of rows) if (!names.includes(card.host)) names.push(card.host);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((card) => card.host === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function cardHosts(cards: readonly SeatCard[]): string[] {
  const out: string[] = [];
  for (const card of readCards(cards)) {
    if (card.host && !out.includes(card.host)) out.push(card.host);
  }
  return out;
}

export function cardCloths(cards: readonly SeatCard[]): string[] {
  const out: string[] = [];
  for (const card of readCards(cards)) {
    if (card.cloth && !out.includes(card.cloth)) out.push(card.cloth);
  }
  return out;
}

/** Open cards whose host also keeps another open card on a different seat. */
export function pairHostCount(cards: readonly SeatCard[]): number {
  const open = readCards(cards).filter((card) => inTray(card, "open") && card.host && card.seat !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].host === open[j].host && open[i].seat !== open[j].seat) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open cards that share an cloth on different seats. */
export function sharedClothCount(cards: readonly SeatCard[]): number {
  const open = readCards(cards).filter((card) => inTray(card, "open") && card.cloth && card.seat !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].cloth === open[j].cloth && open[i].seat !== open[j].seat) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The rank of open cards. A clear rank adds nothing. */
export function rankLoad(cards: readonly SeatCard[]): number {
  return readCards(cards).filter((card) => inTray(card, "open")).reduce((sum, card) => sum + card.rank, 0);
}

/** Open cards that are both the quiet seat and a house cloth. */
export function quietSalonCount(cards: readonly SeatCard[]): number {
  return readCards(cards).filter((card) => inTray(card, "open") && quietSeat(card.seat) && houseCloth(card.cloth)).length;
}

/** Open cards whose pace is flood. */
export function rushLoad(cards: readonly SeatCard[]): number {
  return readCards(cards).filter((card) => inTray(card, "open") && card.pace === "rush").length;
}

/** The span from the lowest open seat to the highest. Fewer than two seats span nothing. */
export function seatSpan(cards: readonly SeatCard[]): number {
  const seats = readCards(cards).filter((card) => inTray(card, "open") && card.seat !== null).map((card) => card.seat as number);
  if (seats.length < 2) return 0;
  return Math.max(...seats) - Math.min(...seats);
}

/**
 * The next open card at or after the desk seat.
 * A flood pace, rank, a hold, and an archive stay off the list.
 * When every open seat is behind, the earliest seat is next.
 */
export function nextCard(cards: readonly SeatCard[], desk: unknown): string {
  const now = seatOf(desk);
  if (now === null) return "";
  const waiting = readCards(cards).filter((card) => inTray(card, "open") && card.seat !== null && card.pace !== "rush" && card.rank === 0);
  if (!waiting.length) return "";
  const bySeat = (a: SeatCard, b: SeatCard) => (a.seat ?? 0) - (b.seat ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.seat ?? 0) >= now).sort(bySeat);
  const upcoming = later[0];
  if (upcoming) return upcoming.id;
  const earliest = waiting.slice().sort(bySeat)[0];
  return earliest ? earliest.id : "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function cardCopy(card: SeatCard, desk: unknown): string {
  const gap = seatGap(card.seat, desk);
  return [card.title, card.host, card.seat ?? "", card.cloth, card.pace, card.wait ?? "", card.rank, card.tags.join(" "), card.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The gap and the late mark use the seat you pass. */
export function cardsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,host,seat,cloth,pace,wait,rank,tags,pinned,held,archived,gap,late,soon,house,window,matched,note,audit"];
  const rows = readCards(raw);
  const windowIds = new Set(windowCards(rows, desk).map((card) => card.id));
  const at = seatOf(desk);
  for (const card of rows) {
    const gap = seatGap(card.seat, desk);
    lines.push([
      card.title,
      card.host,
      card.seat === null ? "" : String(card.seat),
      card.cloth,
      card.pace,
      card.wait === null ? "" : String(card.wait),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.archived ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCard(card, desk) ? "1" : "0",
      soonCard(card) ? "1" : "0",
      houseCloth(card.cloth) ? "1" : "0",
      windowIds.has(card.id) ? "1" : "0",
      at !== null && card.seat === at && card.rank === 0 && inTray(card, "open") ? "1" : "0",
      card.note,
      card.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeHost(raw: string, hosts: readonly string[]): string {
  if (raw === "blank") return "blank";
  return hosts.includes(raw) ? raw : "all";
}

export function activeCloth(raw: string, cloths: readonly string[]): string {
  if (raw === "blank") return "blank";
  return clothOf(raw) && cloths.includes(clothOf(raw)) ? clothOf(raw) : "all";
}

export function activePace(raw: string, paces: readonly string[]): string {
  if (raw === "blank") return "blank";
  const pace = paceName(raw);
  return pace && paces.includes(pace) ? pace : "all";
}

export function activeSeat(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const seat = seatOf(raw);
  return seat === null ? "all" : String(seat);
}

export function activeWait(raw: string): string {
  if (raw === "blank") return "blank";
  const wait = waitOf(raw);
  return wait === null ? "all" : String(wait);
}

export function activeRank(raw: string): string {
  if (raw === "blank") return "blank";
  const rank = rankOf(raw);
  return rank === null ? "all" : String(rank);
}

export function hostArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function clothArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return clothOf(filter) || null;
}

export function paceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function seatArg(filter: string): { exact: number | null; pick: SeatPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: seatOf(filter), pick: null };
}

export function waitArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return waitOf(filter);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

function readView(raw: unknown): SeatView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<SeatView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    host: row.host === "blank" ? "blank" : clip(row.host, 16) || "all",
    cloth: row.cloth === "blank" || row.cloth === "all" ? (row.cloth === "blank" ? "blank" : "all") : clothOf(row.cloth) || "all",
    pace: row.pace === "blank" || row.pace === "all" ? (row.pace === "blank" ? "blank" : "all") : paceName(row.pace) || "all",
    seat: activeSeat(String(row.seat || "all")),
    wait: activeWait(String(row.wait || "all")),
    rank: activeRank(String(row.rank || "all")),
  };
}

export function readSeatViews(raw: unknown): SeatView[] {
  if (!Array.isArray(raw)) return [];
  const out: SeatView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addSeatView(views: readonly SeatView[], view: SeatView): SeatView[] {
  const current = readSeatViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropSeatView(views: readonly SeatView[], id: string): SeatView[] {
  return readSeatViews(views).filter((view) => view.id !== id);
}

export type MarkState = "" | "set" | "clear";

export type MarkLane = "" | "salon" | "floor" | "yard";

export type MarkTone = "" | "gilt" | "ink" | "ivory" | "mist";

export type MarkShape = "all" | "catalog" | "wide" | "gilt";

export type MarkValue =
  | string
  | { tradingGroup?: unknown; email?: unknown; phone?: unknown; affiliateA?: unknown; affiliateB?: unknown; affiliateC?: unknown; language?: unknown; address?: unknown; country?: unknown; city?: unknown; desk?: unknown; name?: unknown; username?: unknown; accountType?: unknown; lastBrowser?: unknown; isResident?: unknown; documentsStatus?: unknown }
  | null
  | undefined;

export type MarkRow = { id: string; label?: string; note: MarkValue };

export type MarkLaneLine = { lane: string; count: number };

const MARK_LANES = ["salon", "floor", "yard"] as const;

const MARK_TONES = ["gilt", "ink", "ivory", "mist"] as const;

const MARK_BLOCK = ["email", "phone", "affiliateA", "affiliateB", "affiliateC", "language", "address", "country", "city", "desk", "name", "username", "accountType", "lastBrowser", "isResident", "documentsStatus"] as const;

const CATALOG = new Set(["standard", "vip", "gold", "ivory", "desk"]);

const SALON = new Set(["vip", "gold", "ivory", "desk"]);

function markBody(raw: unknown): string {
  return clip(raw, 32).toLowerCase().replace(/[^a-z0-9 _-]/g, "").replace(/\s+/g, " ").trim();
}

function markText(value: MarkValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string" || value == null) {
    if (value == null) return { text: "", explicit: true };
    return { text: markBody(value), explicit: true };
  }
  if (typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (MARK_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("tradingGroup" in value)) return { text: null, explicit: false };
  const inner = value.tradingGroup;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: markBody(inner), explicit: true };
}

export function markState(value: MarkValue): MarkState {
  const found = markText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function markCopy(value: MarkValue): string {
  const found = markText(value);
  return found.explicit && found.text ? found.text : "";
}

/** The mark is the first four characters, with spaces left out. */
export function markOf(value: MarkValue): string {
  const text = markCopy(value).replace(/ /g, "");
  if (!text) return "";
  return text.slice(0, 4).toUpperCase();
}

/**
 * A group whose first word is vip, gold, ivory, or desk, or a group that contains 7fx, is the salon.
 * Any other group with a digit is the floor.
 * Any other text is the yard.
 */
export function markLane(value: MarkValue): MarkLane {
  const text = markCopy(value);
  if (!text) return "";
  const headWord = text.split(/[\s-]/)[0] || "";
  if (SALON.has(headWord) || text.includes("7fx")) return "salon";
  if (/[0-9]/.test(text)) return "floor";
  return "yard";
}

/** vip or gold is gilt. A group longer than ten characters is ivory. A group with no digit is mist. Anything else is ink. */
export function markTone(value: MarkValue): MarkTone {
  const text = markCopy(value);
  if (!text) return "";
  if (text.includes("vip") || text.includes("gold")) return "gilt";
  if (text.length > 10) return "ivory";
  if (!/[0-9]/.test(text)) return "mist";
  return "ink";
}

/** standard, vip, gold, ivory, and desk belong to the house book. */
export function catalogMark(value: MarkValue): boolean {
  return CATALOG.has(markCopy(value));
}

export function catalogMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => catalogMark(row.note)).length;
}

/** A group longer than ten characters is wide. */
export function wideMark(value: MarkValue): boolean {
  const text = markCopy(value);
  return text.length > 10;
}

export function wideMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => wideMark(row.note)).length;
}

export function giltMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => markTone(row.note) === "gilt").length;
}

/** Customers whose group mark is shared with at least one other customer. */
export function sharedMarkCount(rows: readonly MarkRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = markOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function markLanes(rows: readonly MarkRow[]): MarkLaneLine[] {
  return MARK_LANES.map((lane) => ({ lane, count: rows.filter((row) => markLane(row.note) === lane).length }));
}

/** The lane with the most set marks. A tie keeps salon, then floor, then yard. */
export function leadingMark(rows: readonly MarkRow[]): string {
  const lines = markLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || MARK_LANES.indexOf(a.lane as (typeof MARK_LANES)[number]) - MARK_LANES.indexOf(b.lane as (typeof MARK_LANES)[number]))[0];
  return lead ? lead.lane : "";
}

/** The tone with the most set marks. A tie keeps gilt, then ink, then ivory, then mist. */
export function leadingMarkTone(rows: readonly MarkRow[]): string {
  const counts = MARK_TONES.map((tone) => ({ tone, count: rows.filter((row) => markTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || MARK_TONES.indexOf(a.tone) - MARK_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function markShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** A clear group is 0. A plain group is 1, a hyphen is 2, and a digit is 3. */
export function markStep(value: MarkValue): 0 | 1 | 2 | 3 {
  const text = markCopy(value);
  if (!text) return 0;
  if (/[0-9]/.test(text)) return 3;
  if (text.includes("-")) return 2;
  return 1;
}

export function presentMarks(rows: readonly MarkRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = markState(row.note);
    const lane = state === "set" ? markLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenMarks(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = String(item);
    if (allow.has(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedMarks(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleMark(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleMarkReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkMarkReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleMarkLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function visibleMarkCustomers(
  rows: readonly MarkRow[],
  lane: MarkLane | "blank" | null,
  tone: MarkTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: MarkShape,
): MarkRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = markState(row.note);
    const mark = state === "set" ? markLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && mark !== lane) return false;
    if (tone && markTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogMark(row.note)) return false;
    if (shape === "wide" && !wideMark(row.note)) return false;
    if (shape === "gilt" && markTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${markCopy(row.note)} ${markOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeMarkLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeMarkTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "mist" ? raw : "all";
}

export function markLaneArg(filter: string): MarkLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "salon" || filter === "floor" || filter === "yard") return filter;
  return null;
}

export function markToneArg(filter: string): MarkTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "mist") return filter;
  return null;
}

export function marksCsv(rows: readonly MarkRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of markLanes(rows)) lines.push(`lane,${line.lane},${line.count}`);
  lines.push(`catalog,catalog,${catalogMarkCount(rows)}`);
  lines.push(`wide,wide,${wideMarkCount(rows)}`);
  lines.push(`tone,gilt,${giltMarkCount(rows)}`);
  lines.push(`tone,mist,${rows.filter((row) => markTone(row.note) === "mist").length}`);
  lines.push(`shared,shared,${sharedMarkCount(rows)}`);
  return lines.join("\n");
}

export function markRowsCsv(rows: readonly MarkRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,mark,lane,tone,step,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = markState(row.note);
    const lane = state === "set" ? markLane(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      markOf(row.note),
      lane,
      state === "set" ? markTone(row.note) : "",
      String(markStep(row.note)),
      catalogMark(row.note) ? "1" : "0",
      wideMark(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
