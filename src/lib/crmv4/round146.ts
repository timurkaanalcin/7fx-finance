/** Local folio slips, and customer counts grouped by the birth year-month already on each row. */

export const FOLIO_KEY = "crmv4-folio-slips";
export const FOLIO_VIEW_KEY = "crmv4-folio-views";
export const NATAL_KEY = "crmv4-natal-hide";
/** The band uses this date when the caller does not pass one. */
export const NATAL_AS_OF = "2026-11-09";

export type FolioFinish = "blank" | "ivory" | "ink" | "champagne";

export type FolioWing = "blank" | "desk" | "floor" | "line" | "field";

export type FolioTray = "open" | "held" | "done";

export type DayPick = "blank" | "opening" | "hinge" | "close" | "q1" | "q2" | "q3" | "q4";

export type Folio = {
  id: string;
  text: string;
  keeper: string;
  day: number | null;
  wing: string;
  seal: string;
  finish: string;
  pinned: boolean;
  done: boolean;
  held: boolean;
  audit: string;
};

export type FolioView = {
  id: string;
  name: string;
  tray: FolioTray;
  query: string;
  keeper: string;
  wing: string;
  seal: string;
  finish: string;
  day: string;
};

export type FolioCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  late: number;
};

export type NatalValue =
  | {
      birthDate?: unknown;
      registrationDate?: unknown;
      createdAt?: unknown;
      lastSeenAt?: unknown;
      lastLoginAt?: unknown;
      lastContactAt?: unknown;
      retentionFollowUpAt?: unknown;
      expiresAt?: unknown;
      leadInvalidAt?: unknown;
      leadInvalidSource?: unknown;
      leadInvalidReason?: unknown;
      lastRegion?: unknown;
      address?: unknown;
      lastDevice?: unknown;
      lastOs?: unknown;
      lastBrowser?: unknown;
      lastCity?: unknown;
      lastCountry?: unknown;
      lastCountryName?: unknown;
      lastIp?: unknown;
      language?: unknown;
      country?: unknown;
      registrationCountry?: unknown;
      timezone?: unknown;
      desk?: unknown;
      deskId?: unknown;
      campaign?: unknown;
      phone?: unknown;
      tradingServer?: unknown;
      tradingGroup?: unknown;
      brokerName?: unknown;
      assigneeName?: unknown;
      saleStatus?: unknown;
      retentionStatus?: unknown;
      potentialStatus?: unknown;
      documentsStatus?: unknown;
      accountType?: unknown;
      role?: unknown;
      validation?: unknown;
      validationStatus?: unknown;
      referralCodeUsed?: unknown;
      city?: unknown;
    }
  | string
  | number
  | Date
  | null
  | undefined;

export type NatalRow = { born?: NatalValue; label?: string | null };

export type NatalLine = {
  mark: string;
  month: string;
  season: string;
  decade: string;
  generation: string;
  band: string;
  count: number;
};

export type BandLine = { band: string; count: number };

export type NatalSeasonLine = { season: string; count: number };

export type NatalDecadeLine = { decade: string; count: number };

export type GenerationLine = { generation: string; count: number };

export type NatalBand = "" | "young" | "settled" | "senior";

export type NatalSeason = "" | "winter" | "spring" | "summer" | "autumn";

export type NatalGeneration = "" | "silent" | "boom" | "genx" | "millennial" | "genz";

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "done", "reopen"] as const;

const WINGS = ["desk", "floor", "line", "field"] as const;

const FINISHES = ["ivory", "ink", "champagne"] as const;

const FINISH_ORDER = ["", "ivory", "ink", "champagne"] as const;

const QUARTERS = ["q1", "q2", "q3", "q4"] as const;

const BANDS = ["", "young", "settled", "senior"] as const;

const SEASONS = ["", "winter", "spring", "summer", "autumn"] as const;

const GENERATIONS = ["", "silent", "boom", "genx", "millennial", "genz"] as const;

