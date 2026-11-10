/**
 * Local gilt assignment slips, and the first-deposit flag already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_gilt_slip (
 *   id text primary key,
 *   note text not null,
 *   owner text not null default '',
 *   minute integer,
 *   lane text not null default '',
 *   tag text not null default '',
 *   pace text not null default '',
 *   pinned boolean not null default false,
 *   parked boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_ftd_mark_hide (
 *   mark text primary key
 * );
 */

export const GILT_KEY = "crmv4-gilt-slips";
export const GILT_VIEW_KEY = "crmv4-gilt-views";
export const FTD_KEY = "crmv4-ftd-hide";

export type GiltPace = "blank" | "wait" | "work" | "rush";

export type GiltLane = "blank" | "north" | "south" | "east" | "west";

export type GiltTray = "queue" | "parked" | "closed";

export type MinutePick = "blank" | "dawn" | "morn" | "dusk" | "short" | "long";

export type GiltCard = {
  id: string;
  text: string;
  owner: string;
  minute: number | null;
  lane: string;
  tag: string;
  pace: string;
  pinned: boolean;
  parked: boolean;
  closed: boolean;
  audit: string;
};

export type GiltView = {
  id: string;
  name: string;
  tray: GiltTray;
  query: string;
  owner: string;
  lane: string;
  tag: string;
  pace: string;
  minute: string;
};

export type GiltCounts = {
  queue: number;
  parked: number;
  closed: number;
  pinned: number;
  late: number;
};

export type FtdMark = "" | "funded" | "open";

export type NameSpan = "" | "short" | "mid" | "long";

export type FtdValue =
  | {
      ftd?: unknown;
      affiliateA?: unknown;
      affiliateB?: unknown;
      affiliateC?: unknown;
      campaign?: unknown;
      lastLoginAt?: unknown;
      lastSeenAt?: unknown;
      lastContactAt?: unknown;
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
      username?: unknown;
      accountLoginId?: unknown;
      retentionNote?: unknown;
      assigneeName?: unknown;
      brokerName?: unknown;
      retentionFollowUpAt?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type FtdRow = { ftd?: FtdValue; label?: string | null };

export type MarkLine = { mark: string; count: number };

export type InitialLine = { initial: string; count: number };

export type SpanLine = { span: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "park", "release", "close", "reopen", "lane"] as const;

const LANES = ["north", "south", "east", "west"] as const;

const PACES = ["wait", "work", "rush"] as const;

const PACE_ORDER = ["", "wait", "work", "rush"] as const;

const MINUTES = [0, 15, 30, 45, 60] as const;

const PICKS = ["blank", "dawn", "morn", "dusk", "short", "long"] as const;

const BANDS = ["dawn", "morn", "dusk"] as const;

const MARKS = ["funded", "open"] as const;

const SPANS = ["short", "mid", "long"] as const;

const FTD_BLOCK = ["affiliateA", "affiliateB", "affiliateC", "campaign", "lastLoginAt", "lastSeenAt", "lastContactAt", "timezone", "language", "country", "name", "email", "phone", "desk", "address", "city", "firstName", "lastName", "lastCountryName", "createdAt", "username", "accountLoginId", "retentionNote", "assigneeName", "brokerName", "retentionFollowUpAt"] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): GiltTray {
  return raw === "parked" || raw === "closed" ? raw : "queue";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function laneName(raw: unknown): Exclude<GiltLane, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (LANES as readonly string[]).includes(text) ? (text as Exclude<GiltLane, "blank">) : "";
}

