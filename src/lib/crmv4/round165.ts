/**
 * Local marquetry task slips, and the trading-enabled flag already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_marq_slip (
 *   id text primary key,
 *   note text not null,
 *   owner text not null default '',
 *   hour integer,
 *   room text not null default '',
 *   tag text not null default '',
 *   weight text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   done boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_trade_gate_hide (
 *   gate text primary key
 * );
 */

export const MARQ_KEY = "crmv4-marq-slips";
export const MARQ_VIEW_KEY = "crmv4-marq-views";
export const GATE_KEY = "crmv4-gate-hide";

export type MarqWeight = "blank" | "light" | "firm" | "heavy";

export type MarqRoom = "blank" | "atelier" | "salon" | "gallery" | "vault";

export type MarqTray = "open" | "held" | "done";

export type HourPick = "blank" | "brief" | "half" | "full" | "slim" | "wide";

export type MarqCard = {
  id: string;
  text: string;
  owner: string;
  hour: number | null;
  room: string;
  tag: string;
  weight: string;
  pinned: boolean;
  held: boolean;
  done: boolean;
  audit: string;
};

export type MarqView = {
  id: string;
  name: string;
  tray: MarqTray;
  query: string;
  owner: string;
  room: string;
  tag: string;
  weight: string;
  hour: string;
};

export type MarqCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  late: number;
};

export type GateMark = "" | "enabled" | "locked";

export type HostSpan = "" | "short" | "mid" | "long";

export type GateValue =
  | {
      tradingEnabled?: unknown;
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
      saleStatus?: unknown;
      retentionStatus?: unknown;
      potentialStatus?: unknown;
      documentsStatus?: unknown;
      accountType?: unknown;
      validationStatus?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type GateRow = { gate?: GateValue; label?: string | null; email?: string | null };

export type GateLine = { gate: string; count: number };

export type DomainLine = { domain: string; count: number };

export type HostLine = { span: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "done", "reopen", "room"] as const;

const ROOMS = ["atelier", "salon", "gallery", "vault"] as const;

const WEIGHTS = ["light", "firm", "heavy"] as const;

const WEIGHT_ORDER = ["", "light", "firm", "heavy"] as const;

const HOURS = [1, 2, 4, 8, 16] as const;

const PICKS = ["blank", "brief", "half", "full", "slim", "wide"] as const;

const BANDS = ["brief", "half", "full"] as const;

const GATES = ["enabled", "locked"] as const;

const SPANS = ["short", "mid", "long"] as const;

const GATE_BLOCK = ["ftd", "affiliateA", "affiliateB", "affiliateC", "campaign", "lastLoginAt", "lastSeenAt", "lastContactAt", "timezone", "language", "country", "name", "email", "phone", "desk", "address", "city", "firstName", "lastName", "lastCountryName", "createdAt", "username", "accountLoginId", "retentionNote", "assigneeName", "brokerName", "retentionFollowUpAt", "saleStatus", "retentionStatus", "potentialStatus", "documentsStatus", "accountType", "validationStatus"] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): MarqTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function roomName(raw: unknown): Exclude<MarqRoom, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (ROOMS as readonly string[]).includes(text) ? (text as Exclude<MarqRoom, "blank">) : "";
}