const BLOCK = [
  "registrationDate",
  "createdAt",
  "lastSeenAt",
  "lastLoginAt",
  "lastContactAt",
  "retentionFollowUpAt",
  "expiresAt",
  "leadInvalidAt",
  "leadInvalidSource",
  "leadInvalidReason",
  "lastRegion",
  "address",
  "lastDevice",
  "lastOs",
  "lastBrowser",
  "lastCity",
  "lastCountry",
  "lastCountryName",
  "lastIp",
  "language",
  "country",
  "registrationCountry",
  "timezone",
  "desk",
  "deskId",
  "campaign",
  "phone",
  "tradingServer",
  "tradingGroup",
  "brokerName",
  "assigneeName",
  "saleStatus",
  "retentionStatus",
  "potentialStatus",
  "documentsStatus",
  "accountType",
  "role",
  "validation",
  "validationStatus",
  "referralCodeUsed",
  "city",
] as const;

type Parts = { year: number; month: number | null; day: number | null };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): FolioTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function wingName(raw: unknown): Exclude<FolioWing, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WINGS as readonly string[]).includes(text) ? (text as Exclude<FolioWing, "blank">) : "";
}

function finishName(raw: unknown): Exclude<FolioFinish, "blank"> | "" {
  const text = clip(raw, 10).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<FolioFinish, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function folioText(raw: unknown): string {
  return clip(raw, 96);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 20);
}

/** A blank seal stays blank. It is not filled in. */
export function sealTag(raw: unknown): string {
  return clip(raw, 14);
}

/**
 * A day is 1 through 31. Zero is not a day. A blank value stays unset.
 * A leading zero is unset. Thirty-two is not a day.
 */
