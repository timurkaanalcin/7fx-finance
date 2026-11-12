/**
 * Visit cards for retention follow-ups, and stage marks already stored as name, stage, and source.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_visit_card (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   host text not null default '',
 *   slot integer,
 *   timber text not null default '',
 *   pace text not null default '',
 *   call integer,
 *   rank integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_stage_mark_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_stage_mark_review (
 *   lead_id text primary key
 * );
 */

export const VCD_KEY = "crmv4-visit-card";
export const VCD_VIEW_KEY = "crmv4-visit-card-views";
export const VCD_DENSITY_KEY = "crmv4-visit-card-density";
export const SMK_KEY = "crmv4-stage-mark-hide";
export const SMK_REVIEW_KEY = "crmv4-stage-mark-review";

export type TimberName = "blank" | "oak" | "ash" | "walnut";

export type PaceName = "blank" | "hush" | "stride" | "rush";

export type VisitTray = "open" | "held" | "archived";

export type SlotPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type VisitDensity = "airy" | "tight";

export type VisitSort = "slot" | "host";

export type VisitCard = {
  id: string;
  title: string;
  note: string;
  host: string;
  slot: number | null;
  timber: string;
  pace: string;
  call: number | null;
  rank: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  seal: boolean;
  audit: string;
};

export type VisitView = {
  id: string;
  name: string;
  tray: VisitTray;
  query: string;
  host: string;
  timber: string;
  pace: string;
  slot: string;
  call: string;
  rank: string;
};

export type VisitCounts = {
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

export type MarkLane = "" | "hall" | "fresh" | "return" | "kept" | "closed" | "glyph";

export type MarkTone = "" | "gilt" | "pale" | "linen" | "ash" | "haze";

export type MarkState = "" | "clear" | "set";

export type MarkShape = "all" | "join" | "wide" | "hall" | "glyph" | "kept";

export type MarkReview = "all" | "reviewed" | "fresh";

export type MarkValue = string | { name?: unknown; stage?: unknown; source?: unknown; [key: string]: unknown } | null | undefined;

export type MarkRow = { id: string; label: string; note: MarkValue };

export type MarkLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "archive", "open", "timber", "tag", "rank", "call", "seal"] as const;

const TIMBERS = ["oak", "ash", "walnut"] as const;

const PACES = ["hush", "stride", "rush"] as const;

const PACE_CYCLE = ["hush", "stride", "rush"] as const;

const PEAK_SLOTS = new Set([3, 7]);

const QUIET_SLOTS = new Set([6]);

const HOUSE = new Set(["OAK", "WALNUT"]);

const KEPT = new Set(["RETENTION", "CONVERTED", "DEPOSITED"]);

const RETURNING = new Set(["CALLBACK", "NO_ANSWER"]);

const FRESH = new Set(["NEW", "INTERESTED", "CONTACTED"]);

const CLOSED = new Set(["LOST", "NOT_INTERESTED", "DO_NOT_CALL", "WRONG_NUMBER", "INV_WRONG_GEO", "INV_WRONG_LANGUAGE", "INV_WRONG_PERSON"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const VCD_CAP = 10;

const VIEW_CAP = 6;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): VisitTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function timberName(raw: unknown): Exclude<TimberName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (TIMBERS as readonly string[]).includes(text) ? (text as Exclude<TimberName, "blank">) : "";
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
    if (!/^[abcd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: VisitCard, tray: VisitTray): boolean {
  if (tray === "held") return card.held && !card.archived;
  if (tray === "archived") return card.archived;
  return !card.held && !card.archived;
}

/** A blank title is left out. The saved title stays short. */
export function visitLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function visitNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank host stays blank. It is not filled in. */
export function visitHost(raw: unknown): string {
  return clip(raw, 18);
}

/** A timber is OAK, ASH, or WALNUT. Anything else stays blank. Letters are stored in capitals. */
export function timberOf(raw: unknown): string {
  const name = timberName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A slot is an integer from 1 through 8.
 * A blank value stays unset. 0 is not a slot.
 * A second digit is not a slot.
 */
export function slotOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 8) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-8]$/.test(text)) return null;
  return Number(text);
}

