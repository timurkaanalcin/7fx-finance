/** Local ribbon cards, and customer counts grouped by the invalid reason already on each row. */

export const RIBBON_KEY = "crmv4-ribbon-cards";
export const RIBBON_VIEW_KEY = "crmv4-ribbon-views";
export const REASON_KEY = "crmv4-reason-hide";

export type RibbonGrade = "blank" | "plain" | "firm" | "bold";

export type RibbonLane = "blank" | "floor" | "mezz" | "loft" | "roof";

export type RibbonTray = "open" | "held" | "done";

export type HourPick = "blank" | "dawn" | "day" | "dusk" | "q1" | "q2" | "q3" | "q4";

export type Ribbon = {
  id: string;
  text: string;
  steward: string;
  hour: number | null;
  lane: string;
  seal: string;
  grade: string;
  pinned: boolean;
  done: boolean;
  held: boolean;
  audit: string;
};

export type RibbonView = {
  id: string;
  name: string;
  tray: RibbonTray;
  query: string;
  steward: string;
  lane: string;
  seal: string;
  grade: string;
  hour: string;
};

export type RibbonCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  late: number;
};

export type ReasonValue =
  | {
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
  | null
  | undefined;

export type ReasonRow = { reason?: ReasonValue; label?: string | null };

export type ReasonLine = { reason: string; family: string; length: string; letter: string; count: number };

export type FamilyLine = { family: string; count: number };

export type LengthLine = { length: string; count: number };

export type ReasonMarkLine = { letter: string; count: number };

export type Family = "" | "geo" | "person" | "quality" | "duplicate" | "hours" | "other";

export type ReasonLength = "" | "short" | "mid" | "long";

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "done", "reopen"] as const;

const LANES = ["floor", "mezz", "loft", "roof"] as const;

const GRADES = ["plain", "firm", "bold"] as const;

const GRADE_ORDER = ["", "plain", "firm", "bold"] as const;

const QUARTERS = ["q1", "q2", "q3", "q4"] as const;

const FAMILIES = ["", "geo", "person", "quality", "duplicate", "hours", "other"] as const;

const LENGTHS = ["", "short", "mid", "long"] as const;

const REASON_BLOCK = [
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

const GEO = new Set(["INV_WRONG_GEO", "INV_WRONG_LANGUAGE"]);
const PERSON = new Set(["INV_WRONG_PERSON", "INV_WRONG_NUMBER"]);
const QUALITY = new Set(["INV_WRONG_INFO", "INV_WRONG_SOURCE", "INV_TRASH"]);
const DUPLICATE = new Set(["INV_DUPLICATE", "INV_NOT_REGISTERED"]);
const HOURS = new Set(["INV_NOT_IN_WH", "INV_UNDERAGE", "INV_NO_DOCS"]);

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RibbonTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function laneName(raw: unknown): Exclude<RibbonLane, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (LANES as readonly string[]).includes(text) ? (text as Exclude<RibbonLane, "blank">) : "";
}