export function dayCount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 31) return raw;
  if (typeof raw === "string" && /^([1-9]|[12]\d|3[01])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Desk, floor, line, field, or blank. Anything else is blank. */
export function wingOf(raw: unknown): FolioWing {
  return wingName(raw) || "blank";
}

/** Ivory, ink, champagne, or blank. Anything else is blank. */
export function finishOf(raw: unknown): FolioFinish {
  return finishName(raw) || "blank";
}

/** Opening is 1 through 10. Hinge is 11 through 20. Close is 21 through 31. An unset day is blank. */
export function dayBand(day: unknown): "blank" | "opening" | "hinge" | "close" {
  const count = dayCount(day);
  if (count === null) return "blank";
  if (count <= 10) return "opening";
  if (count <= 20) return "hinge";
  return "close";
}

/** Four quarters. Days 1–7, 8–14, 15–21, and 22–31. An unset day is blank. */
export function dayQuarter(day: unknown): "blank" | "q1" | "q2" | "q3" | "q4" {
  const count = dayCount(day);
  if (count === null) return "blank";
  if (count <= 7) return "q1";
  if (count <= 14) return "q2";
  if (count <= 21) return "q3";
  return "q4";
}

/** Days from the slip day to the desk day. A negative gap is still ahead. An unset day stays empty. */
export function dayGap(day: unknown, desk: unknown): number | null {
  const from = dayCount(day);
  const at = dayCount(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readFolios(raw: unknown): Folio[] {
  if (!Array.isArray(raw)) return [];
  const out: Folio[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Folio>;
    const id = String(row.id || "").trim();
    const text = folioText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      keeper: keeperLabel(row.keeper),
      day: dayCount(row.day),
      wing: wingName(row.wing),
      seal: sealTag(row.seal),
      finish: finishName(row.finish),
      pinned: row.pinned === true,
      done: row.done === true,
      held: row.held === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 24);
}

export function addFolio(
  cards: readonly Folio[],
  card: { id: string; text: string; keeper?: string; day?: unknown; wing?: string; seal?: string; finish?: string },
): Folio[] {
  const current = readFolios(cards);
  const id = String(card.id || "").trim();
  const text = folioText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: Folio = {
    id,
    text,
    keeper: keeperLabel(card.keeper),
    day: dayCount(card.day),
    wing: wingName(card.wing),
    seal: sealTag(card.seal),
    finish: finishName(card.finish),
    pinned: false,
    done: false,
    held: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 24);
}

export function stepFolioFinish(cards: readonly Folio[], id: string, dir: 1 | -1): Folio[] {
  return readFolios(cards).map((card) => {
    if (card.id !== id) return card;
    const at = FINISH_ORDER.indexOf(card.finish as (typeof FINISH_ORDER)[number]);
    const next = FINISH_ORDER[Math.min(FINISHES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.finish) return card;
    return { ...card, finish: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setFolioPinned(cards: readonly Folio[], id: string, pinned: boolean): Folio[] {
  return readFolios(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setFolioHeld(cards: readonly Folio[], id: string, held: boolean): Folio[] {
  return readFolios(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setFolioDone(cards: readonly Folio[], id: string, done: boolean): Folio[] {
  return readFolios(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another slip is left out. */
export function editFolio(cards: readonly Folio[], id: string, text: string): Folio[] {
  const current = readFolios(cards);
  const next = folioText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkFolioPinned(cards: readonly Folio[], ids: readonly string[], pinned: boolean): Folio[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readFolios(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkFolioDone(cards: readonly Folio[], ids: readonly string[], done: boolean): Folio[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readFolios(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

export function resetFolios(): Folio[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function folioCopy(raw: unknown): string {
  return folioText(raw);
}

function inTray(card: Folio, tray: FolioTray): boolean {
  if (tray === "done") return card.done;
  if (tray === "held") return card.held && !card.done;
  return !card.held && !card.done;
}

function dayHit(day: number | null, exact: number | null, band: DayPick | null): boolean {
  if (exact !== null) return day === exact;
  if (band === null) return true;
  if (band === "q1" || band === "q2" || band === "q3" || band === "q4") return dayQuarter(day) === band;
  return dayBand(day) === band;
}

function finishWeight(finish: string): number {
  if (finish === "champagne") return 3;
  if (finish === "ink") return 2;
  if (finish === "ivory") return 1;
  return 0;
}

/** Search stays on the note. The keeper, the day, the wing, the seal, and the finish are not part of the query. */
export function visibleFolios(
  cards: readonly Folio[],
  tray: FolioTray,
  query: string,
  keeper: string | null,
  wing: FolioWing | null,
  seal: string | null,
  finish: FolioFinish | null,
  exact: number | null,
  band: DayPick | null,
  champagneOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): Folio[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = keeper === null ? null : keeperLabel(keeper);
  const wantSeal = seal === null ? null : sealTag(seal);
  return readFolios(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (champagneOnly && card.finish !== "champagne") return false;
      if (wantKeeper !== null && keeperLabel(card.keeper) !== wantKeeper) return false;
      if (wing !== null && wingOf(card.wing) !== wing) return false;
      if (wantSeal !== null && sealTag(card.seal) !== wantSeal) return false;
      if (finish !== null && finishOf(card.finish) !== finish) return false;
      if (!dayHit(card.day, exact, band)) return false;
      if (lateOnly) {
        const gap = dayGap(card.day, desk);
        if (gap === null || gap <= 0 || !inTray(card, "open")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (finishWeight(a.finish) !== finishWeight(b.finish)) return finishWeight(b.finish) - finishWeight(a.finish);
      return a.text.localeCompare(b.text);
    });
}

/** The day orders the desk. An unset day stays at the end. Search stays on the note. */
export function folioTimeline(cards: readonly Folio[], query: string): Folio[] {
  const text = query.trim().toLowerCase();
  return readFolios(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.day === null && b.day !== null) return 1;
      if (a.day !== null && b.day === null) return -1;
      if (a.day !== null && b.day !== null && a.day !== b.day) return a.day - b.day;
      return a.text.localeCompare(b.text);
    });
}

export function folioCounts(cards: readonly Folio[], desk: unknown): FolioCounts {
  const rows = readFolios(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => {
      const gap = dayGap(card.day, desk);
      return gap !== null && gap > 0 && inTray(card, "open");
    }).length,
  };
}

/** Share of the saved slips. A zero total stays at zero. */
export function folioShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function folioKeepers(cards: readonly Folio[]): string[] {
  const out: string[] = [];
  for (const card of readFolios(cards)) {
    if (card.keeper && !out.includes(card.keeper)) out.push(card.keeper);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function folioSeals(cards: readonly Folio[]): string[] {
  const out: string[] = [];
  for (const card of readFolios(cards)) {
    if (card.seal && !out.includes(card.seal)) out.push(card.seal);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function folioWings(cards: readonly Folio[]): Exclude<FolioWing, "blank">[] {
  const seen = new Set<string>();
  for (const card of readFolios(cards)) if (card.wing) seen.add(card.wing);
  return WINGS.filter((wing) => seen.has(wing));
}

export function folioFinishes(cards: readonly Folio[]): Exclude<FolioFinish, "blank">[] {
  const seen = new Set<string>();
  for (const card of readFolios(cards)) if (card.finish) seen.add(card.finish);
  return FINISHES.filter((finish) => seen.has(finish));
}

/** Four quarters. The count is the slips whose day falls in that quarter. */
export function dayQuarterCounts(cards: readonly Folio[]): number[] {
  const rows = readFolios(cards);
  return QUARTERS.map((quarter) => rows.filter((card) => dayQuarter(card.day) === quarter).length);
}

/** "all" and "blank" stay. A keeper that is no longer on a slip falls back to all. */
export function activeKeeper(filter: string, keepers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const keeper = keeperLabel(filter);
  return keeper && keepers.includes(keeper) ? keeper : "all";
}

export function keeperArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return keeperLabel(filter);
}

/** "all" and "blank" stay. A wing that is no longer on a slip falls back to all. */
export function activeWing(filter: string, wings: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const wing = wingName(filter);
  return wing && wings.includes(wing) ? wing : "all";
}

export function wingArg(filter: string): FolioWing | null {
  if (filter === "blank") return "blank";
  return wingName(filter) || null;
}

/** "all" and "blank" stay. A seal that is no longer on a slip falls back to all. */
export function activeSeal(filter: string, seals: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const seal = sealTag(filter);
  return seal && seals.includes(seal) ? seal : "all";
}

export function sealArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return sealTag(filter);
}

/** "all" and "blank" stay. A finish that is no longer on a slip falls back to all. */
export function activeFinish(filter: string, finishes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const finish = finishName(filter);
  return finish && finishes.includes(finish) ? finish : "all";
}

export function finishArg(filter: string): FolioFinish | null {
  if (filter === "blank") return "blank";
  return finishName(filter) || null;
}

/** All, blank, opening, hinge, close, the four quarters, and days 1 through 31 stay. Anything else is all. */
export function activeDay(filter: string): string {
  if (filter === "blank" || filter === "opening" || filter === "hinge" || filter === "close") return filter;
  if ((QUARTERS as readonly string[]).includes(filter)) return filter;
  const day = dayCount(filter);
  return day === null ? "all" : String(day);
}

export function dayArg(filter: string): { exact: number | null; band: DayPick | null } {
  if (
    filter === "blank" ||
    filter === "opening" ||
    filter === "hinge" ||
    filter === "close" ||
    (QUARTERS as readonly string[]).includes(filter)
  ) {
    return { exact: null, band: filter as DayPick };
  }
  const day = dayCount(filter);
  return day === null ? { exact: null, band: null } : { exact: day, band: null };
}

/** Other slips with the same wing and the same day. A blank wing or an unset day clashes with nothing. */
export function folioClashIds(cards: readonly Folio[], id: string): string[] {
  const rows = readFolios(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.wing || card.day === null) return [];
  return rows
    .filter((item) => item.id !== id && item.wing === card.wing && item.day === card.day)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open slip at or after the day. After the last day, the desk wraps to the earliest open day. */
export function nextFolio(cards: readonly Folio[], day: unknown): string {
  const now = dayCount(day);
  if (now === null) return "";
  const waiting = readFolios(cards).filter((card) => inTray(card, "open") && card.day !== null);
  if (!waiting.length) return "";
  const byDay = (a: Folio, b: Folio) => (a.day ?? 0) - (b.day ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.day ?? 0) >= now).sort(byDay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byDay)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap uses the day you pass. */
export function foliosCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,keeper,day,wing,seal,finish,band,pinned,done,held,gap,audit"];
  for (const card of readFolios(raw)) {
    const gap = dayGap(card.day, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.keeper),
      card.day === null ? "" : String(card.day),
      card.wing,
      csvCell(card.seal),
      card.finish,
      dayBand(card.day),
      card.pinned ? "1" : "0",
      card.done ? "1" : "0",
      card.held ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function keeperSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return keeperLabel(raw) || "all";
}

function wingSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return wingName(raw) || "all";
}

function sealSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return sealTag(raw) || "all";
}

function finishSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return finishName(raw) || "all";
}

export function readFolioViews(raw: unknown): FolioView[] {
  if (!Array.isArray(raw)) return [];
  const out: FolioView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FolioView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 96),
      keeper: keeperSlot(row.keeper),
      wing: wingSlot(row.wing),
      seal: sealSlot(row.seal),
      finish: finishSlot(row.finish),
      day: activeDay(String(row.day ?? "")),
    });
  }
  return out.slice(0, 8);
}

export function addFolioView(
  views: readonly FolioView[],
  view: { id: string; name: string; tray: FolioTray; query: string; keeper: string; wing: string; seal: string; finish: string; day: string },
): FolioView[] {
  const current = readFolioViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 96),
    keeper: keeperSlot(view.keeper),
    wing: wingSlot(view.wing),
    seal: sealSlot(view.seal),
    finish: finishSlot(view.finish),
    day: activeDay(view.day),
  }].slice(0, 8);
}

export function dropFolioView(views: readonly FolioView[], id: string): FolioView[] {
  return readFolioViews(views).filter((view) => view.id !== id);
}

function partsOf(raw: unknown): Parts | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1900 || raw > 2026) return null;
    return { year: raw, month: null, day: null };
  }
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    return partsOf(raw.toISOString().slice(0, 10));
  }
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:[T\s].*)?)?)?$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  if (year < 1900 || year > 2026) return null;
  if (!match[2]) return { year, month: null, day: null };
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  if (!match[3]) return { year, month, day: null };
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return { year, month, day };
}

function resolvedParts(value: NatalValue): Parts | null {
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) return partsOf(value);
  if (!value || typeof value !== "object") return null;
  if (BLOCK.some((key) => key in value)) return null;
  const raw = value.birthDate;
  if (typeof raw === "string" || typeof raw === "number" || raw instanceof Date) return partsOf(raw);
  return null;
}

function asOfParts(raw: unknown): Parts {
  return partsOf(raw) || partsOf(NATAL_AS_OF) || { year: 2026, month: 11, day: 9 };
}

function ageYears(parts: Parts, asOf: Parts): number {
  let age = asOf.year - parts.year;
  if (parts.month !== null && asOf.month !== null && asOf.month < parts.month) age -= 1;
  return age;
}

function monthPair(parts: Parts | null): string {
  if (!parts || parts.month === null) return "";
  return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}

/**
 * The birth year-month already on the trader row. A registration date is not a birth date.
 * A created date, a last-seen time, a last login, a last contact, a follow-up, and an expiry are not a birth date.
 * A missing month stays blank and is not filled in. The year is 1900 through 2026.
 */
export function natalText(value: NatalValue): string {
  return monthPair(resolvedParts(value));
}

/** Young is under 30. Settled is 30 through 49. Senior is 50 and later. The day of the month does not change the band. A future birth stays blank. */
export function bandOf(value: NatalValue, asOf?: unknown): NatalBand {
  const parts = resolvedParts(value);
  if (!parts) return "";
  const age = ageYears(parts, asOfParts(asOf));
  if (age < 0) return "";
  if (age < 30) return "young";
  if (age < 50) return "settled";
  return "senior";
}

/** Winter, spring, summer, autumn. A year with no month stays blank. */
export function seasonOf(value: NatalValue): NatalSeason {
  const parts = resolvedParts(value);
  if (!parts || parts.month === null) return "";
  if (parts.month === 12 || parts.month <= 2) return "winter";
  if (parts.month <= 5) return "spring";
  if (parts.month <= 8) return "summer";
  return "autumn";
}

/** The decade mark, such as 90s or 00s. A missing year stays blank. */
export function decadeOf(value: NatalValue): string {
  const parts = resolvedParts(value);
  if (!parts) return "";
  return `${String(parts.year).slice(2, 3)}0s`;
}

/** Silent is before 1946. Boom is 1946 through 1964. Gen X is 1965 through 1980. Millennial is 1981 through 1996. Gen Z is 1997 and later. */
export function generationOf(value: NatalValue): NatalGeneration {
  const parts = resolvedParts(value);
  if (!parts) return "";
  if (parts.year < 1946) return "silent";
  if (parts.year <= 1964) return "boom";
  if (parts.year <= 1980) return "genx";
  if (parts.year <= 1996) return "millennial";
  return "genz";
}

export function natalLines(rows: readonly NatalRow[], asOf?: unknown): NatalLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const mark = natalText(row.born);
    map.set(mark, (map.get(mark) || 0) + 1);
  }
  const out: NatalLine[] = [];
  map.forEach((count, mark) => out.push({
    mark,
    month: mark ? mark.slice(5) : "",
    season: seasonOf(mark),
    decade: decadeOf(mark),
    generation: generationOf(mark),
    band: bandOf(mark, asOf),
    count,
  }));
  return out.sort((a, b) => {
    if (!a.mark) return -1;
    if (!b.mark) return 1;
    return a.mark.localeCompare(b.mark);
  });
}

export function namedMonths(rows: readonly NatalRow[]): string[] {
  return natalLines(rows).map((line) => line.mark).filter(Boolean);
}

export function bandLines(rows: readonly NatalRow[], asOf?: unknown): BandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const band = bandOf(row.born, asOf);
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: BandLine[] = [];
  for (const band of BANDS) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function namedBands(rows: readonly NatalRow[], asOf?: unknown): string[] {
  return bandLines(rows, asOf).map((line) => line.band).filter(Boolean);
}

export function seasonLines(rows: readonly NatalRow[]): NatalSeasonLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const season = seasonOf(row.born);
    map.set(season, (map.get(season) || 0) + 1);
  }
  const out: NatalSeasonLine[] = [];
  for (const season of SEASONS) {
    const count = map.get(season);
    if (count) out.push({ season, count });
  }
  return out;
}