function paceName(raw: unknown): Exclude<GiltPace, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<GiltPace, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function giltText(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank owner stays blank. It is not filled in. */
export function ownerLabel(raw: unknown): string {
  return clip(raw, 12);
}

/** A blank tag stays blank. It is not filled in. */
export function giltTag(raw: unknown): string {
  return clip(raw, 8);
}

/**
 * A minute is 0, 15, 30, 45, or 60.
 * A blank value stays unset. 90 is not a minute.
 * A leading zero is still zero: 00 is 0. 015 is not a minute.
 */
export function minuteOf(raw: unknown): number | null {
  if (typeof raw === "number" && (MINUTES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:0|00|15|30|45|60)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** North, south, east, west, or blank. Anything else is blank. */
export function laneOf(raw: unknown): GiltLane {
  return laneName(raw) || "blank";
}

/** Wait, work, rush, or blank. Anything else is blank. */
export function paceOf(raw: unknown): GiltPace {
  return paceName(raw) || "blank";
}

/** Dawn is 0. Morning is 15–30. Dusk is 45–60. An unset minute is blank. */
export function bandOf(minute: unknown): "blank" | "dawn" | "morn" | "dusk" {
  const count = minuteOf(minute);
  if (count === null) return "blank";
  if (count <= 0) return "dawn";
  if (count <= 30) return "morn";
  return "dusk";
}

/** Short is 0–15. Long is 30–60. An unset minute is blank. */
export function halfOf(minute: unknown): "blank" | "short" | "long" {
  const count = minuteOf(minute);
  if (count === null) return "blank";
  return count <= 15 ? "short" : "long";
}

/** The typed minute minus the slip minute. A positive gap is past the minute. */
export function giltGap(minute: unknown, desk: unknown): number | null {
  const from = minuteOf(minute);
  const at = minuteOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readGilts(raw: unknown): GiltCard[] {
  if (!Array.isArray(raw)) return [];
  const out: GiltCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GiltCard>;
    const id = String(row.id || "").trim();
    const text = giltText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      owner: ownerLabel(row.owner),
      minute: minuteOf(row.minute),
      lane: laneName(row.lane),
      tag: giltTag(row.tag),
      pace: paceName(row.pace),
      pinned: row.pinned === true,
      parked: row.parked === true,
      closed: row.closed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 10);
}

export function addGilt(
  cards: readonly GiltCard[],
  card: { id: string; text: string; owner?: string; minute?: unknown; lane?: string; tag?: string; pace?: string },
): GiltCard[] {
  const current = readGilts(cards);
  const id = String(card.id || "").trim();
  const text = giltText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: GiltCard = {
    id,
    text,
    owner: ownerLabel(card.owner),
    minute: minuteOf(card.minute),
    lane: laneName(card.lane),
    tag: giltTag(card.tag),
    pace: paceName(card.pace),
    pinned: false,
    parked: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 10);
}

export function stepGiltPace(cards: readonly GiltCard[], id: string, dir: 1 | -1): GiltCard[] {
  return readGilts(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_ORDER.indexOf(card.pace as (typeof PACE_ORDER)[number]);
    const next = PACE_ORDER[Math.min(PACES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.pace) return card;
    return { ...card, pace: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setGiltPinned(cards: readonly GiltCard[], id: string, pinned: boolean): GiltCard[] {
  return readGilts(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setGiltParked(cards: readonly GiltCard[], id: string, parked: boolean): GiltCard[] {
  return readGilts(cards).map((card) => (card.id === id ? { ...card, parked, audit: parked ? "park" : "release" } : card));
}

export function setGiltClosed(cards: readonly GiltCard[], id: string, closed: boolean): GiltCard[] {
  return readGilts(cards).map((card) => (card.id === id ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another note is left out. */
export function editGilt(cards: readonly GiltCard[], id: string, text: string): GiltCard[] {
  const current = readGilts(cards);
  const next = giltText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkGiltPinned(cards: readonly GiltCard[], ids: readonly string[], pinned: boolean): GiltCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readGilts(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkGiltClosed(cards: readonly GiltCard[], ids: readonly string[], closed: boolean): GiltCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readGilts(cards).map((card) => (want.has(card.id) ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

/** A blank or unknown lane is left out. A slip already on that lane is left as it is. */
export function bulkGiltLane(cards: readonly GiltCard[], ids: readonly string[], lane: string): GiltCard[] {
  const name = laneName(lane);
  const current = readGilts(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.lane !== name ? { ...card, lane: name, audit: "lane" } : card));
}

export function resetGilts(): GiltCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function giltCopy(raw: unknown): string {
  return giltText(raw);
}

function inTray(card: GiltCard, tray: GiltTray): boolean {
  if (tray === "closed") return card.closed;
  if (tray === "parked") return card.parked && !card.closed;
  return !card.parked && !card.closed;
}

function minuteHit(minute: number | null, exact: number | null, pick: MinutePick | null): boolean {
  if (exact !== null) return minute === exact;
  if (pick === null) return true;
  if (pick === "blank") return minute === null;
  if (pick === "short" || pick === "long") return halfOf(minute) === pick;
  return bandOf(minute) === pick;
}

function paceScore(pace: string): number {
  if (pace === "rush") return 3;
  if (pace === "work") return 2;
  if (pace === "wait") return 1;
  return 0;
}

function waitingLate(card: GiltCard, desk: unknown): boolean {
  const gap = giltGap(card.minute, desk);
  return gap !== null && gap > 0 && card.pace === "wait" && inTray(card, "queue");
}

/** Search stays on the note. The owner, the minute, the lane, the tag, and the pace are not part of the query. */
export function visibleGilts(
  cards: readonly GiltCard[],
  tray: GiltTray,
  query: string,
  owner: string | null,
  lane: GiltLane | null,
  tag: string | null,
  pace: GiltPace | null,
  exact: number | null,
  pick: MinutePick | null,
  rushOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): GiltCard[] {
  const text = query.trim().toLowerCase();
  const wantOwner = owner === null ? null : ownerLabel(owner);
  const wantTag = tag === null ? null : giltTag(tag);
  return readGilts(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (rushOnly && card.pace !== "rush") return false;
      if (wantOwner !== null && ownerLabel(card.owner) !== wantOwner) return false;
      if (lane !== null && laneOf(card.lane) !== lane) return false;
      if (wantTag !== null && giltTag(card.tag) !== wantTag) return false;
      if (pace !== null && paceOf(card.pace) !== pace) return false;
      if (!minuteHit(card.minute, exact, pick)) return false;
      if (lateOnly && !waitingLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (paceScore(a.pace) !== paceScore(b.pace)) return paceScore(b.pace) - paceScore(a.pace);
      return a.text.localeCompare(b.text);
    });
}

/** The minute orders the desk. An unset minute stays at the end. Search stays on the note. */
export function giltTimeline(cards: readonly GiltCard[], query: string): GiltCard[] {
  const text = query.trim().toLowerCase();
  return readGilts(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.minute === null && b.minute !== null) return 1;
      if (a.minute !== null && b.minute === null) return -1;
      if (a.minute !== null && b.minute !== null && a.minute !== b.minute) return a.minute - b.minute;
      return a.text.localeCompare(b.text);
    });
}

export function giltCounts(cards: readonly GiltCard[], desk: unknown): GiltCounts {
  const rows = readGilts(cards);
  return {
    queue: rows.filter((card) => inTray(card, "queue")).length,
    parked: rows.filter((card) => inTray(card, "parked")).length,
    closed: rows.filter((card) => inTray(card, "closed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => waitingLate(card, desk)).length,
  };
}

/** Share of the saved slips. A zero total stays at zero. */
export function giltShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function giltOwners(cards: readonly GiltCard[]): string[] {
  const out: string[] = [];
  for (const card of readGilts(cards)) {
    if (card.owner && !out.includes(card.owner)) out.push(card.owner);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function giltTags(cards: readonly GiltCard[]): string[] {
  const out: string[] = [];
  for (const card of readGilts(cards)) {
    if (card.tag && !out.includes(card.tag)) out.push(card.tag);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function giltLanes(cards: readonly GiltCard[]): Exclude<GiltLane, "blank">[] {
  const seen = new Set<string>();
  for (const card of readGilts(cards)) if (card.lane) seen.add(card.lane);
  return LANES.filter((lane) => seen.has(lane));
}

export function giltPaces(cards: readonly GiltCard[]): Exclude<GiltPace, "blank">[] {
  const seen = new Set<string>();
  for (const card of readGilts(cards)) if (card.pace) seen.add(card.pace);
  return PACES.filter((pace) => seen.has(pace));
}

/** How many queued slips an owner still holds. A blank owner is not a load. */
export function ownerLoad(cards: readonly GiltCard[], owner: string): number {
  const name = ownerLabel(owner);
  if (!name) return 0;
  return readGilts(cards).filter((card) => card.owner === name && inTray(card, "queue")).length;
}

/** Three bands. Index 0 is dawn. Index 2 is dusk. */
export function bandCounts(cards: readonly GiltCard[]): number[] {
  const rows = readGilts(cards);
  return BANDS.map((band) => rows.filter((card) => bandOf(card.minute) === band).length);
}

/** "all" and "blank" stay. An owner that is no longer on a slip falls back to all. */
export function activeOwner(filter: string, owners: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const owner = ownerLabel(filter);
  return owner && owners.includes(owner) ? owner : "all";
}

export function ownerArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return ownerLabel(filter);
}

/** "all" and "blank" stay. A lane that is no longer on a slip falls back to all. */
export function activeLane(filter: string, lanes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const lane = laneName(filter);
  return lane && lanes.includes(lane) ? lane : "all";
}

export function laneArg(filter: string): GiltLane | null {
  if (filter === "blank") return "blank";
  return laneName(filter) || null;
}

/** "all" and "blank" stay. A tag that is no longer on a slip falls back to all. */
export function activeTag(filter: string, tags: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tag = giltTag(filter);
  return tag && tags.includes(tag) ? tag : "all";
}

export function tagArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return giltTag(filter);
}

/** "all" and "blank" stay. A pace that is no longer on a slip falls back to all. */
export function activePace(filter: string, paces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pace = paceName(filter);
  return pace && paces.includes(pace) ? pace : "all";
}

export function paceArg(filter: string): GiltPace | null {
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

/** All, blank, the three bands, the two halves, and the minutes 0, 15, 30, 45, and 60 stay. Anything else is all. */
export function activeMinute(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const minute = minuteOf(filter);
  return minute === null ? "all" : String(minute);
}

export function minuteArg(filter: string): { exact: number | null; pick: MinutePick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as MinutePick };
  const minute = minuteOf(filter);
  return minute === null ? { exact: null, pick: null } : { exact: minute, pick: null };
}

/** Other slips with the same lane and the same owner. A blank lane or a blank owner clashes with nothing. */
export function giltClashIds(cards: readonly GiltCard[], id: string): string[] {
  const rows = readGilts(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.lane || !card.owner) return [];
  return rows
    .filter((item) => item.id !== id && item.lane === card.lane && item.owner === card.owner)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** How many saved slips share a lane and an owner with another slip. */
export function clashGiltCount(cards: readonly GiltCard[]): number {
  const rows = readGilts(cards);
  return rows.filter((card) => giltClashIds(rows, card.id).length > 0).length;
}

/**
 * The next queued slip at or after the minute you type, skipping rush.
 * After the last minute, the desk wraps to the earliest queued slip that is not rush.
 */
export function nextGilt(cards: readonly GiltCard[], desk: unknown): string {
  const now = minuteOf(desk);
  if (now === null) return "";
  const waiting = readGilts(cards).filter((card) => inTray(card, "queue") && card.minute !== null && card.pace !== "rush");
  if (!waiting.length) return "";
  const byMinute = (a: GiltCard, b: GiltCard) => (a.minute ?? 0) - (b.minute ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.minute ?? 0) >= now).sort(byMinute);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byMinute)[0].id;
}

/**
 * The lane with the fewest queued slips.
 * A tie keeps the earlier lane: north, then south, east, and west.
 * Slips with no lane are not a load. An empty desk still suggests north.
 */
export function suggestLane(cards: readonly GiltCard[]): Exclude<GiltLane, "blank"> {
  const rows = readGilts(cards).filter((card) => inTray(card, "queue"));
  let best: Exclude<GiltLane, "blank"> = "north";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const lane of LANES) {
    const count = rows.filter((card) => card.lane === lane).length;
    if (count < bestCount) {
      best = lane;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap uses the minute you pass. */
export function giltsCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,owner,minute,lane,tag,pace,band,pinned,parked,closed,gap,audit"];
  for (const card of readGilts(raw)) {
    const gap = giltGap(card.minute, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.owner),
      card.minute === null ? "" : String(card.minute),
      card.lane,
      csvCell(card.tag),
      card.pace,
      bandOf(card.minute),
      card.pinned ? "1" : "0",
      card.parked ? "1" : "0",
      card.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function ownerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ownerLabel(raw) || "all";
}

function laneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return laneName(raw) || "all";
}

function tagSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return giltTag(raw) || "all";
}

function paceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return paceName(raw) || "all";
}

export function readGiltViews(raw: unknown): GiltView[] {
  if (!Array.isArray(raw)) return [];
  const out: GiltView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GiltView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      owner: ownerSlot(row.owner),
      lane: laneSlot(row.lane),
      tag: tagSlot(row.tag),
      pace: paceSlot(row.pace),
      minute: activeMinute(String(row.minute ?? "")),
    });
  }
  return out.slice(0, 5);
}

export function addGiltView(
  views: readonly GiltView[],
  view: { id: string; name: string; tray: GiltTray; query: string; owner: string; lane: string; tag: string; pace: string; minute: string },
): GiltView[] {
  const current = readGiltViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    owner: ownerSlot(view.owner),
    lane: laneSlot(view.lane),
    tag: tagSlot(view.tag),
    pace: paceSlot(view.pace),
    minute: activeMinute(view.minute),
  }].slice(0, 5);
}

export function dropGiltView(views: readonly GiltView[], id: string): GiltView[] {
  return readGiltViews(views).filter((view) => view.id !== id);
}

function ftdRaw(value: FtdValue): FtdMark {
  if (value === true || value === 1) return "funded";
  if (value === false || value === 0) return "open";
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (text === "true" || text === "1" || text === "yes" || text === "funded") return "funded";
    if (text === "false" || text === "0" || text === "no" || text === "open") return "open";
    return "";
  }
  if (!value || typeof value !== "object") return "";
  if (FTD_BLOCK.some((key) => key in value)) return "";
  if (!("ftd" in value)) return "";
  return ftdRaw(value.ftd as FtdValue);
}

/**
 * Funded, open, or unmarked.
 * A login, a name, a follow-up, and the other blocked fields are not a first deposit.
 * A missing flag stays unmarked and is not filled in.
 */
export function ftdOf(value: FtdValue): FtdMark {
  return ftdRaw(value);
}

/** The first A–Z letter of the name. A digit or a blank name stays unmarked. */
export function initialOf(label: unknown): string {
  const text = clip(label, 40);
  const letter = text.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : "";
}

/**
 * Short is 1–4 letters. Mid is 5–8. Long is 9 or more.
 * A blank name stays unmarked.
 */
export function spanOf(label: unknown): NameSpan {
  const text = clip(label, 40);
  if (!text) return "";
  if (text.length <= 4) return "short";
  if (text.length <= 8) return "mid";
  return "long";
}

export function ftdLines(rows: readonly FtdRow[]): MarkLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const mark = ftdOf(row.ftd);
    map.set(mark, (map.get(mark) || 0) + 1);
  }
  const out: MarkLine[] = [];
  for (const mark of ["", ...MARKS]) {
    const count = map.get(mark);
    if (count) out.push({ mark, count });
  }
  return out;
}

export function namedMarks(rows: readonly FtdRow[]): string[] {
  return ftdLines(rows).map((line) => line.mark).filter(Boolean);
}

export function initialLines(rows: readonly FtdRow[]): InitialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const initial = initialOf(row.label);
    map.set(initial, (map.get(initial) || 0) + 1);
  }
  const out: InitialLine[] = [];
  if (map.get("")) out.push({ initial: "", count: map.get("") || 0 });
  const letters = Array.from(map.keys()).filter(Boolean).sort((a, b) => a.localeCompare(b));
  for (const initial of letters) out.push({ initial, count: map.get(initial) || 0 });
  return out;
}

export function namedInitials(rows: readonly FtdRow[]): string[] {
  return initialLines(rows).map((line) => line.initial).filter(Boolean);
}

export function spanLines(rows: readonly FtdRow[]): SpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = spanOf(row.label);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: SpanLine[] = [];
  for (const span of ["", ...SPANS]) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly FtdRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

/** The named mark with the most loaded rows. A tie keeps funded before open. An unmarked flag is not a lead. */
export function leadingMark(rows: readonly FtdRow[]): string {
  const named = ftdLines(rows).filter((line) => line.mark);
  if (!named.length) return "";
  const order = (mark: string) => MARKS.indexOf(mark as (typeof MARKS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.mark) - order(b.mark))[0].mark;
}

/** The initial with the most loaded rows. A tie keeps the earlier letter. A blank initial is not a lead. */
export function leadingInitial(rows: readonly FtdRow[]): string {
  const named = initialLines(rows).filter((line) => line.initial);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.initial.localeCompare(b.initial))[0].initial;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function fdmShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function markToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "funded" || text === "open" || text === "blank") return text;
  return "";
}

export function presentMarks(rows: readonly FtdRow[]): string[] {
  const out: string[] = [];
  for (const line of ftdLines(rows)) {
    const token = line.mark || "blank";
    if (!out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenMarks(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = markToken(item);
    if (!mark || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleMark(hidden: readonly string[], mark: string, present: readonly string[]): string[] {
  const token = markToken(mark);
  if (!token || !present.includes(token)) return readHiddenMarks(hidden, present);
  const current = readHiddenMarks(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleMarks(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenMarks(hidden, present));
  return present.filter((mark) => (showHidden ? gone.has(mark) : !gone.has(mark)));
}

/** "all" and "blank" stay. A mark that is no longer loaded falls back to all. */
export function activeFtd(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (MARKS as readonly string[]).includes(filter) && marks.includes(filter) ? filter : "all";
}

export function ftdArg(filter: string): FtdMark | null {
  if (filter === "blank") return "";
  if ((MARKS as readonly string[]).includes(filter)) return filter as FtdMark;
  return null;
}

/** "all" and "blank" stay. An initial that is no longer loaded falls back to all. */
export function activeInitial(filter: string, initials: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const letter = initialOf(filter);
  return letter && initials.includes(letter) ? letter : "all";
}

export function initialArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const letter = initialOf(filter);
  return letter || null;
}

/** "all" and "blank" stay. A length that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SPANS as readonly string[]).includes(filter) && spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): NameSpan | null {
  if (filter === "blank") return "";
  if ((SPANS as readonly string[]).includes(filter)) return filter as NameSpan;
  return null;
}

/** Search stays on the name. The first-deposit flag is not part of the query. */
export function visibleFtdCustomers<T extends FtdRow>(
  rows: readonly T[],
  mark: FtdMark | null,
  initial: string | null,
  span: NameSpan | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (mark !== null && ftdOf(row.ftd) !== mark) return false;
    if (initial !== null && initialOf(row.label) !== initial) return false;
    if (span !== null && spanOf(row.label) !== span) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the marks, initials, and name lengths on this page. */
export function ftdsCsv(rows: readonly FtdRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of ftdLines(rows)) lines.push(["mark", csvCell(line.mark), String(line.count)].join(","));
  for (const line of initialLines(rows)) lines.push(["initial", csvCell(line.initial), String(line.count)].join(","));
  for (const line of spanLines(rows)) lines.push(["span", line.span, String(line.count)].join(","));
  return lines.join("\n");
}
