/**
 * Local quay slips for the harbor desk, and timezone belts already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_quay_slip (
 *   id text primary key,
 *   note text not null,
 *   mate text not null default '',
 *   berth integer,
 *   timber text not null default '',
 *   pennant text not null default '',
 *   tide text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   stowed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_zone_hide (
 *   belt text primary key
 * );
 */

export const QUAY_KEY = "crmv4-quay-slips";
export const QUAY_VIEW_KEY = "crmv4-quay-views";
export const ZONE_KEY = "crmv4-zone-hide";

export type QuayTide = "blank" | "ebb" | "slack" | "flood";

export type QuayTimber = "blank" | "oak" | "teak" | "pine" | "ash";

export type QuayTray = "open" | "held" | "stowed";

export type BerthPick = "blank" | "cove" | "bay" | "gulf" | "sea" | "inner" | "outer";

export type QuayCard = {
  id: string;
  text: string;
  mate: string;
  berth: number | null;
  timber: string;
  pennant: string;
  tide: string;
  pinned: boolean;
  held: boolean;
  stowed: boolean;
  audit: string;
};

export type QuayView = {
  id: string;
  name: string;
  tray: QuayTray;
  query: string;
  mate: string;
  timber: string;
  pennant: string;
  tide: string;
  berth: string;
};

export type QuayCounts = {
  open: number;
  held: number;
  stowed: number;
  pinned: number;
  late: number;
};

export type ZoneBelt = "" | "africa" | "america" | "asia" | "europe" | "pacific" | "other" | "plain";

export type ZoneSpan = "" | "short" | "mid" | "long";

export type ZoneFold = "" | "plain" | "split" | "deep";

export type ZoneValue =
  | {
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
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type ZoneRow = { timezone?: ZoneValue; label?: string | null };

export type BeltLine = { belt: string; count: number };

export type ZoneSpanLine = { span: string; count: number };

export type FoldLine = { fold: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "stow", "unstow"] as const;

const TIMBERS = ["oak", "teak", "pine", "ash"] as const;

const TIDES = ["ebb", "slack", "flood"] as const;

const TIDE_ORDER = ["", "ebb", "slack", "flood"] as const;

const PICKS = ["blank", "cove", "bay", "gulf", "sea", "inner", "outer"] as const;

const WATCHES = ["cove", "bay", "gulf", "sea"] as const;

const BELTS = ["africa", "america", "asia", "europe", "pacific", "other", "plain"] as const;

const SPANS = ["", "short", "mid", "long"] as const;

const FOLDS = ["", "plain", "split", "deep"] as const;

const ZONE_BLOCK = ["language", "country", "name", "email", "phone", "desk", "address", "city", "firstName", "lastName"] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): QuayTray {
  return raw === "held" || raw === "stowed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function timberName(raw: unknown): Exclude<QuayTimber, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TIMBERS as readonly string[]).includes(text) ? (text as Exclude<QuayTimber, "blank">) : "";
}