export function namedSeasons(rows: readonly NatalRow[]): string[] {
  return seasonLines(rows).map((line) => line.season).filter(Boolean);
}

export function decadeLines(rows: readonly NatalRow[]): NatalDecadeLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const decade = decadeOf(row.born);
    map.set(decade, (map.get(decade) || 0) + 1);
  }
  const out: NatalDecadeLine[] = [];
  map.forEach((count, decade) => out.push({ decade, count }));
  return out.sort((a, b) => {
    if (!a.decade && b.decade) return -1;
    if (a.decade && !b.decade) return 1;
    return a.decade.localeCompare(b.decade);
  });
}

export function namedDecades(rows: readonly NatalRow[]): string[] {
  return decadeLines(rows).map((line) => line.decade).filter(Boolean);
}

export function generationLines(rows: readonly NatalRow[]): GenerationLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const generation = generationOf(row.born);
    map.set(generation, (map.get(generation) || 0) + 1);
  }
  const out: GenerationLine[] = [];
  for (const generation of GENERATIONS) {
    const count = map.get(generation);
    if (count) out.push({ generation, count });
  }
  return out;
}

export function namedGenerations(rows: readonly NatalRow[]): string[] {
  return generationLines(rows).map((line) => line.generation).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function natalShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named year-month with the most loaded rows. A tie keeps the earlier mark. */
export function leadingMonth(rows: readonly NatalRow[]): string {
  const named = natalLines(rows).filter((line) => line.mark);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.mark.localeCompare(b.mark))[0].mark;
}

