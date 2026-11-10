/**
 * Local dispatch slips, and desk names already on each loaded row.
 * Persistence stays in this browser. A future table is a proposal only and is not applied:
 * CREATE TABLE crm_dispatch_slip (
 *   id text primary key,
 *   note text not null,
 *   courier text not null default '',
 *   hour integer,
 *   lane text not null default '',
 *   wax text not null default '',
 *   pace text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 */

export const DISPATCH_KEY = "crmv4-dispatch-slips";
export const DISPATCH_VIEW_KEY = "crmv4-dispatch-views";
export const WING_KEY = "crmv4-desk-wing-hide";

export type DispatchPace = "blank" | "walk" | "trot" | "gallop";

export type DispatchLane = "blank" | "north" | "south" | "east" | "west";

export type DispatchTray = "open" | "held" | "filed";

export type HourPick = "blank" | "night" | "morning" | "afternoon" | "evening" | "odd" | "even";

export type DispatchCard = {
  id: string;
  text: string;
  courier: string;
  hour: number | null;
  lane: string;
  wax: string;
  pace: string;
  pinned: boolean;
  filed: boolean;
  held: boolean;
  audit: string;
};

export type DispatchView = {
  id: string;
  name: string;
  tray: DispatchTray;
  query: string;
  courier: string;
  lane: string;
  wax: string;
  pace: string;
  hour: string;
};

export type DispatchCounts = {
  open: number;
  held: number;
  filed: number;
  pinned: number;
  late: number;
};

export type DeskWing = "" | "north" | "south" | "east" | "west" | "floor";

export type DeskSpan = "" | "short" | "mid" | "long";