function tideName(raw: unknown): Exclude<QuayTide, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TIDES as readonly string[]).includes(text) ? (text as Exclude<QuayTide, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function quayText(raw: unknown): string {
  return clip(raw, 56);
}

/** A blank mate stays blank. It is not filled in. */
export function mateLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank pennant stays blank. It is not filled in. */
export function quayPennant(raw: unknown): string {
  return clip(raw, 8);
}

/**
 * A berth is 1 through 36.
 * A blank value stays unset. 0 and 37 are not berths.
 * A leading zero is still a berth: 01 is 1, and 09 is 9.
 * 00 is not a berth.
 */
export function berthOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 36) return raw;
  if (typeof raw === "string" && /^(?:0?[1-9]|[12]\d|3[0-6])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Oak, teak, pine, ash, or blank. Anything else is blank. */
export function timberOf(raw: unknown): QuayTimber {
  return timberName(raw) || "blank";
}

/** Ebb, slack, flood, or blank. Anything else is blank. */
export function tideOf(raw: unknown): QuayTide {
  return tideName(raw) || "blank";
}

/** Cove is 1–9. Bay is 10–18. Gulf is 19–27. Sea is 28–36. An unset berth is blank. */
export function watchOf(berth: unknown): "blank" | "cove" | "bay" | "gulf" | "sea" {
  const count = berthOf(berth);
  if (count === null) return "blank";
  if (count <= 9) return "cove";
  if (count <= 18) return "bay";
  if (count <= 27) return "gulf";
  return "sea";
}

/** Inner is 1–18. Outer is 19–36. An unset berth is blank. */
export function ringOf(berth: unknown): "blank" | "inner" | "outer" {
  const count = berthOf(berth);
  if (count === null) return "blank";
  return count <= 18 ? "inner" : "outer";
}

/** The typed berth minus the slip berth. A positive gap is past the berth. */
export function quayGap(berth: unknown, desk: unknown): number | null {
  const from = berthOf(berth);
  const at = berthOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readQuays(raw: unknown): QuayCard[] {
  if (!Array.isArray(raw)) return [];
  const out: QuayCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<QuayCard>;
    const id = String(row.id || "").trim();
    const text = quayText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      mate: mateLabel(row.mate),
      berth: berthOf(row.berth),
      timber: timberName(row.timber),
      pennant: quayPennant(row.pennant),
      tide: tideName(row.tide),
      pinned: row.pinned === true,
      held: row.held === true,
      stowed: row.stowed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 12);
}

export function addQuay(
  cards: readonly QuayCard[],
  card: { id: string; text: string; mate?: string; berth?: unknown; timber?: string; pennant?: string; tide?: string },
): QuayCard[] {
  const current = readQuays(cards);
  const id = String(card.id || "").trim();
  const text = quayText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: QuayCard = {
    id,
    text,
    mate: mateLabel(card.mate),
    berth: berthOf(card.berth),
    timber: timberName(card.timber),
    pennant: quayPennant(card.pennant),
    tide: tideName(card.tide),
    pinned: false,
    held: false,
    stowed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 12);
}

export function stepQuayTide(cards: readonly QuayCard[], id: string, dir: 1 | -1): QuayCard[] {
  return readQuays(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TIDE_ORDER.indexOf(card.tide as (typeof TIDE_ORDER)[number]);
    const next = TIDE_ORDER[Math.min(TIDES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.tide) return card;
    return { ...card, tide: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setQuayPinned(cards: readonly QuayCard[], id: string, pinned: boolean): QuayCard[] {
  return readQuays(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setQuayHeld(cards: readonly QuayCard[], id: string, held: boolean): QuayCard[] {
  return readQuays(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setQuayStowed(cards: readonly QuayCard[], id: string, stowed: boolean): QuayCard[] {
  return readQuays(cards).map((card) => (card.id === id ? { ...card, stowed, audit: stowed ? "stow" : "unstow" } : card));
}

/** A blank edit is left out. A duplicate of another quay is left out. */
export function editQuay(cards: readonly QuayCard[], id: string, text: string): QuayCard[] {
  const current = readQuays(cards);
  const next = quayText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkQuayPinned(cards: readonly QuayCard[], ids: readonly string[], pinned: boolean): QuayCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readQuays(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkQuayStowed(cards: readonly QuayCard[], ids: readonly string[], stowed: boolean): QuayCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readQuays(cards).map((card) => (want.has(card.id) ? { ...card, stowed, audit: stowed ? "stow" : "unstow" } : card));
}

export function resetQuays(): QuayCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function quayCopy(raw: unknown): string {
  return quayText(raw);
}

function inTray(card: QuayCard, tray: QuayTray): boolean {
  if (tray === "stowed") return card.stowed;
  if (tray === "held") return card.held && !card.stowed;
  return !card.held && !card.stowed;
}

function berthHit(berth: number | null, exact: number | null, band: BerthPick | null): boolean {
  if (exact !== null) return berth === exact;
  if (band === null) return true;
  if (band === "blank") return berth === null;
  if (band === "inner" || band === "outer") return ringOf(berth) === band;
  return watchOf(berth) === band;
}

function tideScore(tide: string): number {
  if (tide === "flood") return 3;
  if (tide === "slack") return 2;
  if (tide === "ebb") return 1;
  return 0;
}

function ebbLate(card: QuayCard, desk: unknown): boolean {
  const gap = quayGap(card.berth, desk);
  return gap !== null && gap > 0 && card.tide === "ebb" && inTray(card, "open");
}

/** Search stays on the note. The mate, the berth, the timber, the pennant, and the tide are not part of the query. */
export function visibleQuays(
  cards: readonly QuayCard[],
  tray: QuayTray,
  query: string,
  mate: string | null,
  timber: QuayTimber | null,
  pennant: string | null,
  tide: QuayTide | null,
  exact: number | null,
  band: BerthPick | null,
  floodOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): QuayCard[] {
  const text = query.trim().toLowerCase();
  const wantMate = mate === null ? null : mateLabel(mate);
  const wantPennant = pennant === null ? null : quayPennant(pennant);
  return readQuays(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (floodOnly && card.tide !== "flood") return false;
      if (wantMate !== null && mateLabel(card.mate) !== wantMate) return false;
      if (timber !== null && timberOf(card.timber) !== timber) return false;
      if (wantPennant !== null && quayPennant(card.pennant) !== wantPennant) return false;
      if (tide !== null && tideOf(card.tide) !== tide) return false;
      if (!berthHit(card.berth, exact, band)) return false;
      if (lateOnly && !ebbLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (tideScore(a.tide) !== tideScore(b.tide)) return tideScore(b.tide) - tideScore(a.tide);
      return a.text.localeCompare(b.text);
    });
}

/** The berth orders the desk. An unset berth stays at the end. Search stays on the note. */
export function quayTimeline(cards: readonly QuayCard[], query: string): QuayCard[] {
  const text = query.trim().toLowerCase();
  return readQuays(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.berth === null && b.berth !== null) return 1;
      if (a.berth !== null && b.berth === null) return -1;
      if (a.berth !== null && b.berth !== null && a.berth !== b.berth) return a.berth - b.berth;
      return a.text.localeCompare(b.text);
    });
}

export function quayCounts(cards: readonly QuayCard[], desk: unknown): QuayCounts {
  const rows = readQuays(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    stowed: rows.filter((card) => inTray(card, "stowed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => ebbLate(card, desk)).length,
  };
}

/** Share of the saved quays. A zero total stays at zero. */
export function quayShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function quayMates(cards: readonly QuayCard[]): string[] {
  const out: string[] = [];
  for (const card of readQuays(cards)) {
    if (card.mate && !out.includes(card.mate)) out.push(card.mate);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function quayPennants(cards: readonly QuayCard[]): string[] {
  const out: string[] = [];
  for (const card of readQuays(cards)) {
    if (card.pennant && !out.includes(card.pennant)) out.push(card.pennant);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function quayTimbers(cards: readonly QuayCard[]): Exclude<QuayTimber, "blank">[] {
  const seen = new Set<string>();
  for (const card of readQuays(cards)) if (card.timber) seen.add(card.timber);
  return TIMBERS.filter((timber) => seen.has(timber));
}

export function quayTides(cards: readonly QuayCard[]): Exclude<QuayTide, "blank">[] {
  const seen = new Set<string>();
  for (const card of readQuays(cards)) if (card.tide) seen.add(card.tide);
  return TIDES.filter((tide) => seen.has(tide));
}

/** Four watches. Index 0 is cove. Index 3 is sea. */
export function watchCounts(cards: readonly QuayCard[]): number[] {
  const rows = readQuays(cards);
  return WATCHES.map((band) => rows.filter((card) => watchOf(card.berth) === band).length);
}

/** "all" and "blank" stay. A mate that is no longer on a quay falls back to all. */
export function activeMate(filter: string, mates: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mate = mateLabel(filter);
  return mate && mates.includes(mate) ? mate : "all";
}

export function mateArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return mateLabel(filter);
}

/** "all" and "blank" stay. A timber that is no longer on a quay falls back to all. */
export function activeTimber(filter: string, timbers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const timber = timberName(filter);
  return timber && timbers.includes(timber) ? timber : "all";
}

export function timberArg(filter: string): QuayTimber | null {
  if (filter === "blank") return "blank";
  return timberName(filter) || null;
}

/** "all" and "blank" stay. A pennant that is no longer on a quay falls back to all. */
export function activePennant(filter: string, pennants: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pennant = quayPennant(filter);
  return pennant && pennants.includes(pennant) ? pennant : "all";
}

export function pennantArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return quayPennant(filter);
}

/** "all" and "blank" stay. A tide that is no longer on a quay falls back to all. */
export function activeTide(filter: string, tides: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tide = tideName(filter);
  return tide && tides.includes(tide) ? tide : "all";
}

export function tideArg(filter: string): QuayTide | null {
  if (filter === "blank") return "blank";
  return tideName(filter) || null;
}

/** All, blank, the four watches, the two rings, and the berths 1 through 36 stay. Anything else is all. */
export function activeBerth(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const berth = berthOf(filter);
  return berth === null ? "all" : String(berth);
}

export function berthArg(filter: string): { exact: number | null; band: BerthPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, band: filter as BerthPick };
  const berth = berthOf(filter);
  return berth === null ? { exact: null, band: null } : { exact: berth, band: null };
}

/** Other quays with the same timber and the same pennant. A blank timber or a blank pennant clashes with nothing. */
export function quayClashIds(cards: readonly QuayCard[], id: string): string[] {
  const rows = readQuays(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.timber || !card.pennant) return [];
  return rows
    .filter((item) => item.id !== id && item.timber === card.timber && item.pennant === card.pennant)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/**
 * The next open quay at or after the berth you type, skipping flood tide.
 * After the last berth, the desk wraps to the earliest open berth that is not flood.
 */
export function nextQuay(cards: readonly QuayCard[], desk: unknown): string {
  const now = berthOf(desk);
  if (now === null) return "";
  const waiting = readQuays(cards).filter((card) => inTray(card, "open") && card.berth !== null && card.tide !== "flood");
  if (!waiting.length) return "";
  const byBerth = (a: QuayCard, b: QuayCard) => (a.berth ?? 0) - (b.berth ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.berth ?? 0) >= now).sort(byBerth);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBerth)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the quays saved in this browser. The gap uses the berth you pass. */
export function quaysCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,mate,berth,timber,pennant,tide,watch,pinned,held,stowed,gap,audit"];
  for (const card of readQuays(raw)) {
    const gap = quayGap(card.berth, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.mate),
      card.berth === null ? "" : String(card.berth),
      card.timber,
      csvCell(card.pennant),
      card.tide,
      watchOf(card.berth),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.stowed ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function mateSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return mateLabel(raw) || "all";
}

function timberSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return timberName(raw) || "all";
}

function pennantSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return quayPennant(raw) || "all";
}

function tideSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tideName(raw) || "all";
}

export function readQuayViews(raw: unknown): QuayView[] {
  if (!Array.isArray(raw)) return [];
  const out: QuayView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<QuayView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 56),
      mate: mateSlot(row.mate),
      timber: timberSlot(row.timber),
      pennant: pennantSlot(row.pennant),
      tide: tideSlot(row.tide),
      berth: activeBerth(String(row.berth ?? "")),
    });
  }
  return out.slice(0, 4);
}

export function addQuayView(
  views: readonly QuayView[],
  view: { id: string; name: string; tray: QuayTray; query: string; mate: string; timber: string; pennant: string; tide: string; berth: string },
): QuayView[] {
  const current = readQuayViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 56),
    mate: mateSlot(view.mate),
    timber: timberSlot(view.timber),
    pennant: pennantSlot(view.pennant),
    tide: tideSlot(view.tide),
    berth: activeBerth(view.berth),
  }].slice(0, 4);
}

export function dropQuayView(views: readonly QuayView[], id: string): QuayView[] {
  return readQuayViews(views).filter((view) => view.id !== id);
}

function resolvedZone(value: ZoneValue): string {
  if (typeof value === "string") return clip(value, 48);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (ZONE_BLOCK.some((key) => key in value)) return "";
  return clip(value.timezone, 48);
}

/**
 * A timezone from the timezone field, or blank.
 * A language, a country, a name, an email, a phone, a desk, an address, and a city are not a timezone.
 * A missing timezone stays unmarked and is not filled in.
 */
export function assignedZone(value: ZoneValue): string {
  return resolvedZone(value);
}

/** Africa, America, Asia, Europe, Pacific, other, plain, or blank. */
export function beltOf(value: ZoneValue): ZoneBelt {
  const zone = resolvedZone(value);
  if (!/^[A-Za-z]/.test(zone)) return "";
  const head = zone.split("/")[0].toLowerCase();
  if ((["africa", "america", "asia", "europe", "pacific"] as readonly string[]).includes(head)) return head as ZoneBelt;
  if (zone.includes("/") || head === "utc" || head === "gmt" || head === "etc") return "other";
  return "plain";
}

/** Short is a city of 1–6 characters. Mid is 7–12. Long is 13 or more. A blank zone stays blank. */
export function spanOf(value: ZoneValue): ZoneSpan {
  const zone = resolvedZone(value);
  if (!/^[A-Za-z]/.test(zone)) return "";
  const city = zone.split("/").at(-1) || "";
  if (!city) return "";
  if (city.length <= 6) return "short";
  if (city.length <= 12) return "mid";
  return "long";
}

/** Plain has no slash. Split has one slash. Deep has two or more. A blank zone stays blank. */
export function foldOf(value: ZoneValue): ZoneFold {
  const zone = resolvedZone(value);
  if (!/^[A-Za-z]/.test(zone)) return "";
  const slashes = zone.split("/").length - 1;
  if (slashes <= 0) return "plain";
  if (slashes === 1) return "split";
  return "deep";
}

export function beltLines(rows: readonly ZoneRow[]): BeltLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const belt = beltOf(row.timezone);
    map.set(belt, (map.get(belt) || 0) + 1);
  }
  const out: BeltLine[] = [];
  for (const belt of ["", ...BELTS]) {
    const count = map.get(belt);
    if (count) out.push({ belt, count });
  }
  return out;
}