/** A call length is 4, 12, or 36 minutes. A blank value stays unset. */
export function callOf(raw: unknown): 4 | 12 | 36 | null {
  if (raw === 4 || raw === "4") return 4;
  if (raw === 12 || raw === "12") return 12;
  if (raw === 36 || raw === "36") return 36;
  return null;
}

/** Rank is 1, 4, or 7. Anything else is not a rank. 1 is the resting rank. */
export function rankOf(raw: unknown): 1 | 4 | 7 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 7 || raw === "7") return 7;
  return null;
}

export function slotBand(slot: unknown): "blank" | "early" | "mid" | "late" {
  const value = slotOf(slot);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak slots are 3 and 7. An unset slot is not a peak slot. */
export function peakSlot(slot: unknown): boolean {
  const value = slotOf(slot);
  return value !== null && PEAK_SLOTS.has(value);
}

/** The quiet slot is 6. A peak slot is not quiet. An unset slot is not quiet. */
export function quietSlot(slot: unknown): boolean {
  const value = slotOf(slot);
  return value !== null && QUIET_SLOTS.has(value);
}

/**
 * How far a slot sits behind the desk slot.
 * A positive gap means the visit is behind. A negative gap means it is ahead.
 * A gap of zero means the same slot. An unset slot has no gap. Slots do not wrap.
 */
export function slotGap(slot: unknown, desk: unknown): number | null {
  const from = slotOf(slot);
  const at = slotOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** OAK and WALNUT are house timbers. ASH is a guest timber. A blank timber is not a house timber. */
export function houseTimber(timber: unknown): boolean {
  return HOUSE.has(timberOf(timber));
}

export function visitDensity(raw: unknown): VisitDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function visitSort(raw: unknown): VisitSort {
  return raw === "host" ? "host" : "slot";
}

function readOne(raw: unknown): VisitCard | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = visitLine(row.title);
  if (!id || !title) return null;
  const rank = rankOf(row.rank);
  return {
    id,
    title,
    note: visitNote(row.note),
    host: visitHost(row.host),
    slot: slotOf(row.slot),
    timber: timberOf(row.timber),
    pace: paceName(row.pace),
    call: callOf(row.call),
    rank: rank === null ? 1 : rank,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    seal: row.seal === true,
    audit: auditCode(row.audit),
  };
}

export function readVisits(raw: unknown): VisitCard[] {
  if (!Array.isArray(raw)) return [];
  const out: VisitCard[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, VCD_CAP);
}

export function addVisit(
  cards: readonly VisitCard[],
  card: {
    id: string;
    title: string;
    note?: string;
    host?: string;
    slot?: unknown;
    timber?: string;
    pace?: string;
    call?: unknown;
    rank?: unknown;
    tags?: unknown;
  },
): VisitCard[] {
  const current = readVisits(cards);
  const id = String(card.id || "").trim();
  const title = visitLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rank = rankOf(card.rank);
  const next: VisitCard = {
    id,
    title,
    note: visitNote(card.note),
    host: visitHost(card.host),
    slot: slotOf(card.slot),
    timber: timberOf(card.timber),
    pace: paceName(card.pace),
    call: callOf(card.call),
    rank: rank === null ? 1 : rank,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, VCD_CAP);
}

/** A blank pace becomes hush, hush becomes stride, stride becomes rush, and rush returns to hush. */
export function cyclePace(cards: readonly VisitCard[], id: string): VisitCard[] {
  return readVisits(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_CYCLE.indexOf(card.pace as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    if (!next || next === card.pace) return card;
    return { ...card, pace: next, audit: "pace" };
  });
}

/** A blank title is left as it is. */
export function editVisit(cards: readonly VisitCard[], id: string, title: unknown): VisitCard[] {
  const next = visitLine(title);
  if (!next) return readVisits(cards);
  const current = readVisits(cards);
  if (current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

export function editVisitNote(cards: readonly VisitCard[], id: string, note: unknown): VisitCard[] {
  const next = visitNote(note);
  return readVisits(cards).map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "note" } : card));
}