/** The named band with the most loaded rows. A tie keeps the earlier name. A blank band is not a lead. */
export function leadingBand(rows: readonly NatalRow[], asOf?: unknown): string {
  const named = bandLines(rows, asOf).filter((line) => line.band);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.band.localeCompare(b.band))[0].band;
}

/** The named season with the most loaded rows. A tie keeps the earlier name. A blank season is not a lead. */
export function leadingSeason(rows: readonly NatalRow[]): string {
  const named = seasonLines(rows).filter((line) => line.season);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.season.localeCompare(b.season))[0].season;
}

/** The named decade with the most loaded rows. A tie keeps the earlier mark. A blank decade is not a lead. */
export function leadingDecade(rows: readonly NatalRow[]): string {
  const named = decadeLines(rows).filter((line) => line.decade);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.decade.localeCompare(b.decade))[0].decade;
}

/** The named generation with the most loaded rows. A tie keeps the earlier name. A blank generation is not a lead. */
export function leadingGeneration(rows: readonly NatalRow[]): string {
  const named = generationLines(rows).filter((line) => line.generation);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.generation.localeCompare(b.generation))[0].generation;
}

export function readHiddenMonths(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => natalText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const mark = natalText(String(item || ""));
    if (!mark || !allow.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleMonth(hidden: readonly string[], mark: string, present: readonly string[]): string[] {
  const current = readHiddenMonths(hidden, present);
  const next = natalText(mark);
  if (!next || !present.map((item) => natalText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleMonths(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenMonths(hidden, present));
  return namedMonths(present.map((born) => ({ born }))).filter((mark) => (showHidden ? gone.has(mark) : !gone.has(mark)));
}

export function activeMonth(selected: string, visible: readonly string[]): string {
  const mark = natalText(selected);
  if (!mark) return "";
  return visible.some((item) => natalText(item) === mark) ? mark : "";
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeBand(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return bands.includes(filter) ? filter : "all";
}

export function bandArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "young" || filter === "settled" || filter === "senior") return filter;
  return null;
}

/** "all" and "blank" stay. A season that is no longer loaded falls back to all. */
export function activeSeason(filter: string, seasons: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return seasons.includes(filter) ? filter : "all";
}

export function seasonArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "winter" || filter === "spring" || filter === "summer" || filter === "autumn") return filter;
  return null;
}

/** "all" and "blank" stay. A decade that is no longer loaded falls back to all. */
export function activeDecade(filter: string, decades: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return decades.includes(filter) ? filter : "all";
}

export function decadeArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return /^\d0s$/.test(filter) ? filter : null;
}