export type DeskValue =
  | {
      desk?: unknown;
      email?: unknown;
      phone?: unknown;
      country?: unknown;
      name?: unknown;
      username?: unknown;
      birthDate?: unknown;
      registrationDate?: unknown;
      language?: unknown;
      city?: unknown;
      jobTitle?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type DeskRow = { desk?: DeskValue; label?: string | null };

export type DeskLine = { desk: string; count: number };

export type WingLine = { wing: string; count: number };

export type SpanLine = { span: string; count: number };

export type InitialLine = { initial: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "file", "reopen"] as const;

const LANES = ["north", "south", "east", "west"] as const;

const PACES = ["walk", "trot", "gallop"] as const;

const PACE_ORDER = ["", "walk", "trot", "gallop"] as const;

const PICKS = ["blank", "night", "morning", "afternoon", "evening", "odd", "even"] as const;

const DAYPARTS = ["night", "morning", "afternoon", "evening"] as const;

const WINGS = ["", "north", "south", "east", "west", "floor"] as const;

const SPANS = ["", "short", "mid", "long"] as const;

const DESK_BLOCK = [
  "email",
  "phone",
  "country",
  "name",
  "username",
  "birthDate",
  "registrationDate",
  "language",
  "city",
  "jobTitle",
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): DispatchTray {
  return raw === "held" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function laneName(raw: unknown): Exclude<DispatchLane, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (LANES as readonly string[]).includes(text) ? (text as Exclude<DispatchLane, "blank">) : "";
}

function paceName(raw: unknown): Exclude<DispatchPace, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<DispatchPace, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function dispatchText(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank courier stays blank. It is not filled in. */
export function courierLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank wax mark stays blank. It is not filled in. */
export function waxMark(raw: unknown): string {
  return clip(raw, 8);
}

/**
 * An hour is 0 through 23.
 * Midnight is 0. A blank value stays unset. A leading zero is not an hour.
 * 24 is not an hour.
 */
export function clockOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 23) return raw;
  if (typeof raw === "string" && /^(?:0|[1-9]|1\d|2[0-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** North, south, east, west, or blank. Anything else is blank. */
export function laneOf(raw: unknown): DispatchLane {
  return laneName(raw) || "blank";
}

/** Walk, trot, gallop, or blank. Anything else is blank. */
export function paceOf(raw: unknown): DispatchPace {
  return paceName(raw) || "blank";
}

/** Night is 0–5. Morning is 6–11. Afternoon is 12–17. Evening is 18–23. An unset hour is blank. */
export function hourBand(hour: unknown): "blank" | "night" | "morning" | "afternoon" | "evening" {
  const count = clockOf(hour);
  if (count === null) return "blank";
  if (count <= 5) return "night";
  if (count <= 11) return "morning";
  if (count <= 17) return "afternoon";
  return "evening";
}

/** Odd hours and even hours. An unset hour is blank. Midnight is even. */
export function hourPair(hour: unknown): "blank" | "odd" | "even" {
  const count = clockOf(hour);
  if (count === null) return "blank";
  return count % 2 === 1 ? "odd" : "even";
}

/** The typed clock minus the hour. A positive gap is past the hour. */
export function hourGap(hour: unknown, clock: unknown): number | null {
  const from = clockOf(hour);
  const at = clockOf(clock);
  if (from === null || at === null) return null;
  return at - from;
}

export function readDispatches(raw: unknown): DispatchCard[] {
  if (!Array.isArray(raw)) return [];
  const out: DispatchCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DispatchCard>;
    const id = String(row.id || "").trim();
    const text = dispatchText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      courier: courierLabel(row.courier),
      hour: clockOf(row.hour),
      lane: laneName(row.lane),
      wax: waxMark(row.wax),
      pace: paceName(row.pace),
      pinned: row.pinned === true,
      filed: row.filed === true,
      held: row.held === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 24);
}

export function addDispatch(
  cards: readonly DispatchCard[],
  card: { id: string; text: string; courier?: string; hour?: unknown; lane?: string; wax?: string; pace?: string },
): DispatchCard[] {
  const current = readDispatches(cards);
  const id = String(card.id || "").trim();
  const text = dispatchText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: DispatchCard = {
    id,
    text,
    courier: courierLabel(card.courier),
    hour: clockOf(card.hour),
    lane: laneName(card.lane),
    wax: waxMark(card.wax),
    pace: paceName(card.pace),
    pinned: false,
    filed: false,
    held: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 24);
}

export function stepDispatchPace(cards: readonly DispatchCard[], id: string, dir: 1 | -1): DispatchCard[] {
  return readDispatches(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_ORDER.indexOf(card.pace as (typeof PACE_ORDER)[number]);
    const next = PACE_ORDER[Math.min(PACES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.pace) return card;
    return { ...card, pace: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setDispatchPinned(cards: readonly DispatchCard[], id: string, pinned: boolean): DispatchCard[] {
  return readDispatches(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setDispatchHeld(cards: readonly DispatchCard[], id: string, held: boolean): DispatchCard[] {
  return readDispatches(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setDispatchFiled(cards: readonly DispatchCard[], id: string, filed: boolean): DispatchCard[] {
  return readDispatches(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another slip is left out. */
export function editDispatch(cards: readonly DispatchCard[], id: string, text: string): DispatchCard[] {
  const current = readDispatches(cards);
  const next = dispatchText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkDispatchPinned(cards: readonly DispatchCard[], ids: readonly string[], pinned: boolean): DispatchCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readDispatches(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkDispatchFiled(cards: readonly DispatchCard[], ids: readonly string[], filed: boolean): DispatchCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readDispatches(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

export function resetDispatches(): DispatchCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function dispatchCopy(raw: unknown): string {
  return dispatchText(raw);
}

function inTray(card: DispatchCard, tray: DispatchTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "held") return card.held && !card.filed;
  return !card.held && !card.filed;
}

function hourHit(hour: number | null, exact: number | null, band: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (band === null) return true;
  if (band === "blank") return hour === null;
  if (band === "odd" || band === "even") return hourPair(hour) === band;
  return hourBand(hour) === band;
}

function paceScore(pace: string): number {
  if (pace === "gallop") return 3;
  if (pace === "trot") return 2;
  if (pace === "walk") return 1;
  return 0;
}

/** Search stays on the note. The courier, the hour, the lane, the wax, and the pace are not part of the query. */
export function visibleDispatches(
  cards: readonly DispatchCard[],
  tray: DispatchTray,
  query: string,
  courier: string | null,
  lane: DispatchLane | null,
  wax: string | null,
  pace: DispatchPace | null,
  exact: number | null,
  band: HourPick | null,
  gallopOnly: boolean,
  lateOnly: boolean,
  clock: unknown,
): DispatchCard[] {
  const text = query.trim().toLowerCase();
  const wantCourier = courier === null ? null : courierLabel(courier);
  const wantWax = wax === null ? null : waxMark(wax);
  return readDispatches(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (gallopOnly && card.pace !== "gallop") return false;
      if (wantCourier !== null && courierLabel(card.courier) !== wantCourier) return false;
      if (lane !== null && laneOf(card.lane) !== lane) return false;
      if (wantWax !== null && waxMark(card.wax) !== wantWax) return false;
      if (pace !== null && paceOf(card.pace) !== pace) return false;
      if (!hourHit(card.hour, exact, band)) return false;
      if (lateOnly) {
        const gap = hourGap(card.hour, clock);
        if (gap === null || gap <= 0 || !inTray(card, "open")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (paceScore(a.pace) !== paceScore(b.pace)) return paceScore(b.pace) - paceScore(a.pace);
      return a.text.localeCompare(b.text);
    });
}

/** The hour orders the desk. An unset hour stays at the end. Search stays on the note. */
export function dispatchTimeline(cards: readonly DispatchCard[], query: string): DispatchCard[] {
  const text = query.trim().toLowerCase();
  return readDispatches(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.hour === null && b.hour !== null) return 1;
      if (a.hour !== null && b.hour === null) return -1;
      if (a.hour !== null && b.hour !== null && a.hour !== b.hour) return a.hour - b.hour;
      return a.text.localeCompare(b.text);
    });
}

export function dispatchCounts(cards: readonly DispatchCard[], clock: unknown): DispatchCounts {
  const rows = readDispatches(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => {
      const gap = hourGap(card.hour, clock);
      return gap !== null && gap > 0 && inTray(card, "open");
    }).length,
  };
}

/** Share of the saved slips. A zero total stays at zero. */
export function dispatchShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function dispatchCouriers(cards: readonly DispatchCard[]): string[] {
  const out: string[] = [];
  for (const card of readDispatches(cards)) {
    if (card.courier && !out.includes(card.courier)) out.push(card.courier);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function dispatchWaxes(cards: readonly DispatchCard[]): string[] {
  const out: string[] = [];
  for (const card of readDispatches(cards)) {
    if (card.wax && !out.includes(card.wax)) out.push(card.wax);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function dispatchLanes(cards: readonly DispatchCard[]): Exclude<DispatchLane, "blank">[] {
  const seen = new Set<string>();
  for (const card of readDispatches(cards)) if (card.lane) seen.add(card.lane);
  return LANES.filter((lane) => seen.has(lane));
}

export function dispatchPaces(cards: readonly DispatchCard[]): Exclude<DispatchPace, "blank">[] {
  const seen = new Set<string>();
  for (const card of readDispatches(cards)) if (card.pace) seen.add(card.pace);
  return PACES.filter((pace) => seen.has(pace));
}

/** Four dayparts. Index 0 is night. Index 3 is evening. */
export function daypartCounts(cards: readonly DispatchCard[]): number[] {
  const rows = readDispatches(cards);
  return DAYPARTS.map((band) => rows.filter((card) => hourBand(card.hour) === band).length);
}

/** "all" and "blank" stay. A courier that is no longer on a slip falls back to all. */
export function activeCourier(filter: string, couriers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const courier = courierLabel(filter);
  return courier && couriers.includes(courier) ? courier : "all";
}

export function courierArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return courierLabel(filter);
}

/** "all" and "blank" stay. A lane that is no longer on a slip falls back to all. */
export function activeLane(filter: string, lanes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const lane = laneName(filter);
  return lane && lanes.includes(lane) ? lane : "all";
}

export function laneArg(filter: string): DispatchLane | null {
  if (filter === "blank") return "blank";
  return laneName(filter) || null;
}

/** "all" and "blank" stay. A wax mark that is no longer on a slip falls back to all. */
export function activeWax(filter: string, waxes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const wax = waxMark(filter);
  return wax && waxes.includes(wax) ? wax : "all";
}

export function waxArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return waxMark(filter);
}

/** "all" and "blank" stay. A pace that is no longer on a slip falls back to all. */
export function activePace(filter: string, paces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pace = paceName(filter);
  return pace && paces.includes(pace) ? pace : "all";
}

export function paceArg(filter: string): DispatchPace | null {
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

/** All, blank, the four dayparts, the two pairs, and the hours 0 through 23 stay. Anything else is all. */
export function activeHour(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const hour = clockOf(filter);
  return hour === null ? "all" : String(hour);
}

export function hourArg(filter: string): { exact: number | null; band: HourPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, band: filter as HourPick };
  const hour = clockOf(filter);
  return hour === null ? { exact: null, band: null } : { exact: hour, band: null };
}

/** Other slips with the same lane and the same hour. A blank lane or an unset hour clashes with nothing. */
export function dispatchClashIds(cards: readonly DispatchCard[], id: string): string[] {
  const rows = readDispatches(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.lane || card.hour === null) return [];
  return rows
    .filter((item) => item.id !== id && item.lane === card.lane && item.hour === card.hour)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open slip at or after the clock you type. After the last hour, the desk wraps to the earliest open hour. */
export function nextDispatch(cards: readonly DispatchCard[], clock: unknown): string {
  const now = clockOf(clock);
  if (now === null) return "";
  const waiting = readDispatches(cards).filter((card) => inTray(card, "open") && card.hour !== null);
  if (!waiting.length) return "";
  const byHour = (a: DispatchCard, b: DispatchCard) => (a.hour ?? 0) - (b.hour ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap uses the clock you pass. */
export function dispatchesCsv(raw: unknown, clock: unknown): string {
  const lines = ["note,courier,hour,lane,wax,pace,band,pinned,held,filed,gap,audit"];
  for (const card of readDispatches(raw)) {
    const gap = hourGap(card.hour, clock);
    lines.push([
      csvCell(card.text),
      csvCell(card.courier),
      card.hour === null ? "" : String(card.hour),
      card.lane,
      csvCell(card.wax),
      card.pace,
      hourBand(card.hour),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function courierSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return courierLabel(raw) || "all";
}

function laneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return laneName(raw) || "all";
}

function waxSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return waxMark(raw) || "all";
}

function paceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return paceName(raw) || "all";
}

export function readDispatchViews(raw: unknown): DispatchView[] {
  if (!Array.isArray(raw)) return [];
  const out: DispatchView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DispatchView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 64),
      courier: courierSlot(row.courier),
      lane: laneSlot(row.lane),
      wax: waxSlot(row.wax),
      pace: paceSlot(row.pace),
      hour: activeHour(String(row.hour ?? "")),
    });
  }
  return out.slice(0, 8);
}

export function addDispatchView(
  views: readonly DispatchView[],
  view: { id: string; name: string; tray: DispatchTray; query: string; courier: string; lane: string; wax: string; pace: string; hour: string },
): DispatchView[] {
  const current = readDispatchViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 64),
    courier: courierSlot(view.courier),
    lane: laneSlot(view.lane),
    wax: waxSlot(view.wax),
    pace: paceSlot(view.pace),
    hour: activeHour(view.hour),
  }].slice(0, 8);
}

export function dropDispatchView(views: readonly DispatchView[], id: string): DispatchView[] {
  return readDispatchViews(views).filter((view) => view.id !== id);
}

function resolvedDesk(value: DeskValue): string {
  if (typeof value === "string") return clip(value, 24);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (DESK_BLOCK.some((key) => key in value)) return "";
  return clip(value.desk, 24);
}

/**
 * A desk name from the desk field, or blank.
 * A name, an email, and a phone are not a desk.
 * A missing desk stays unmarked and is not filled in.
 */
export function assignedDesk(value: DeskValue): string {
  return resolvedDesk(value);
}

/** North, south, east, west, floor, or blank. The wing follows the desk name. */
export function wingOf(value: DeskValue): DeskWing {
  const desk = resolvedDesk(value);
  if (!desk) return "";
  const text = desk.toLowerCase();
  if (text.includes("north") || text.includes("kuzey")) return "north";
  if (text.includes("south") || text.includes("güney") || text.includes("guney")) return "south";
  if (text.includes("east") || text.includes("doğu") || text.includes("dogu")) return "east";
  if (text.includes("west") || text.includes("batı") || text.includes("bati")) return "west";
  return "floor";
}

/** Short is 1–6 characters. Mid is 7–12. Long is longer. A blank desk stays blank. */
export function spanOf(value: DeskValue): DeskSpan {
  const desk = resolvedDesk(value);
  if (!desk) return "";
  if (desk.length <= 6) return "short";
  if (desk.length <= 12) return "mid";
  return "long";
}

/** The first letter of the desk name. A desk with no letter stays blank. */
export function initialOf(value: DeskValue): string {
  const desk = resolvedDesk(value);
  if (!desk) return "";
  const text = desk.normalize("NFKD").toLowerCase();
  const match = text.match(/[a-z]/);
  return match ? match[0] : "";
}

export function deskLines(rows: readonly DeskRow[]): DeskLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const desk = assignedDesk(row.desk);
    map.set(desk, (map.get(desk) || 0) + 1);
  }
  const out: DeskLine[] = [];
  const blank = map.get("");
  if (blank) out.push({ desk: "", count: blank });
  const named = Array.from(map.keys()).filter(Boolean).sort((a, b) => a.localeCompare(b));
  for (const desk of named) out.push({ desk, count: map.get(desk) || 0 });
  return out;
}

export function namedDesks(rows: readonly DeskRow[]): string[] {
  return deskLines(rows).map((line) => line.desk).filter(Boolean);
}

export function wingLines(rows: readonly DeskRow[]): WingLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const wing = wingOf(row.desk);
    map.set(wing, (map.get(wing) || 0) + 1);
  }
  const out: WingLine[] = [];
  for (const wing of WINGS) {
    const count = map.get(wing);
    if (count) out.push({ wing, count });
  }
  return out;
}

export function namedWings(rows: readonly DeskRow[]): string[] {
  return wingLines(rows).map((line) => line.wing).filter(Boolean);
}

export function spanLines(rows: readonly DeskRow[]): SpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = spanOf(row.desk);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: SpanLine[] = [];
  for (const span of SPANS) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function initialLines(rows: readonly DeskRow[]): InitialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const initial = initialOf(row.desk);
    if (!initial) continue;
    map.set(initial, (map.get(initial) || 0) + 1);
  }
  const out: InitialLine[] = [];
  map.forEach((count, initial) => out.push({ initial, count }));
  return out.sort((a, b) => a.initial.localeCompare(b.initial));
}

export function namedInitials(rows: readonly DeskRow[]): string[] {
  return initialLines(rows).map((line) => line.initial);
}

/** The named desk with the most loaded rows. A tie keeps the earlier name. An unmarked desk is not a lead. */
export function leadingDesk(rows: readonly DeskRow[]): string {
  const named = deskLines(rows).filter((line) => line.desk);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.desk.localeCompare(b.desk))[0].desk;
}

/** The named wing with the most loaded rows. A tie keeps the earlier wing. A blank wing is not a lead. */
export function leadingWing(rows: readonly DeskRow[]): string {
  const named = wingLines(rows).filter((line) => line.wing);
  if (!named.length) return "";
  const order = (wing: string) => WINGS.indexOf(wing as (typeof WINGS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.wing) - order(b.wing))[0].wing;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function deskShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenDesks(raw: unknown, present: readonly string[]): string[] {
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

export function toggleDesk(hidden: readonly string[], desk: string, present: readonly string[]): string[] {
  const mark = assignedDesk(desk);
  if (!mark || !present.includes(mark)) return readHiddenDesks(hidden, present);
  const current = readHiddenDesks(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleDesks(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenDesks(hidden, present));
  return present.filter((desk) => (showHidden ? gone.has(desk) : !gone.has(desk)));
}

/** "all" and "blank" stay. A desk that is no longer loaded falls back to all. */
export function activeDesk(filter: string, desks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const desk = assignedDesk(filter);
  return desk && desks.includes(desk) ? desk : "all";
}

export function deskArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return assignedDesk(filter);
}

/** "all" and "blank" stay. A wing that is no longer loaded falls back to all. */
export function activeWing(filter: string, wings: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (WINGS as readonly string[]).includes(filter) && wings.includes(filter) ? filter : "all";
}

export function wingArg(filter: string): DeskWing | null {
  if (filter === "blank") return "";
  if ((WINGS as readonly string[]).includes(filter) && filter !== "") return filter as DeskWing;
  return null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SPANS as readonly string[]).includes(filter) && spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): DeskSpan | null {
  if (filter === "blank") return "";
  if ((SPANS as readonly string[]).includes(filter) && filter !== "") return filter as DeskSpan;
  return null;
}

/** An initial that is no longer loaded falls back to all. */
export function activeInitial(filter: string, initials: readonly string[]): string {
  if (!filter || filter === "all") return "all";
  const initial = filter.trim();
  return /^[a-z]$/.test(initial) && initials.includes(initial) ? initial : "all";
}

export function initialArg(filter: string): string | null {
  if (!filter || filter === "all") return null;
  const initial = filter.trim();
  return /^[a-z]$/.test(initial) ? initial : null;
}

/** Search stays on the name. The desk is not part of the query. */
export function visibleDeskCustomers<T extends DeskRow>(
  rows: readonly T[],
  desk: string | null,
  wing: DeskWing | null,
  span: DeskSpan | null,
  initial: string | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (desk !== null && assignedDesk(row.desk) !== desk) return false;
    if (wing !== null && wingOf(row.desk) !== wing) return false;
    if (span !== null && spanOf(row.desk) !== span) return false;
    if (initial !== null && initialOf(row.desk) !== initial) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the desks, wings, spans, and initials on this page. */
export function desksCsv(rows: readonly DeskRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of deskLines(rows)) lines.push(["desk", csvCell(line.desk), String(line.count)].join(","));
  for (const line of wingLines(rows)) lines.push(["wing", line.wing, String(line.count)].join(","));
  for (const line of spanLines(rows)) lines.push(["span", line.span, String(line.count)].join(","));
  for (const line of initialLines(rows)) lines.push(["initial", line.initial, String(line.count)].join(","));
  return lines.join("\n");
}