function gradeName(raw: unknown): Exclude<RibbonGrade, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GRADES as readonly string[]).includes(text) ? (text as Exclude<RibbonGrade, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function ribbonText(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank steward stays blank. It is not filled in. */
export function stewardLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank seal stays blank. It is not filled in. */
export function sealTag(raw: unknown): string {
  return clip(raw, 10);
}

/**
 * An hour is 0 through 23. Zero is an hour. A blank value stays unset.
 * A leading zero other than 0 itself is unset.
 */
export function hourCount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 23) return raw;
  if (typeof raw === "string" && /^(?:0|[1-9]|1\d|2[0-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Floor, mezz, loft, roof, or blank. Anything else is blank. */
export function laneOf(raw: unknown): RibbonLane {
  return laneName(raw) || "blank";
}

/** Plain, firm, bold, or blank. Anything else is blank. */
export function gradeOf(raw: unknown): RibbonGrade {
  return gradeName(raw) || "blank";
}

/** Dawn is 0 through 7. Day is 8 through 15. Dusk is 16 through 23. An unset hour is blank. */
export function hourBand(hour: unknown): "blank" | "dawn" | "day" | "dusk" {
  const count = hourCount(hour);
  if (count === null) return "blank";
  if (count <= 7) return "dawn";
  if (count <= 15) return "day";
  return "dusk";
}

/** Four quarters of the day, six hours each. An unset hour is blank. */
export function hourQuarter(hour: unknown): "blank" | "q1" | "q2" | "q3" | "q4" {
  const count = hourCount(hour);
  if (count === null) return "blank";
  return QUARTERS[Math.min(3, Math.floor(count / 6))];
}

/** Hours from the ribbon hour to the desk hour. A negative gap is still ahead. An unset hour stays empty. */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourCount(hour);
  const at = hourCount(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readRibbons(raw: unknown): Ribbon[] {
  if (!Array.isArray(raw)) return [];
  const out: Ribbon[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Ribbon>;
    const id = String(row.id || "").trim();
    const text = ribbonText(row.text);
    if (!id || !text || out.some((ribbon) => ribbon.id === id)) continue;
    out.push({
      id,
      text,
      steward: stewardLabel(row.steward),
      hour: hourCount(row.hour),
      lane: laneName(row.lane),
      seal: sealTag(row.seal),
      grade: gradeName(row.grade),
      pinned: row.pinned === true,
      done: row.done === true,
      held: row.held === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 36);
}

export function addRibbon(
  ribbons: readonly Ribbon[],
  ribbon: { id: string; text: string; steward?: string; hour?: unknown; lane?: string; seal?: string; grade?: string },
): Ribbon[] {
  const current = readRibbons(ribbons);
  const id = String(ribbon.id || "").trim();
  const text = ribbonText(ribbon.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: Ribbon = {
    id,
    text,
    steward: stewardLabel(ribbon.steward),
    hour: hourCount(ribbon.hour),
    lane: laneName(ribbon.lane),
    seal: sealTag(ribbon.seal),
    grade: gradeName(ribbon.grade),
    pinned: false,
    done: false,
    held: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 36);
}

export function stepRibbonGrade(ribbons: readonly Ribbon[], id: string, dir: 1 | -1): Ribbon[] {
  return readRibbons(ribbons).map((ribbon) => {
    if (ribbon.id !== id) return ribbon;
    const at = GRADE_ORDER.indexOf(ribbon.grade as (typeof GRADE_ORDER)[number]);
    const next = GRADE_ORDER[Math.min(GRADES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === ribbon.grade) return ribbon;
    return { ...ribbon, grade: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setRibbonPinned(ribbons: readonly Ribbon[], id: string, pinned: boolean): Ribbon[] {
  return readRibbons(ribbons).map((ribbon) => (ribbon.id === id ? { ...ribbon, pinned, audit: pinned ? "pin" : "unpin" } : ribbon));
}

export function setRibbonHeld(ribbons: readonly Ribbon[], id: string, held: boolean): Ribbon[] {
  return readRibbons(ribbons).map((ribbon) => (ribbon.id === id ? { ...ribbon, held, audit: held ? "hold" : "release" } : ribbon));
}

export function setRibbonDone(ribbons: readonly Ribbon[], id: string, done: boolean): Ribbon[] {
  return readRibbons(ribbons).map((ribbon) => (ribbon.id === id ? { ...ribbon, done, audit: done ? "done" : "reopen" } : ribbon));
}

/** A blank edit is left out. A duplicate of another ribbon is left out. */
export function editRibbon(ribbons: readonly Ribbon[], id: string, text: string): Ribbon[] {
  const current = readRibbons(ribbons);
  const next = ribbonText(text);
  if (!next || current.some((ribbon) => ribbon.id !== id && ribbon.text === next)) return current;
  return current.map((ribbon) => (ribbon.id === id && ribbon.text !== next ? { ...ribbon, text: next, audit: "edit" } : ribbon));
}

export function bulkRibbonPinned(ribbons: readonly Ribbon[], ids: readonly string[], pinned: boolean): Ribbon[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readRibbons(ribbons).map((ribbon) => (want.has(ribbon.id) ? { ...ribbon, pinned, audit: pinned ? "pin" : "unpin" } : ribbon));
}

export function bulkRibbonDone(ribbons: readonly Ribbon[], ids: readonly string[], done: boolean): Ribbon[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readRibbons(ribbons).map((ribbon) => (want.has(ribbon.id) ? { ...ribbon, done, audit: done ? "done" : "reopen" } : ribbon));
}

export function resetRibbons(): Ribbon[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function ribbonCopy(raw: unknown): string {
  return ribbonText(raw);
}

function inTray(ribbon: Ribbon, tray: RibbonTray): boolean {
  if (tray === "done") return ribbon.done;
  if (tray === "held") return ribbon.held && !ribbon.done;
  return !ribbon.held && !ribbon.done;
}

function hourHit(hour: number | null, exact: number | null, band: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (band === null) return true;
  if (band === "q1" || band === "q2" || band === "q3" || band === "q4") return hourQuarter(hour) === band;
  return hourBand(hour) === band;
}

function gradeWeight(grade: string): number {
  if (grade === "bold") return 3;
  if (grade === "firm") return 2;
  if (grade === "plain") return 1;
  return 0;
}

/** Search stays on the note. The steward, the hour, the lane, the seal, and the grade are not part of the query. */
export function visibleRibbons(
  ribbons: readonly Ribbon[],
  tray: RibbonTray,
  query: string,
  steward: string | null,
  lane: RibbonLane | null,
  seal: string | null,
  grade: RibbonGrade | null,
  exact: number | null,
  band: HourPick | null,
  boldOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): Ribbon[] {
  const text = query.trim().toLowerCase();
  const wantSteward = steward === null ? null : stewardLabel(steward);
  const wantSeal = seal === null ? null : sealTag(seal);
  return readRibbons(ribbons)
    .filter((ribbon) => {
      if (!inTray(ribbon, tray)) return false;
      if (boldOnly && ribbon.grade !== "bold") return false;
      if (wantSteward !== null && stewardLabel(ribbon.steward) !== wantSteward) return false;
      if (lane !== null && laneOf(ribbon.lane) !== lane) return false;
      if (wantSeal !== null && sealTag(ribbon.seal) !== wantSeal) return false;
      if (grade !== null && gradeOf(ribbon.grade) !== grade) return false;
      if (!hourHit(ribbon.hour, exact, band)) return false;
      if (lateOnly) {
        const gap = hourGap(ribbon.hour, desk);
        if (gap === null || gap <= 0 || !inTray(ribbon, "open")) return false;
      }
      return !text || ribbon.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (gradeWeight(a.grade) !== gradeWeight(b.grade)) return gradeWeight(b.grade) - gradeWeight(a.grade);
      return a.text.localeCompare(b.text);
    });
}

/** The hour orders the desk. An unset hour stays at the end. Search stays on the note. */
export function ribbonTimeline(ribbons: readonly Ribbon[], query: string): Ribbon[] {
  const text = query.trim().toLowerCase();
  return readRibbons(ribbons)
    .filter((ribbon) => !text || ribbon.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.hour === null && b.hour !== null) return 1;
      if (a.hour !== null && b.hour === null) return -1;
      if (a.hour !== null && b.hour !== null && a.hour !== b.hour) return a.hour - b.hour;
      return a.text.localeCompare(b.text);
    });
}

export function ribbonCounts(ribbons: readonly Ribbon[], desk: unknown): RibbonCounts {
  const rows = readRibbons(ribbons);
  return {
    open: rows.filter((ribbon) => inTray(ribbon, "open")).length,
    held: rows.filter((ribbon) => inTray(ribbon, "held")).length,
    done: rows.filter((ribbon) => inTray(ribbon, "done")).length,
    pinned: rows.filter((ribbon) => ribbon.pinned).length,
    late: rows.filter((ribbon) => {
      const gap = hourGap(ribbon.hour, desk);
      return gap !== null && gap > 0 && inTray(ribbon, "open");
    }).length,
  };
}

/** Share of the saved ribbons. A zero total stays at zero. */
export function ribbonShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function ribbonStewards(ribbons: readonly Ribbon[]): string[] {
  const out: string[] = [];
  for (const ribbon of readRibbons(ribbons)) {
    if (ribbon.steward && !out.includes(ribbon.steward)) out.push(ribbon.steward);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function ribbonSeals(ribbons: readonly Ribbon[]): string[] {
  const out: string[] = [];
  for (const ribbon of readRibbons(ribbons)) {
    if (ribbon.seal && !out.includes(ribbon.seal)) out.push(ribbon.seal);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function ribbonLanes(ribbons: readonly Ribbon[]): Exclude<RibbonLane, "blank">[] {
  const seen = new Set<string>();
  for (const ribbon of readRibbons(ribbons)) if (ribbon.lane) seen.add(ribbon.lane);
  return LANES.filter((lane) => seen.has(lane));
}

export function ribbonGrades(ribbons: readonly Ribbon[]): Exclude<RibbonGrade, "blank">[] {
  const seen = new Set<string>();
  for (const ribbon of readRibbons(ribbons)) if (ribbon.grade) seen.add(ribbon.grade);
  return GRADES.filter((grade) => seen.has(grade));
}

/** Four quarters. The count is the ribbons whose hour falls in that quarter. */
export function dayQuarterCounts(ribbons: readonly Ribbon[]): number[] {
  const rows = readRibbons(ribbons);
  return QUARTERS.map((quarter) => rows.filter((ribbon) => hourQuarter(ribbon.hour) === quarter).length);
}

/** "all" and "blank" stay. A steward that is no longer on a ribbon falls back to all. */
export function activeSteward(filter: string, stewards: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const steward = stewardLabel(filter);
  return steward && stewards.includes(steward) ? steward : "all";
}

export function stewardArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return stewardLabel(filter);
}

/** "all" and "blank" stay. A lane that is no longer on a ribbon falls back to all. */
export function activeLane(filter: string, lanes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const lane = laneName(filter);
  return lane && lanes.includes(lane) ? lane : "all";
}

export function laneArg(filter: string): RibbonLane | null {
  if (filter === "blank") return "blank";
  return laneName(filter) || null;
}

/** "all" and "blank" stay. A seal that is no longer on a ribbon falls back to all. */
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

/** "all" and "blank" stay. A grade that is no longer on a ribbon falls back to all. */
export function activeGrade(filter: string, grades: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const grade = gradeName(filter);
  return grade && grades.includes(grade) ? grade : "all";
}

export function gradeArg(filter: string): RibbonGrade | null {
  if (filter === "blank") return "blank";
  return gradeName(filter) || null;
}

/** All, blank, dawn, day, dusk, the four quarters, and hours 0 through 23 stay. Anything else is all. */
export function activeHour(filter: string): string {
  if (filter === "blank" || filter === "dawn" || filter === "day" || filter === "dusk") return filter;
  if ((QUARTERS as readonly string[]).includes(filter)) return filter;
  const hour = hourCount(filter);
  return hour === null ? "all" : String(hour);
}

export function hourArg(filter: string): { exact: number | null; band: HourPick | null } {
  if (
    filter === "blank" ||
    filter === "dawn" ||
    filter === "day" ||
    filter === "dusk" ||
    (QUARTERS as readonly string[]).includes(filter)
  ) {
    return { exact: null, band: filter as HourPick };
  }
  const hour = hourCount(filter);
  return hour === null ? { exact: null, band: null } : { exact: hour, band: null };
}

/** Other ribbons with the same lane and the same hour. A blank lane or an unset hour clashes with nothing. */
export function ribbonClashIds(ribbons: readonly Ribbon[], id: string): string[] {
  const rows = readRibbons(ribbons);
  const ribbon = rows.find((item) => item.id === id);
  if (!ribbon || !ribbon.lane || ribbon.hour === null) return [];
  return rows
    .filter((item) => item.id !== id && item.lane === ribbon.lane && item.hour === ribbon.hour)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open ribbon at or after the hour. After the last hour, the desk wraps to the earliest open hour. */
export function nextRibbon(ribbons: readonly Ribbon[], hour: unknown): string {
  const now = hourCount(hour);
  if (now === null) return "";
  const waiting = readRibbons(ribbons).filter((ribbon) => inTray(ribbon, "open") && ribbon.hour !== null);
  if (!waiting.length) return "";
  const byHour = (a: Ribbon, b: Ribbon) => (a.hour ?? 0) - (b.hour ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((ribbon) => (ribbon.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the ribbons saved in this browser. The gap uses the hour you pass. */
export function ribbonsCsv(raw: unknown, desk: unknown): string {
  const lines = ["text,steward,hour,lane,seal,grade,band,pinned,done,held,gap,audit"];
  for (const ribbon of readRibbons(raw)) {
    const gap = hourGap(ribbon.hour, desk);
    lines.push([
      csvCell(ribbon.text),
      csvCell(ribbon.steward),
      ribbon.hour === null ? "" : String(ribbon.hour),
      ribbon.lane,
      csvCell(ribbon.seal),
      ribbon.grade,
      hourBand(ribbon.hour),
      ribbon.pinned ? "1" : "0",
      ribbon.done ? "1" : "0",
      ribbon.held ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(ribbon.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function stewardSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stewardLabel(raw) || "all";
}

function laneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return laneName(raw) || "all";
}

function sealSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return sealTag(raw) || "all";
}

function gradeSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return gradeName(raw) || "all";
}

export function readRibbonViews(raw: unknown): RibbonView[] {
  if (!Array.isArray(raw)) return [];
  const out: RibbonView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RibbonView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 72),
      steward: stewardSlot(row.steward),
      lane: laneSlot(row.lane),
      seal: sealSlot(row.seal),
      grade: gradeSlot(row.grade),
      hour: activeHour(String(row.hour ?? "")),
    });
  }
  return out.slice(0, 12);
}

export function addRibbonView(
  views: readonly RibbonView[],
  view: { id: string; name: string; tray: RibbonTray; query: string; steward: string; lane: string; seal: string; grade: string; hour: string },
): RibbonView[] {
  const current = readRibbonViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 72),
    steward: stewardSlot(view.steward),
    lane: laneSlot(view.lane),
    seal: sealSlot(view.seal),
    grade: gradeSlot(view.grade),
    hour: activeHour(view.hour),
  }].slice(0, 12);
}

export function dropRibbonView(views: readonly RibbonView[], id: string): RibbonView[] {
  return readRibbonViews(views).filter((view) => view.id !== id);
}

/**
 * The invalid reason already on the trader row. A last region, an address, a last device,
 * a last operating system, a last browser, a last city, a last country, a language, a country,
 * a registration country, a timezone, a desk name, a desk id, a campaign, a phone, a trading server,
 * a trading group, a broker name, an assignee, a sale status, a retention status, a potential status,
 * a KYC status, an account type, a role, a validation status, a referral code, or a profile city
 * is not an invalid reason.
 */
export function reasonText(value: ReasonValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim().slice(0, 32);
  if (!value || typeof value !== "object") return "";
  if (REASON_BLOCK.some((key) => key in value)) return "";
  return typeof value.leadInvalidReason === "string" ? value.leadInvalidReason.replace(/\s+/g, " ").trim().slice(0, 32) : "";
}

/** Geo, person, quality, duplicate, hours, other, or blank. Known codes are read before other. */
export function familyOf(value: ReasonValue): Family {
  const text = reasonText(value).toUpperCase();
  if (!text) return "";
  if (GEO.has(text)) return "geo";
  if (PERSON.has(text)) return "person";
  if (QUALITY.has(text)) return "quality";
  if (DUPLICATE.has(text)) return "duplicate";
  if (HOURS.has(text)) return "hours";
  return "other";
}

/** Short is 1 through 12 characters. Mid is 13 through 16. A longer code is long. A missing reason stays blank. */
export function lengthOf(value: ReasonValue): ReasonLength {
  const text = reasonText(value);
  if (!text) return "";
  if (text.length <= 12) return "short";
  if (text.length <= 16) return "mid";
  return "long";
}

/** The letter after INV_. Any other reason uses its first A to Z letter, or a mark. A missing reason stays blank. */
export function reasonMarkOf(value: ReasonValue): string {
  const reason = reasonText(value);
  if (!reason) return "";
  const prefixed = reason.toUpperCase().match(/^INV_([A-Z])/);
  if (prefixed) return prefixed[1];
  const first = reason[0].toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}

export function reasonMarkLabel(raw: unknown): string {
  const text = clip(raw, 1).toUpperCase();
  if (text === "#") return "#";
  return /^[A-Z]$/.test(text) ? text : "";
}

export function reasonLines(rows: readonly ReasonRow[]): ReasonLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const reason = reasonText(row.reason);
    map.set(reason, (map.get(reason) || 0) + 1);
  }
  const out: ReasonLine[] = [];
  map.forEach((count, reason) => out.push({ reason, family: familyOf(reason), length: lengthOf(reason), letter: reasonMarkOf(reason), count }));
  return out.sort((a, b) => {
    if (!a.reason) return -1;
    if (!b.reason) return 1;
    return a.reason.localeCompare(b.reason);
  });
}

export function namedReasons(rows: readonly ReasonRow[]): string[] {
  return reasonLines(rows).map((line) => line.reason).filter(Boolean);
}

export function familyLines(rows: readonly ReasonRow[]): FamilyLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const family = familyOf(row.reason);
    map.set(family, (map.get(family) || 0) + 1);
  }
  const out: FamilyLine[] = [];
  for (const family of FAMILIES) {
    const count = map.get(family);
    if (count) out.push({ family, count });
  }
  return out;
}

export function namedFamilies(rows: readonly ReasonRow[]): string[] {
  return familyLines(rows).map((line) => line.family).filter(Boolean);
}

export function lengthLines(rows: readonly ReasonRow[]): LengthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const length = lengthOf(row.reason);
    map.set(length, (map.get(length) || 0) + 1);
  }
  const out: LengthLine[] = [];
  for (const length of LENGTHS) {
    const count = map.get(length);
    if (count) out.push({ length, count });
  }
  return out;
}

export function namedLengths(rows: readonly ReasonRow[]): string[] {
  return lengthLines(rows).map((line) => line.length).filter(Boolean);
}

export function reasonMarkLines(rows: readonly ReasonRow[]): ReasonMarkLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const letter = reasonMarkOf(row.reason);
    map.set(letter, (map.get(letter) || 0) + 1);
  }
  const out: ReasonMarkLine[] = [];
  map.forEach((count, letter) => out.push({ letter, count }));
  return out.sort((a, b) => {
    if (!a.letter && b.letter) return -1;
    if (a.letter && !b.letter) return 1;
    if (a.letter === "#" && b.letter !== "#") return 1;
    if (b.letter === "#" && a.letter !== "#") return -1;
    return a.letter.localeCompare(b.letter);
  });
}

export function namedReasonMarks(rows: readonly ReasonRow[]): string[] {
  return reasonMarkLines(rows).map((line) => line.letter).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function reasonShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named reason with the most loaded rows. A tie keeps the earlier name. */
export function leadingReason(rows: readonly ReasonRow[]): string {
  const named = reasonLines(rows).filter((line) => line.reason);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))[0].reason;
}

/** The named family with the most loaded rows. A tie keeps the earlier name. A blank family is not a lead. */
export function leadingFamily(rows: readonly ReasonRow[]): string {
  const named = familyLines(rows).filter((line) => line.family);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.family.localeCompare(b.family))[0].family;
}

/** The named length with the most loaded rows. A tie keeps the earlier name. A blank length is not a lead. */
export function leadingLength(rows: readonly ReasonRow[]): string {
  const named = lengthLines(rows).filter((line) => line.length);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.length.localeCompare(b.length))[0].length;
}

/** The named letter with the most loaded rows. A tie keeps the earlier letter. A blank letter is not a lead. */
export function leadingReasonMark(rows: readonly ReasonRow[]): string {
  const named = reasonMarkLines(rows).filter((line) => line.letter);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter))[0].letter;
}

export function readHiddenReasons(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => reasonText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const reason = reasonText(String(item || ""));
    if (!reason || !allow.has(reason) || out.includes(reason)) continue;
    out.push(reason);
  }
  return out;
}