/** "all" and "blank" stay. A generation that is no longer loaded falls back to all. */
export function activeGeneration(filter: string, generations: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return generations.includes(filter) ? filter : "all";
}

export function generationArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "silent" || filter === "boom" || filter === "genx" || filter === "millennial" || filter === "genz") return filter;
  return null;
}

/** Search stays on the name. The birth date is not part of the query. */
export function visibleNatalCustomers<T extends NatalRow>(
  rows: readonly T[],
  mark: string,
  blank: boolean,
  band: string | null,
  season: string | null,
  decade: string | null,
  generation: string | null,
  query: string,
  asOf?: unknown,
): T[] {
  const want = natalText(mark);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = natalText(row.born);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (band !== null && bandOf(row.born, asOf) !== band) return false;
    if (season !== null && seasonOf(row.born) !== season) return false;
    if (decade !== null && decadeOf(row.born) !== decade) return false;
    if (generation !== null && generationOf(row.born) !== generation) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the year-months, seasons, decades, generations, bands, and counts on this page. */
export function natalsCsv(rows: readonly NatalRow[], asOf?: unknown): string {
  const lines = ["mark,month,season,decade,generation,band,count"];
  for (const line of natalLines(rows, asOf)) {
    lines.push([csvCell(line.mark), line.month, line.season, line.decade, line.generation, line.band, String(line.count)].join(","));
  }
  return lines.join("\n");
}