export function namedBelts(rows: readonly ZoneRow[]): string[] {
  return beltLines(rows).map((line) => line.belt).filter(Boolean);
}

export function spanLines(rows: readonly ZoneRow[]): ZoneSpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = spanOf(row.timezone);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: ZoneSpanLine[] = [];
  for (const span of SPANS) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly ZoneRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

export function foldLines(rows: readonly ZoneRow[]): FoldLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const fold = foldOf(row.timezone);
    map.set(fold, (map.get(fold) || 0) + 1);
  }
  const out: FoldLine[] = [];
  for (const fold of FOLDS) {
    const count = map.get(fold);
    if (count) out.push({ fold, count });
  }
  return out;
}

export function namedFolds(rows: readonly ZoneRow[]): string[] {
  return foldLines(rows).map((line) => line.fold).filter(Boolean);
}

/** The belt with the most loaded rows. A tie keeps the earlier belt. An unmarked zone is not a lead. */
export function leadingBelt(rows: readonly ZoneRow[]): string {
  const named = beltLines(rows).filter((line) => line.belt);
  if (!named.length) return "";
  const order = (belt: string) => BELTS.indexOf(belt as (typeof BELTS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.belt) - order(b.belt))[0].belt;
}

/** The named fold with the most loaded rows. A tie keeps the earlier fold. A blank fold is not a lead. */
export function leadingFold(rows: readonly ZoneRow[]): string {
  const named = foldLines(rows).filter((line) => line.fold);
  if (!named.length) return "";
  const order = (fold: string) => FOLDS.indexOf(fold as (typeof FOLDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.fold) - order(b.fold))[0].fold;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function zoneShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenBelts(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = clip(item, 16).toLowerCase();
    if (!(BELTS as readonly string[]).includes(mark) || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleBelt(hidden: readonly string[], belt: string, present: readonly string[]): string[] {
  const mark = (BELTS as readonly string[]).includes(belt) ? belt : beltOf(belt);
  if (!mark || !present.includes(mark)) return readHiddenBelts(hidden, present);
  const current = readHiddenBelts(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleBelts(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenBelts(hidden, present));
  return present.filter((belt) => (showHidden ? gone.has(belt) : !gone.has(belt)));
}

/** "all" and "blank" stay. A belt that is no longer loaded falls back to all. */
export function activeBelt(filter: string, belts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const belt = (BELTS as readonly string[]).includes(filter) ? filter : beltOf(filter);
  return belt && belts.includes(belt) ? belt : "all";
}

export function beltArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (BELTS as readonly string[]).includes(filter) ? filter : null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SPANS as readonly string[]).includes(filter) && spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): ZoneSpan | null {
  if (filter === "blank") return "";
  if ((SPANS as readonly string[]).includes(filter) && filter !== "") return filter as ZoneSpan;
  return null;
}

/** "all" and "blank" stay. A fold that is no longer loaded falls back to all. */
export function activeFold(filter: string, folds: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (FOLDS as readonly string[]).includes(filter) && folds.includes(filter) ? filter : "all";
}

export function foldArg(filter: string): ZoneFold | null {
  if (filter === "blank") return "";
  if ((FOLDS as readonly string[]).includes(filter) && filter !== "") return filter as ZoneFold;
  return null;
}

/** Search stays on the name. The timezone is not part of the query. */
export function visibleZoneCustomers<T extends ZoneRow>(
  rows: readonly T[],
  belt: string | null,
  fold: ZoneFold | null,
  span: ZoneSpan | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (belt !== null && beltOf(row.timezone) !== belt) return false;
    if (fold !== null && foldOf(row.timezone) !== fold) return false;
    if (span !== null && spanOf(row.timezone) !== span) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the belts, spans, and folds on this page. */
export function zonesCsv(rows: readonly ZoneRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of beltLines(rows)) lines.push(["belt", csvCell(line.belt), String(line.count)].join(","));
  for (const line of spanLines(rows)) lines.push(["span", line.span, String(line.count)].join(","));
  for (const line of foldLines(rows)) lines.push(["fold", line.fold, String(line.count)].join(","));
  return lines.join("\n");
}