function weightName(raw: unknown): Exclude<MarqWeight, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WEIGHTS as readonly string[]).includes(text) ? (text as Exclude<MarqWeight, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function marqText(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank owner stays blank. It is not filled in. */
export function ownerLabel(raw: unknown): string {
  return clip(raw, 12);
}

/** A blank tag stays blank. It is not filled in. */
export function marqTag(raw: unknown): string {
  return clip(raw, 8);
}

/**
 * An hour is 1, 2, 4, 8, or 16.
 * A blank value stays unset. 0, 3, and 32 are not hours.
 * A leading zero is not an hour: 01 is unset. 1 is one hour.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number" && (HOURS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:1|2|4|8|16)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Atelier, salon, gallery, vault, or blank. Anything else is blank. */
export function roomOf(raw: unknown): MarqRoom {
  return roomName(raw) || "blank";
}

/** Light, firm, heavy, or blank. Anything else is blank. */
export function weightOf(raw: unknown): MarqWeight {
  return weightName(raw) || "blank";
}

/** Brief is 1. Half is 2–4. Full is 8–16. An unset hour is blank. */
export function bandOf(hour: unknown): "blank" | "brief" | "half" | "full" {
  const count = hourOf(hour);
  if (count === null) return "blank";
  if (count <= 1) return "brief";
  if (count <= 4) return "half";
  return "full";
}

/** Slim is 1–2. Wide is 4–16. An unset hour is blank. */
export function reachOf(hour: unknown): "blank" | "slim" | "wide" {
  const count = hourOf(hour);
  if (count === null) return "blank";
  return count <= 2 ? "slim" : "wide";
}

/** The typed hour minus the slip hour. A positive gap is past the hour. */
export function marqGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readMarqs(raw: unknown): MarqCard[] {
  if (!Array.isArray(raw)) return [];
  const out: MarqCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<MarqCard>;
    const id = String(row.id || "").trim();
    const text = marqText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      owner: ownerLabel(row.owner),
      hour: hourOf(row.hour),
      room: roomName(row.room),
      tag: marqTag(row.tag),
      weight: weightName(row.weight),
      pinned: row.pinned === true,
      held: row.held === true,
      done: row.done === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 10);
}

export function addMarq(
  cards: readonly MarqCard[],
  card: { id: string; text: string; owner?: string; hour?: unknown; room?: string; tag?: string; weight?: string },
): MarqCard[] {
  const current = readMarqs(cards);
  const id = String(card.id || "").trim();
  const text = marqText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: MarqCard = {
    id,
    text,
    owner: ownerLabel(card.owner),
    hour: hourOf(card.hour),
    room: roomName(card.room),
    tag: marqTag(card.tag),
    weight: weightName(card.weight),
    pinned: false,
    held: false,
    done: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 10);
}

export function stepMarqWeight(cards: readonly MarqCard[], id: string, dir: 1 | -1): MarqCard[] {
  return readMarqs(cards).map((card) => {
    if (card.id !== id) return card;
    const at = WEIGHT_ORDER.indexOf(card.weight as (typeof WEIGHT_ORDER)[number]);
    const next = WEIGHT_ORDER[Math.min(WEIGHTS.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.weight) return card;
    return { ...card, weight: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setMarqPinned(cards: readonly MarqCard[], id: string, pinned: boolean): MarqCard[] {
  return readMarqs(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setMarqHeld(cards: readonly MarqCard[], id: string, held: boolean): MarqCard[] {
  return readMarqs(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setMarqDone(cards: readonly MarqCard[], id: string, done: boolean): MarqCard[] {
  return readMarqs(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another note is left out. */
export function editMarq(cards: readonly MarqCard[], id: string, text: string): MarqCard[] {
  const current = readMarqs(cards);
  const next = marqText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkMarqPinned(cards: readonly MarqCard[], ids: readonly string[], pinned: boolean): MarqCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readMarqs(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkMarqDone(cards: readonly MarqCard[], ids: readonly string[], done: boolean): MarqCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readMarqs(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank or unknown room is left out. A slip already in that room is left as it is. */
export function bulkMarqRoom(cards: readonly MarqCard[], ids: readonly string[], room: string): MarqCard[] {
  const name = roomName(room);
  const current = readMarqs(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.room !== name ? { ...card, room: name, audit: "room" } : card));
}

export function resetMarqs(): MarqCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function marqCopy(raw: unknown): string {
  return marqText(raw);
}

function inTray(card: MarqCard, tray: MarqTray): boolean {
  if (tray === "done") return card.done;
  if (tray === "held") return card.held && !card.done;
  return !card.held && !card.done;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "slim" || pick === "wide") return reachOf(hour) === pick;
  return bandOf(hour) === pick;
}

function weightScore(weight: string): number {
  if (weight === "heavy") return 3;
  if (weight === "firm") return 2;
  if (weight === "light") return 1;
  return 0;
}

function waitingLate(card: MarqCard, desk: unknown): boolean {
  const gap = marqGap(card.hour, desk);
  return gap !== null && gap > 0 && card.weight === "light" && inTray(card, "open");
}

/** Search stays on the note. The owner, the hour, the room, the tag, and the weight are not part of the query. */
export function visibleMarqs(
  cards: readonly MarqCard[],
  tray: MarqTray,
  query: string,
  owner: string | null,
  room: MarqRoom | null,
  tag: string | null,
  weight: MarqWeight | null,
  exact: number | null,
  pick: HourPick | null,
  heavyOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): MarqCard[] {
  const text = query.trim().toLowerCase();
  const wantOwner = owner === null ? null : ownerLabel(owner);
  const wantTag = tag === null ? null : marqTag(tag);
  return readMarqs(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (heavyOnly && card.weight !== "heavy") return false;
      if (wantOwner !== null && ownerLabel(card.owner) !== wantOwner) return false;
      if (room !== null && roomOf(card.room) !== room) return false;
      if (wantTag !== null && marqTag(card.tag) !== wantTag) return false;
      if (weight !== null && weightOf(card.weight) !== weight) return false;
      if (!hourHit(card.hour, exact, pick)) return false;
      if (lateOnly && !waitingLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (weightScore(a.weight) !== weightScore(b.weight)) return weightScore(b.weight) - weightScore(a.weight);
      return a.text.localeCompare(b.text);
    });
}

/** The hour orders the desk. An unset hour stays at the end. Search stays on the note. */
export function marqTimeline(cards: readonly MarqCard[], query: string): MarqCard[] {
  const text = query.trim().toLowerCase();
  return readMarqs(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.hour === null && b.hour !== null) return 1;
      if (a.hour !== null && b.hour === null) return -1;
      if (a.hour !== null && b.hour !== null && a.hour !== b.hour) return a.hour - b.hour;
      return a.text.localeCompare(b.text);
    });
}

export function marqCounts(cards: readonly MarqCard[], desk: unknown): MarqCounts {
  const rows = readMarqs(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => waitingLate(card, desk)).length,
  };
}

/** Share of the saved slips. A zero total stays at zero. */
export function marqShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function marqOwners(cards: readonly MarqCard[]): string[] {
  const out: string[] = [];
  for (const card of readMarqs(cards)) {
    if (card.owner && !out.includes(card.owner)) out.push(card.owner);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function marqTags(cards: readonly MarqCard[]): string[] {
  const out: string[] = [];
  for (const card of readMarqs(cards)) {
    if (card.tag && !out.includes(card.tag)) out.push(card.tag);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function marqRooms(cards: readonly MarqCard[]): Exclude<MarqRoom, "blank">[] {
  const seen = new Set<string>();
  for (const card of readMarqs(cards)) if (card.room) seen.add(card.room);
  return ROOMS.filter((room) => seen.has(room));
}

export function marqWeights(cards: readonly MarqCard[]): Exclude<MarqWeight, "blank">[] {
  const seen = new Set<string>();
  for (const card of readMarqs(cards)) if (card.weight) seen.add(card.weight);
  return WEIGHTS.filter((weight) => seen.has(weight));
}

/** How many open slips an owner still holds. A blank owner is not a load. */
export function ownerLoad(cards: readonly MarqCard[], owner: string): number {
  const name = ownerLabel(owner);
  if (!name) return 0;
  return readMarqs(cards).filter((card) => card.owner === name && inTray(card, "open")).length;
}

/** Three bands. Index 0 is brief. Index 2 is full. */
export function bandCounts(cards: readonly MarqCard[]): number[] {
  const rows = readMarqs(cards);
  return BANDS.map((band) => rows.filter((card) => bandOf(card.hour) === band).length);
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

/** "all" and "blank" stay. A room that is no longer on a slip falls back to all. */
export function activeRoom(filter: string, rooms: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const room = roomName(filter);
  return room && rooms.includes(room) ? room : "all";
}

export function roomArg(filter: string): MarqRoom | null {
  if (filter === "blank") return "blank";
  return roomName(filter) || null;
}

/** "all" and "blank" stay. A tag that is no longer on a slip falls back to all. */
export function activeTag(filter: string, tags: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tag = marqTag(filter);
  return tag && tags.includes(tag) ? tag : "all";
}

export function tagArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return marqTag(filter);
}

/** "all" and "blank" stay. A weight that is no longer on a slip falls back to all. */
export function activeWeight(filter: string, weights: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const weight = weightName(filter);
  return weight && weights.includes(weight) ? weight : "all";
}

export function weightArg(filter: string): MarqWeight | null {
  if (filter === "blank") return "blank";
  return weightName(filter) || null;
}

/** All, blank, the three bands, the two reaches, and the hours 1, 2, 4, 8, and 16 stay. Anything else is all. */
export function activeHour(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const hour = hourOf(filter);
  return hour === null ? "all" : String(hour);
}

export function hourArg(filter: string): { exact: number | null; pick: HourPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as HourPick };
  const hour = hourOf(filter);
  return hour === null ? { exact: null, pick: null } : { exact: hour, pick: null };
}

/** Other slips with the same room and the same owner. A blank room or a blank owner clashes with nothing. */
export function marqClashIds(cards: readonly MarqCard[], id: string): string[] {
  const rows = readMarqs(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.room || !card.owner) return [];
  return rows
    .filter((item) => item.id !== id && item.room === card.room && item.owner === card.owner)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** How many saved slips share a room and an owner with another slip. */
export function clashMarqCount(cards: readonly MarqCard[]): number {
  const rows = readMarqs(cards);
  return rows.filter((card) => marqClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open slip at or after the hour you type, skipping heavy.
 * After the last hour, the desk wraps to the earliest open slip that is not heavy.
 */
export function nextMarq(cards: readonly MarqCard[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readMarqs(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.weight !== "heavy");
  if (!waiting.length) return "";
  const byHour = (a: MarqCard, b: MarqCard) => (a.hour ?? 0) - (b.hour ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

/**
 * The room with the fewest open slips.
 * A tie keeps the earlier room: atelier, then salon, gallery, and vault.
 * Slips with no room are not a load. An empty desk still suggests atelier.
 */
export function suggestRoom(cards: readonly MarqCard[]): Exclude<MarqRoom, "blank"> {
  const rows = readMarqs(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<MarqRoom, "blank"> = "atelier";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const room of ROOMS) {
    const count = rows.filter((card) => card.room === room).length;
    if (count < bestCount) {
      best = room;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap uses the hour you pass. */
export function marqsCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,owner,hour,room,tag,weight,band,pinned,held,done,gap,audit"];
  for (const card of readMarqs(raw)) {
    const gap = marqGap(card.hour, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.owner),
      card.hour === null ? "" : String(card.hour),
      card.room,
      csvCell(card.tag),
      card.weight,
      bandOf(card.hour),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.done ? "1" : "0",
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

function roomSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return roomName(raw) || "all";
}

function tagSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return marqTag(raw) || "all";
}

function weightSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return weightName(raw) || "all";
}

export function readMarqViews(raw: unknown): MarqView[] {
  if (!Array.isArray(raw)) return [];
  const out: MarqView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<MarqView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      owner: ownerSlot(row.owner),
      room: roomSlot(row.room),
      tag: tagSlot(row.tag),
      weight: weightSlot(row.weight),
      hour: activeHour(String(row.hour ?? "")),
    });
  }
  return out.slice(0, 5);
}

export function addMarqView(
  views: readonly MarqView[],
  view: { id: string; name: string; tray: MarqTray; query: string; owner: string; room: string; tag: string; weight: string; hour: string },
): MarqView[] {
  const current = readMarqViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    owner: ownerSlot(view.owner),
    room: roomSlot(view.room),
    tag: tagSlot(view.tag),
    weight: weightSlot(view.weight),
    hour: activeHour(view.hour),
  }].slice(0, 5);
}

export function dropMarqView(views: readonly MarqView[], id: string): MarqView[] {
  return readMarqViews(views).filter((view) => view.id !== id);
}

function gateRaw(value: GateValue): GateMark {
  if (value === true || value === 1) return "enabled";
  if (value === false || value === 0) return "locked";
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (text === "true" || text === "1" || text === "yes" || text === "on" || text === "enabled") return "enabled";
    if (text === "false" || text === "0" || text === "no" || text === "off" || text === "locked") return "locked";
    return "";
  }
  if (!value || typeof value !== "object") return "";
  if (GATE_BLOCK.some((key) => key in value)) return "";
  if (!("tradingEnabled" in value)) return "";
  return gateRaw(value.tradingEnabled as GateValue);
}

/**
 * Enabled, locked, or unmarked.
 * A name, an email, a first deposit, and the other blocked fields are not a trade gate.
 * A missing flag stays unmarked and is not filled in.
 */
export function gateOf(value: GateValue): GateMark {
  return gateRaw(value);
}

function hostOf(email: unknown): string {
  const text = clip(email, 80).toLowerCase();
  const at = text.lastIndexOf("@");
  if (at < 1 || at >= text.length - 1) return "";
  const host = text.slice(at + 1).replace(/\.+$/g, "");
  if (!host || /\s/.test(host) || !host.includes(".") || host.startsWith(".") || host.includes("..")) return "";
  return host;
}

/** The first A–Z letter of the mail host. A digit or a blank host stays unmarked. */
export function domainOf(email: unknown): string {
  const letter = hostOf(email).charAt(0).toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : "";
}

/**
 * Short is a host of 1–6 characters. Mid is 7–12. Long is 13 or more.
 * A blank or broken address stays unmarked.
 */
export function hostSpanOf(email: unknown): HostSpan {
  const host = hostOf(email);
  if (!host) return "";
  if (host.length <= 6) return "short";
  if (host.length <= 12) return "mid";
  return "long";
}

export function gateLines(rows: readonly GateRow[]): GateLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const gate = gateOf(row.gate);
    map.set(gate, (map.get(gate) || 0) + 1);
  }
  const out: GateLine[] = [];
  for (const gate of ["", ...GATES]) {
    const count = map.get(gate);
    if (count) out.push({ gate, count });
  }
  return out;
}

export function namedGates(rows: readonly GateRow[]): string[] {
  return gateLines(rows).map((line) => line.gate).filter(Boolean);
}

export function domainLines(rows: readonly GateRow[]): DomainLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const domain = domainOf(row.email);
    map.set(domain, (map.get(domain) || 0) + 1);
  }
  const out: DomainLine[] = [];
  if (map.get("")) out.push({ domain: "", count: map.get("") || 0 });
  const letters = Array.from(map.keys()).filter(Boolean).sort((a, b) => a.localeCompare(b));
  for (const domain of letters) out.push({ domain, count: map.get(domain) || 0 });
  return out;
}

export function namedDomains(rows: readonly GateRow[]): string[] {
  return domainLines(rows).map((line) => line.domain).filter(Boolean);
}

export function hostLines(rows: readonly GateRow[]): HostLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = hostSpanOf(row.email);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: HostLine[] = [];
  for (const span of ["", ...SPANS]) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedHosts(rows: readonly GateRow[]): string[] {
  return hostLines(rows).map((line) => line.span).filter(Boolean);
}

/** The named gate with the most loaded rows. A tie keeps enabled before locked. An unmarked flag is not a lead. */
export function leadingGate(rows: readonly GateRow[]): string {
  const named = gateLines(rows).filter((line) => line.gate);
  if (!named.length) return "";
  const order = (gate: string) => GATES.indexOf(gate as (typeof GATES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.gate) - order(b.gate))[0].gate;
}

/** The domain letter with the most loaded rows. A tie keeps the earlier letter. A blank host is not a lead. */
export function leadingDomain(rows: readonly GateRow[]): string {
  const named = domainLines(rows).filter((line) => line.domain);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain))[0].domain;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function tgnShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function gateToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "enabled" || text === "locked" || text === "blank") return text;
  return "";
}

export function presentGates(rows: readonly GateRow[]): string[] {
  const out: string[] = [];
  for (const line of gateLines(rows)) {
    const token = line.gate || "blank";
    if (!out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenGates(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const gate = gateToken(item);
    if (!gate || !known.has(gate) || out.includes(gate)) continue;
    out.push(gate);
  }
  return out;
}

export function toggleGate(hidden: readonly string[], gate: string, present: readonly string[]): string[] {
  const token = gateToken(gate);
  if (!token || !present.includes(token)) return readHiddenGates(hidden, present);
  const current = readHiddenGates(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleGates(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenGates(hidden, present));
  return present.filter((gate) => (showHidden ? gone.has(gate) : !gone.has(gate)));
}

/** "all" and "blank" stay. A gate that is no longer loaded falls back to all. */
export function activeGate(filter: string, gates: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (GATES as readonly string[]).includes(filter) && gates.includes(filter) ? filter : "all";
}

export function gateArg(filter: string): GateMark | null {
  if (filter === "blank") return "";
  if ((GATES as readonly string[]).includes(filter)) return filter as GateMark;
  return null;
}

/** "all" and "blank" stay. A domain that is no longer loaded falls back to all. */
export function activeDomain(filter: string, domains: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const letter = filter.trim().toUpperCase();
  if (!/^[A-Z]$/.test(letter)) return "all";
  return domains.includes(letter) ? letter : "all";
}

export function domainArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const letter = filter.trim().toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : null;
}

/** "all" and "blank" stay. A host length that is no longer loaded falls back to all. */
export function activeHost(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SPANS as readonly string[]).includes(filter) && spans.includes(filter) ? filter : "all";
}

export function hostArg(filter: string): HostSpan | null {
  if (filter === "blank") return "";
  if ((SPANS as readonly string[]).includes(filter)) return filter as HostSpan;
  return null;
}

/** Search stays on the name. The trade gate and the mail host are not part of the query. */
export function visibleGateCustomers<T extends GateRow>(
  rows: readonly T[],
  gate: GateMark | null,
  domain: string | null,
  span: HostSpan | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (gate !== null && gateOf(row.gate) !== gate) return false;
    if (domain !== null && domainOf(row.email) !== domain) return false;
    if (span !== null && hostSpanOf(row.email) !== span) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the gates, domain letters, and host lengths on this page. */
export function gatesCsv(rows: readonly GateRow[]): string {
  const lines = ["kind,gate,count"];
  for (const line of gateLines(rows)) lines.push(["gate", csvCell(line.gate), String(line.count)].join(","));
  for (const line of domainLines(rows)) lines.push(["domain", csvCell(line.domain), String(line.count)].join(","));
  for (const line of hostLines(rows)) lines.push(["span", line.span, String(line.count)].join(","));
  return lines.join("\n");
}