export function toggleReason(hidden: readonly string[], reason: string, present: readonly string[]): string[] {
  const current = readHiddenReasons(hidden, present);
  const next = reasonText(reason);
  if (!next || !present.map((item) => reasonText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleReasons(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenReasons(hidden, present));
  return namedReasons(present.map((reason) => ({ reason }))).filter((reason) => (showHidden ? gone.has(reason) : !gone.has(reason)));
}

export function activeReason(selected: string, visible: readonly string[]): string {
  const reason = reasonText(selected);
  if (!reason) return "";
  return visible.some((item) => reasonText(item) === reason) ? reason : "";
}

/** "all" and "blank" stay. A family that is no longer loaded falls back to all. */
export function activeFamily(filter: string, families: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return families.includes(filter) ? filter : "all";
}

export function familyArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "geo" || filter === "person" || filter === "quality" || filter === "duplicate" || filter === "hours" || filter === "other") return filter;
  return null;
}

/** "all" and "blank" stay. A length that is no longer loaded falls back to all. */
export function activeLength(filter: string, lengths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return lengths.includes(filter) ? filter : "all";
}

export function lengthArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "short" || filter === "mid" || filter === "long") return filter;
  return null;
}

/** "all" and "blank" stay. A letter that is no longer loaded falls back to all. */
export function activeReasonMark(filter: string, letters: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const letter = filter === "#" ? "#" : reasonMarkLabel(filter);
  return letter && letters.includes(letter) ? letter : "all";
}

export function reasonMarkArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const letter = filter === "#" ? "#" : reasonMarkLabel(filter);
  return letter || null;
}

/** Search stays on the name. The reason is not part of the query. */
export function visibleReasonCustomers<T extends ReasonRow>(
  rows: readonly T[],
  reason: string,
  blank: boolean,
  family: string | null,
  length: string | null,
  letter: string | null,
  query: string,
): T[] {
  const want = reasonText(reason);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = reasonText(row.reason);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (family !== null && familyOf(row.reason) !== family) return false;
    if (length !== null && lengthOf(row.reason) !== length) return false;
    if (letter !== null && reasonMarkOf(row.reason) !== letter) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the reasons, families, lengths, letters, and counts on this page. */
export function reasonsCsv(rows: readonly ReasonRow[]): string {
  const lines = ["reason,family,length,letter,count"];
  for (const line of reasonLines(rows)) {
    lines.push([csvCell(line.reason), line.family, line.length, line.letter, String(line.count)].join(","));
  }
  return lines.join("\n");
}