export function addVisitTag(cards: readonly VisitCard[], id: string, tag: unknown): VisitCard[] {
  const next = tagsOf(tag);
  if (!next.length) return readVisits(cards);
  return readVisits(cards).map((card) => {
    if (card.id !== id) return card;
    const tags = tagsOf([...card.tags, ...next]);
    if (tags.join() === card.tags.join()) return card;
    return { ...card, tags, audit: "tag" };
  });
}

export function setVisitRank(cards: readonly VisitCard[], id: string, rank: unknown): VisitCard[] {
  const next = rankOf(rank);
  if (next === null) return readVisits(cards);
  return readVisits(cards).map((card) => (card.id === id && card.rank !== next ? { ...card, rank: next, audit: "rank" } : card));
}

/** Snooze sets a blank call, a call of 4, or a call of 12 to 36. A call of 36 stays. */
export function snoozeVisit(cards: readonly VisitCard[], id: string): VisitCard[] {
  return readVisits(cards).map((card) => {
    if (card.id !== id || card.call === 36) return card;
    return { ...card, call: 36, audit: "call" };
  });
}

export function setVisitPin(cards: readonly VisitCard[], id: string, pinned: boolean): VisitCard[] {
  return readVisits(cards).map((card) => (card.id === id && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function pinFocusedVisit(cards: readonly VisitCard[], shownIds: readonly string[], index: number): VisitCard[] {
  const id = shownIds[index];
  if (!id) return readVisits(cards);
  const card = readVisits(cards).find((item) => item.id === id);
  if (!card) return readVisits(cards);
  return setVisitPin(cards, id, !card.pinned);
}

export function snoozeFocusedVisit(cards: readonly VisitCard[], shownIds: readonly string[], index: number): VisitCard[] {
  const id = shownIds[index];
  return id ? snoozeVisit(cards, id) : readVisits(cards);
}

export function holdFocusedVisit(cards: readonly VisitCard[], shownIds: readonly string[], index: number): VisitCard[] {
  const id = shownIds[index];
  if (!id) return readVisits(cards);
  const card = readVisits(cards).find((item) => item.id === id);
  if (!card || card.archived) return readVisits(cards);
  return setVisitHold(cards, id, !card.held);
}

export function paceFocusedVisit(cards: readonly VisitCard[], shownIds: readonly string[], index: number): VisitCard[] {
  const id = shownIds[index];
  return id ? cyclePace(cards, id) : readVisits(cards);
}

export function waxFocusedVisit(cards: readonly VisitCard[], shownIds: readonly string[], index: number): VisitCard[] {
  const id = shownIds[index];
  if (!id) return readVisits(cards);
  const card = readVisits(cards).find((item) => item.id === id);
  if (!card) return readVisits(cards);
  return setVisitSeal(cards, id, !card.seal);
}

export function setVisitHold(cards: readonly VisitCard[], id: string, held: boolean): VisitCard[] {
  return readVisits(cards).map((card) => (card.id === id && !card.archived && card.held !== held ? { ...card, held, audit: held ? "hold" : "resume" } : card));
}

export function setVisitArchive(cards: readonly VisitCard[], id: string, archived: boolean): VisitCard[] {
  return readVisits(cards).map((card) => (card.id === id && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function setVisitSeal(cards: readonly VisitCard[], id: string, seal: boolean): VisitCard[] {
  return readVisits(cards).map((card) => (card.id === id && card.seal !== seal ? { ...card, seal, audit: "seal" } : card));
}

export function bulkVisitTimber(cards: readonly VisitCard[], ids: readonly string[], timber: unknown): VisitCard[] {
  const next = timberOf(timber);
  if (!next) return readVisits(cards);
  const want = new Set(ids);
  return readVisits(cards).map((card) => (want.has(card.id) && card.timber !== next ? { ...card, timber: next, audit: "timber" } : card));
}

export function bulkVisitPin(cards: readonly VisitCard[], ids: readonly string[], pinned: boolean): VisitCard[] {
  const want = new Set(ids);
  return readVisits(cards).map((card) => (want.has(card.id) && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkVisitArchive(cards: readonly VisitCard[], ids: readonly string[], archived: boolean): VisitCard[] {
  const want = new Set(ids);
  return readVisits(cards).map((card) => (want.has(card.id) && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function bulkVisitPace(cards: readonly VisitCard[], ids: readonly string[], pace: unknown): VisitCard[] {
  const next = paceName(pace);
  if (!next) return readVisits(cards);
  const want = new Set(ids);
  return readVisits(cards).map((card) => (want.has(card.id) && card.pace !== next ? { ...card, pace: next, audit: "pace" } : card));
}

export function bulkVisitTag(cards: readonly VisitCard[], ids: readonly string[], tag: unknown): VisitCard[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addVisitTag(rows, id, tag) : rows), readVisits(cards));
}

export function resetVisits(): VisitCard[] {
  return [];
}

/** An open visit whose slot sits more than two slots behind the desk. A raised rank, a hold, or an archive is not late. */
export function lateVisit(card: VisitCard, desk: unknown): boolean {
  const gap = slotGap(card.slot, desk);
  return inTray(card, "open") && card.rank === 1 && gap !== null && gap > 2;
}

/** An open visit with a call of 4 minutes is due now. A raised rank, a hold, or an archive is not. */
export function soonVisit(card: VisitCard): boolean {
  return inTray(card, "open") && card.rank === 1 && card.call === 4;
}

/** An open resting visit on a rush pace whose slot is 6. That quiet rush is cooling. */
export function coolingVisit(card: VisitCard): boolean {
  return inTray(card, "open") && card.rank === 1 && card.pace === "rush" && card.slot === 6;
}

/** Open visits that are late or due now. A raised visit stays off the reminder list. */
export function reminderVisits(cards: readonly VisitCard[], desk: unknown): VisitCard[] {
  return readVisits(cards).filter((card) => lateVisit(card, desk) || soonVisit(card));
}

export function coolingVisits(cards: readonly VisitCard[]): VisitCard[] {
  return readVisits(cards).filter((card) => coolingVisit(card));
}

/** Open visits whose slot sits within two slots of the desk. A raised rank, a hold, or an archive stays out. */
export function windowVisits(cards: readonly VisitCard[], desk: unknown): VisitCard[] {
  return readVisits(cards).filter((card) => {
    const gap = slotGap(card.slot, desk);
    return inTray(card, "open") && card.rank === 1 && gap !== null && gap >= -2 && gap <= 2;
  });
}

export function matchedVisits(cards: readonly VisitCard[], desk: unknown): number {
  const at = slotOf(desk);
  if (at === null) return 0;
  return readVisits(cards).filter((card) => inTray(card, "open") && card.rank === 1 && card.slot === at).length;
}

function slotHit(slot: number | null, exact: number | null, pick: SlotPick | null): boolean {
  if (exact !== null) return slot === exact;
  if (pick === null) return true;
  if (pick === "blank") return slot === null;
  if (pick === "peak") return peakSlot(slot);
  if (pick === "quiet") return quietSlot(slot);
  return slotBand(slot) === pick;
}

/** Search matches the title, the note, the host, and the tags. */
export function visibleVisits(
  cards: readonly VisitCard[],
  tray: VisitTray,
  query: string,
  host: string | null,
  timber: string | null,
  pace: string | null,
  exact: number | null,
  pick: SlotPick | null,
  call: number | "blank" | null,
  rank: number | "blank" | null,
  rushOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): VisitCard[] {
  const text = query.trim().toLowerCase();
  return readVisits(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text) {
      const hay = `${card.title} ${card.note} ${card.host} ${card.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (host !== null && card.host !== host) return false;
    if (timber === "blank" ? Boolean(card.timber) : timber && card.timber !== timber) return false;
    if (pace === "blank" ? Boolean(card.pace) : pace && card.pace !== pace) return false;
    if (!slotHit(card.slot, exact, pick)) return false;
    if (call === "blank" ? card.call !== null : call !== null && card.call !== call) return false;
    if (rank === "blank" ? card.rank !== 1 : rank !== null && card.rank !== rank) return false;
    if (rushOnly && card.pace !== "rush") return false;
    if (peakOnly && !peakSlot(card.slot)) return false;
    if (houseOnly && !houseTimber(card.timber)) return false;
    if (quietOnly && !quietSlot(card.slot)) return false;
    if (restingOnly && card.rank !== 1) return false;
    return true;
  });
}

export function sortVisits(cards: readonly VisitCard[], mode: VisitSort): VisitCard[] {
  const rows = cards.slice();
  if (mode === "host") return rows.sort((a, b) => a.host.localeCompare(b.host) || (a.slot ?? 99) - (b.slot ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99) || a.title.localeCompare(b.title));
}

export function visitIndex(cards: readonly VisitCard[], query: string): VisitCard[] {
  const text = query.trim().toLowerCase();
  return sortVisits(
    readVisits(cards).filter((card) => card.slot !== null && (!text || card.title.toLowerCase().includes(text))),
    "slot",
  );
}

export function visitCounts(cards: readonly VisitCard[], desk: unknown): VisitCounts {
  const rows = readVisits(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    archived: rows.filter((card) => inTray(card, "archived")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => inTray(card, "open") && card.rank === 1 && peakSlot(card.slot)).length,
    late: rows.filter((card) => lateVisit(card, desk)).length,
    soon: rows.filter((card) => soonVisit(card)).length,
    rank: rows.filter((card) => inTray(card, "open") && card.rank > 1).length,
    house: rows.filter((card) => inTray(card, "open") && houseTimber(card.timber)).length,
    window: windowVisits(rows, desk).length,
    matched: matchedVisits(rows, desk),
    seal: rows.filter((card) => card.seal).length,
    cooling: rows.filter((card) => coolingVisit(card)).length,
  };
}

export function visitShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open visits as a share of every open visit. */
export function lateVisitShare(cards: readonly VisitCard[], desk: unknown): number {
  const rows = readVisits(cards).filter((card) => inTray(card, "open"));
  return visitShare(rows.filter((card) => lateVisit(card, desk)).length, rows.length);
}

export function usedSlots(cards: readonly VisitCard[]): number {
  return new Set(readVisits(cards).filter((card) => inTray(card, "open") && card.slot !== null).map((card) => card.slot)).size;
}

/** Open visits that share a slot. */
export function clashSlotCount(cards: readonly VisitCard[]): number {
  const open = readVisits(cards).filter((card) => inTray(card, "open") && card.slot !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].slot === open[j].slot) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open visits that share a call length. */
export function callClashCount(cards: readonly VisitCard[]): number {
  const open = readVisits(cards).filter((card) => inTray(card, "open") && card.call !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].call === open[j].call) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open visits whose slots sit exactly two slots apart. */
export function adjacentVisitCount(cards: readonly VisitCard[]): number {
  const open = readVisits(cards).filter((card) => inTray(card, "open") && card.slot !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].slot || 0) - (open[j].slot || 0)) === 2) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The timber with the fewest open visits.
 * A tie keeps WALNUT, then ASH, then OAK.
 * An empty desk still suggests WALNUT.
 */
export function suggestTimber(cards: readonly VisitCard[]): "OAK" | "ASH" | "WALNUT" {
  const rows = readVisits(cards).filter((card) => inTray(card, "open"));
  const order = ["WALNUT", "ASH", "OAK"] as const;
  let best: "OAK" | "ASH" | "WALNUT" = "WALNUT";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const timber of order) {
    const count = rows.filter((card) => card.timber === timber).length;
    if (count < bestCount) {
      best = timber;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The call length with the fewest open visits.
 * A tie keeps 12, then 4, then 36.
 * An empty desk still suggests 12.
 */
export function suggestCall(cards: readonly VisitCard[]): 4 | 12 | 36 {
  const rows = readVisits(cards).filter((card) => inTray(card, "open"));
  const order = [12, 4, 36] as const;
  let best: 4 | 12 | 36 = 12;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const call of order) {
    const count = rows.filter((card) => card.call === call).length;
    if (count < bestCount) {
      best = call;
      bestCount = count;
    }
  }
  return best;
}

/** The newest host already written on a visit. A blank host is skipped. */
export function suggestVisitHost(cards: readonly VisitCard[]): string {
  const found = readVisits(cards).find((card) => card.host);
  return found ? found.host : "";
}

/**
 * The host carrying the fewest open visits.
 * A tie keeps the earlier name on the roster. A blank host is not a load.
 * An empty roster falls back to the newest host.
 */
export function fairVisitHost(cards: readonly VisitCard[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = visitHost(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestVisitHost(cards);
  const open = readVisits(cards).filter((card) => inTray(card, "open"));
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

/** The host with the most open visits. A tie keeps the name that sorts later. */
export function busiestVisitHost(cards: readonly VisitCard[]): string {
  const rows = readVisits(cards).filter((card) => inTray(card, "open") && card.host);
  const names: string[] = [];
  for (const card of rows) if (!names.includes(card.host)) names.push(card.host);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((card) => card.host === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function visitHosts(cards: readonly VisitCard[]): string[] {
  const out: string[] = [];
  for (const card of readVisits(cards)) {
    if (card.host && !out.includes(card.host)) out.push(card.host);
  }
  return out;
}

export function visitTimbers(cards: readonly VisitCard[]): string[] {
  const out: string[] = [];
  for (const card of readVisits(cards)) {
    if (card.timber && !out.includes(card.timber)) out.push(card.timber);
  }
  return out;
}

/** Open visits whose host also watches another open visit on a different slot. */
export function pairVisitCount(cards: readonly VisitCard[]): number {
  const open = readVisits(cards).filter((card) => inTray(card, "open") && card.host && card.slot !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].host === open[j].host && open[i].slot !== open[j].slot) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open visits that share a timber on different slots. */
export function sharedTimberCount(cards: readonly VisitCard[]): number {
  const open = readVisits(cards).filter((card) => inTray(card, "open") && card.timber && card.slot !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].timber === open[j].timber && open[i].slot !== open[j].slot) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The rank of open visits. The resting rank of 1 still counts. */
export function rankLoad(cards: readonly VisitCard[]): number {
  return readVisits(cards).filter((card) => inTray(card, "open")).reduce((sum, card) => sum + card.rank, 0);
}

/** Open visits that are both the quiet slot and a house timber. */
export function quietHallVisits(cards: readonly VisitCard[]): number {
  return readVisits(cards).filter((card) => inTray(card, "open") && quietSlot(card.slot) && houseTimber(card.timber)).length;
}

/** Open visits whose pace is rush. */
export function rushVisitLoad(cards: readonly VisitCard[]): number {
  return readVisits(cards).filter((card) => inTray(card, "open") && card.pace === "rush").length;
}

export function slotWidth(cards: readonly VisitCard[]): number {
  const slots = readVisits(cards).filter((card) => inTray(card, "open") && card.slot !== null).map((card) => card.slot as number);
  if (!slots.length) return 0;
  return Math.max(...slots) - Math.min(...slots);
}

/** The next open visit whose slot sits ahead of the desk. An unset desk has no next visit. */
export function nextVisit(cards: readonly VisitCard[], desk: unknown): string {
  const at = slotOf(desk);
  if (at === null) return "";
  const rows = readVisits(cards)
    .filter((card) => inTray(card, "open") && card.rank === 1 && card.slot !== null && (card.slot as number) > at)
    .sort((a, b) => (a.slot || 0) - (b.slot || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveVisitFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function visitCopy(card: VisitCard, desk: unknown): string {
  const gap = slotGap(card.slot, desk);
  return [card.title, card.host, card.slot ?? "", card.timber, card.pace, card.call ?? "", card.rank, card.tags.join(" "), card.seal ? "1" : "0", card.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the visits saved in this browser. The gap and the late mark use the slot you pass. */
export function visitsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,host,slot,timber,pace,call,rank,tags,pinned,held,archived,seal,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readVisits(raw);
  const windowIds = new Set(windowVisits(rows, desk).map((card) => card.id));
  const at = slotOf(desk);
  for (const card of rows) {
    const gap = slotGap(card.slot, desk);
    lines.push([
      card.title,
      card.host,
      card.slot === null ? "" : String(card.slot),
      card.timber,
      card.pace,
      card.call === null ? "" : String(card.call),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.archived ? "1" : "0",
      card.seal ? "1" : "0",
      gap === null ? "" : String(gap),
      lateVisit(card, desk) ? "1" : "0",
      soonVisit(card) ? "1" : "0",
      houseTimber(card.timber) ? "1" : "0",
      windowIds.has(card.id) ? "1" : "0",
      at !== null && card.slot === at && card.rank === 1 && inTray(card, "open") ? "1" : "0",
      coolingVisit(card) ? "1" : "0",
      card.note,
      card.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeVisitHost(raw: string, hosts: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return hosts.includes(raw) ? raw : "all";
}

export function activeTimber(raw: string, timbers: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = timberOf(raw);
  return name && timbers.map((item) => item.toUpperCase()).includes(name) ? name : timbers.includes(raw) ? raw : "all";
}

export function activePace(raw: string, paces: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return paces.includes(raw) ? raw : "all";
}

export function activeSlot(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return slotOf(raw) === null ? "all" : raw;
}

export function activeCall(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return callOf(raw) === null ? "all" : raw;
}

export function activeRank(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return rankOf(raw) === null ? "all" : raw;
}

export function visitHostArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function timberArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return timberOf(filter) || null;
}

export function paceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function slotArg(filter: string): { exact: number | null; pick: SlotPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: slotOf(filter), pick: null };
}

export function callArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return callOf(filter);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

function readView(raw: unknown): VisitView | null {
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
    host: clip(row.host, 18),
    timber: clip(row.timber, 12),
    pace: clip(row.pace, 8),
    slot: clip(row.slot, 8),
    call: clip(row.call, 8),
    rank: clip(row.rank, 8),
  };
}

export function readVisitViews(raw: unknown): VisitView[] {
  if (!Array.isArray(raw)) return [];
  const out: VisitView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addVisitView(views: readonly VisitView[], view: VisitView): VisitView[] {
  const current = readVisitViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropVisitView(views: readonly VisitView[], id: string): VisitView[] {
  return readVisitViews(views).filter((view) => view.id !== id);
}

function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

function markParts(value: MarkValue): { name: string; stage: string; source: string; ok: boolean } {
  if (typeof value === "string") return { name: clip(value, 48), stage: "", source: "", ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { name: "", stage: "", source: "", ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { name: "", stage: "", source: "", ok: false };
  if (!("name" in value) && !("stage" in value) && !("source" in value)) {
    return { name: "", stage: "", source: "", ok: false };
  }
  const nameRaw = "name" in value ? value.name : "";
  const stageRaw = "stage" in value ? value.stage : "";
  const sourceRaw = "source" in value ? value.source : "";
  if (!textOk(nameRaw) || !textOk(stageRaw) || !textOk(sourceRaw)) {
    return { name: "", stage: "", source: "", ok: false };
  }
  return {
    name: clip(nameRaw, 48),
    stage: clip(stageRaw, 24).toUpperCase(),
    source: clip(sourceRaw, 24),
    ok: true,
  };
}

export function markState(value: MarkValue): MarkState {
  const found = markParts(value);
  if (!found.ok) return "";
  return found.name ? "set" : "clear";
}

export function markCopy(value: MarkValue): string {
  const found = markParts(value);
  return found.ok ? found.name : "";
}

/** The mark is the first letter of each word, up to two. Digits are not letters. */
export function markSigil(value: MarkValue): string {
  const text = markCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the name is a glyph. Retention, converted, and deposited are kept.
 * Callback and no-answer return. New, interested, and contacted are fresh.
 * Lost, not interested, do-not-call, and invalid stages are closed.
 * Any other named lead is a hall. A digit wins over the stage.
 */
export function markLane(value: MarkValue): MarkLane {
  const found = markParts(value);
  if (!found.ok || !found.name) return "";
  if (/\d/.test(found.name)) return "glyph";
  if (KEPT.has(found.stage)) return "kept";
  if (RETURNING.has(found.stage)) return "return";
  if (FRESH.has(found.stage)) return "fresh";
  if (CLOSED.has(found.stage)) return "closed";
  return "hall";
}

/**
 * Lost and do-not-call are ash. Interested and converted are gilt.
 * A source of eight letters or more is linen. A shorter source is pale.
 * A blank source, with none of those stages, is haze.
 */
export function markTone(value: MarkValue): MarkTone {
  const found = markParts(value);
  if (!found.ok || !found.name) return "";
  if (found.stage === "LOST" || found.stage === "DO_NOT_CALL") return "ash";
  if (found.stage === "INTERESTED" || found.stage === "CONVERTED") return "gilt";
  if (found.source.length >= 8) return "linen";
  if (found.source.length > 0) return "pale";
  return "haze";
}

export function joinedMark(value: MarkValue): boolean {
  return markCopy(value).includes("+");
}

export function joinedMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => joinedMark(row.note)).length;
}

export function wideMark(value: MarkValue): boolean {
  return markCopy(value).length >= 12;
}

export function wideMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => wideMark(row.note)).length;
}

export function giltMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => markTone(row.note) === "gilt").length;
}

export function hallMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => markLane(row.note) === "hall").length;
}

export function freshMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => markLane(row.note) === "fresh").length;
}

export function returnMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => markLane(row.note) === "return").length;
}

export function keptMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => markLane(row.note) === "kept").length;
}

export function closedMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => markLane(row.note) === "closed").length;
}

export function glyphMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => markLane(row.note) === "glyph").length;
}

export function sharedMarkCount(rows: readonly MarkRow[]): number {
  const marks = rows.map((row) => markSigil(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(markSigil(row.note))).length;
}

export function markLanes(rows: readonly MarkRow[]): MarkLaneLine[] {
  const lanes = ["hall", "fresh", "return", "kept", "closed", "glyph"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => markLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingMark(rows: readonly MarkRow[]): string {
  const lines = markLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingMarkTone(rows: readonly MarkRow[]): string {
  const tones = ["gilt", "pale", "linen", "ash", "haze"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => markTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function markShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function markStep(value: MarkValue): 0 | 1 | 2 | 3 {
  const text = markCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words === 2) return 2;
  return 3;
}

export function presentMarkLanes(rows: readonly MarkRow[]): string[] {
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
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "hall" || lane === "fresh" || lane === "return" || lane === "kept" || lane === "closed" || lane === "glyph" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedMarks(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
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
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleMarks(
  rows: readonly MarkRow[],
  lane: MarkLane | "blank" | null,
  tone: MarkTone | null,
  query: string,
  review: MarkReview,
  reviewed: readonly string[],
  shape: MarkShape,
): MarkRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = markState(row.note);
    if (!state) return false;
    const token = state === "set" ? markLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && markTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${markCopy(row.note)} ${markSigil(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "join" && !joinedMark(row.note)) return false;
    if (shape === "wide" && !wideMark(row.note)) return false;
    if (shape === "hall" && markLane(row.note) !== "hall") return false;
    if (shape === "glyph" && markLane(row.note) !== "glyph") return false;
    if (shape === "kept" && markLane(row.note) !== "kept") return false;
    return true;
  });
}

export function activeMarkLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeMarkTone(raw: string): string {
  return raw === "gilt" || raw === "pale" || raw === "linen" || raw === "ash" || raw === "haze" || raw === "all" ? raw : "all";
}

export function markLaneArg(filter: string): MarkLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "hall" || filter === "fresh" || filter === "return" || filter === "kept" || filter === "closed" || filter === "glyph") return filter;
  return null;
}

export function markToneArg(filter: string): MarkTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "pale" || filter === "linen" || filter === "ash" || filter === "haze") return filter;
  return null;
}

export function marksCsv(rows: readonly MarkRow[]): string {
  const lines = ["lane,count"];
  for (const line of markLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function markRowsCsv(rows: readonly MarkRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,tone,step,join,wide,hall,fresh,return,kept,closed,glyph,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = markParts(row.note);
    if (!found.ok) continue;
    const lane = markLane(row.note);
    lines.push([
      found.name,
      markSigil(row.note),
      lane,
      markTone(row.note),
      String(markStep(row.note)),
      joinedMark(row.note) ? "1" : "0",
      wideMark(row.note) ? "1" : "0",
      lane === "hall" ? "1" : "0",
      lane === "fresh" ? "1" : "0",
      lane === "return" ? "1" : "0",
      lane === "kept" ? "1" : "0",
      lane === "closed" ? "1" : "0",
      lane === "glyph" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
