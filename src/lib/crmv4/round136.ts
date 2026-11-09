/** Local call windows, and customer counts grouped by the timezone already on each row. */

export const CALL_KEY = "crmv4-call-windows";
export const CALL_VIEW_KEY = "crmv4-call-views";
export const ZONE_KEY = "crmv4-zone-hide";

export type CallRank = 0 | 1 | 2;

export type CallBand = "morning" | "afternoon" | "evening" | "overnight" | "blank";

export type CallSlip = {
  id: string;
  text: string;
  zone: string;
  start: string;
  end: string;
  rank: CallRank;
  parked: boolean;
  done: boolean;
  mute: boolean;
  audit: string;
};

export type CallTray = "open" | "parked" | "done";

export type CallView = {
  id: string;
  name: string;
  tray: CallTray;
  query: string;
  zone: string;
  band: string;
};

export type CallCounts = {
  open: number;
  parked: number;
  done: number;
  mute: number;
  overnightOpen: number;
};

export type ZoneValue =
  | {
      timezone?: unknown;
      language?: unknown;
      country?: unknown;
      registrationCountry?: unknown;
      desk?: unknown;
      deskId?: unknown;
      campaign?: unknown;
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
    }
  | string
  | null
  | undefined;

export type ZoneRow = { timezone?: ZoneValue; label?: string | null };

export type ZoneLine = { timezone: string; region: string; count: number };

export type RegionLine = { region: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "park", "unpark", "done", "reopen", "mute", "unmute"] as const;

const BANDS = ["morning", "afternoon", "evening", "overnight", "blank"] as const;

const ZONE_BLOCK = [
  "language",
  "country",
  "registrationCountry",
  "desk",
  "deskId",
  "campaign",
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
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CallTray {
  return raw === "parked" || raw === "done" ? raw : "open";
}

function rankOf(raw: unknown): CallRank {
  return raw === 1 || raw === 2 ? raw : 0;
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bandName(raw: unknown): CallBand | "" {
  const text = clip(raw, 12);
  return (BANDS as readonly string[]).includes(text) ? (text as CallBand) : "";
}

/** A blank note is left out. The saved text stays short. */
export function callText(raw: unknown): string {
  return clip(raw, 96);
}

/** A blank desk zone stays blank. It is not filled in. */
export function zoneLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank clock stays blank. It is not filled in. */
export function clockLabel(raw: unknown): string {
  return clip(raw, 5);
}

/** A clock is HH:MM. Anything else is not a clock. */
export function clockMinutes(raw: unknown): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(clockLabel(raw));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minutes from start to end. A window that passes midnight wraps. A bad clock stays empty. */
export function spanMinutes(start: unknown, end: unknown): number | null {
  const from = clockMinutes(start);
  const to = clockMinutes(end);
  if (from === null || to === null) return null;
  return to >= from ? to - from : 1440 - from + to;
}

/** Morning, afternoon, evening, overnight, or blank. Overnight needs both clocks and an end before the start. */
export function bandOf(start: unknown, end: unknown): CallBand {
  const from = clockMinutes(start);
  const to = clockMinutes(end);
  if (from !== null && to !== null && to < from) return "overnight";
  const mark = from ?? to;
  if (mark === null) return "blank";
  if (mark < 12 * 60) return "morning";
  if (mark < 17 * 60) return "afternoon";
  return "evening";
}

function intervals(start: number, end: number): [number, number][] {
  if (end > start) return [[start, end]];
  if (end < start) return [[start, 1440], [0, end]];
  return [];
}

function rangesHit(left: [number, number], right: [number, number]): boolean {
  return left[0] < right[1] && right[0] < left[1];
}

/** Two windows clash when their clocks overlap. A zero-length window clashes with nothing. A bad clock clashes with nothing. */
export function windowsOverlap(left: { start: unknown; end: unknown }, right: { start: unknown; end: unknown }): boolean {
  const a0 = clockMinutes(left.start);
  const a1 = clockMinutes(left.end);
  const b0 = clockMinutes(right.start);
  const b1 = clockMinutes(right.end);
  if (a0 === null || a1 === null || b0 === null || b1 === null) return false;
  const a = intervals(a0, a1);
  const b = intervals(b0, b1);
  return a.some((one) => b.some((two) => rangesHit(one, two)));
}

export function readCalls(raw: unknown): CallSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: CallSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CallSlip>;
    const id = String(row.id || "").trim();
    const text = callText(row.text);
    if (!id || !text || out.some((slip) => slip.id === id)) continue;
    out.push({
      id,
      text,
      zone: zoneLabel(row.zone),
      start: clockLabel(row.start),
      end: clockLabel(row.end),
      rank: rankOf(row.rank),
      parked: row.parked === true,
      done: row.done === true,
      mute: row.mute === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 36);
}

export function addCall(
  slips: readonly CallSlip[],
  slip: { id: string; text: string; zone?: string; start?: string; end?: string },
): CallSlip[] {
  const current = readCalls(slips);
  const id = String(slip.id || "").trim();
  const text = callText(slip.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: CallSlip = {
    id,
    text,
    zone: zoneLabel(slip.zone),
    start: clockLabel(slip.start),
    end: clockLabel(slip.end),
    rank: 0,
    parked: false,
    done: false,
    mute: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 36);
}

export function stepCallRank(slips: readonly CallSlip[], id: string, dir: 1 | -1): CallSlip[] {
  return readCalls(slips).map((slip) => {
    if (slip.id !== id) return slip;
    const next = rankOf(Math.min(2, Math.max(0, slip.rank + dir)));
    if (next === slip.rank) return slip;
    return { ...slip, rank: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setCallParked(slips: readonly CallSlip[], id: string, parked: boolean): CallSlip[] {
  return readCalls(slips).map((slip) => (slip.id === id ? { ...slip, parked, audit: parked ? "park" : "unpark" } : slip));
}

export function setCallDone(slips: readonly CallSlip[], id: string, done: boolean): CallSlip[] {
  return readCalls(slips).map((slip) => (slip.id === id ? { ...slip, done, audit: done ? "done" : "reopen" } : slip));
}

export function setCallMute(slips: readonly CallSlip[], id: string, mute: boolean): CallSlip[] {
  return readCalls(slips).map((slip) => (slip.id === id ? { ...slip, mute, audit: mute ? "mute" : "unmute" } : slip));
}

/** A blank edit is left out. A duplicate of another slip is left out. */
export function editCall(slips: readonly CallSlip[], id: string, text: string): CallSlip[] {
  const current = readCalls(slips);
  const next = callText(text);
  if (!next || current.some((slip) => slip.id !== id && slip.text === next)) return current;
  return current.map((slip) => (slip.id === id && slip.text !== next ? { ...slip, text: next, audit: "edit" } : slip));
}

export function bulkCallParked(slips: readonly CallSlip[], ids: readonly string[], parked: boolean): CallSlip[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readCalls(slips).map((slip) => (want.has(slip.id) ? { ...slip, parked, audit: parked ? "park" : "unpark" } : slip));
}

export function bulkCallDone(slips: readonly CallSlip[], ids: readonly string[], done: boolean): CallSlip[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readCalls(slips).map((slip) => (want.has(slip.id) ? { ...slip, done, audit: done ? "done" : "reopen" } : slip));
}

export function resetCalls(): CallSlip[] {
  return [];
}

/** Copy uses the note text. A blank note copies nothing. */
export function callCopy(raw: unknown): string {
  return callText(raw);
}

function inTray(slip: CallSlip, tray: CallTray): boolean {
  if (tray === "done") return slip.done;
  if (tray === "parked") return slip.parked && !slip.done;
  return !slip.parked && !slip.done;
}

/** Search stays on the note. The desk zone and the clocks are not part of the query. */
export function visibleCalls(
  slips: readonly CallSlip[],
  tray: CallTray,
  query: string,
  zone: string | null,
  band: CallBand | null,
  firstOnly: boolean,
): CallSlip[] {
  const text = query.trim().toLowerCase();
  const wantZone = zone === null ? null : zoneLabel(zone);
  return readCalls(slips)
    .filter((slip) => {
      if (!inTray(slip, tray)) return false;
      if (firstOnly && slip.rank !== 2) return false;
      if (wantZone !== null && zoneLabel(slip.zone) !== wantZone) return false;
      if (band !== null && bandOf(slip.start, slip.end) !== band) return false;
      return !text || slip.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return b.rank - a.rank;
      return a.text.localeCompare(b.text);
    });
}

/** The start clock orders the day. A blank or bad start stays at the end. Search stays on the note. */
export function callTimeline(slips: readonly CallSlip[], query: string): CallSlip[] {
  const text = query.trim().toLowerCase();
  return readCalls(slips)
    .filter((slip) => !text || slip.text.toLowerCase().includes(text))
    .sort((a, b) => {
      const left = clockMinutes(a.start);
      const right = clockMinutes(b.start);
      if (left === null && right !== null) return 1;
      if (left !== null && right === null) return -1;
      if (left !== null && right !== null && left !== right) return left - right;
      return a.text.localeCompare(b.text);
    });
}

export function callCounts(slips: readonly CallSlip[]): CallCounts {
  const rows = readCalls(slips);
  return {
    open: rows.filter((slip) => inTray(slip, "open")).length,
    parked: rows.filter((slip) => inTray(slip, "parked")).length,
    done: rows.filter((slip) => inTray(slip, "done")).length,
    mute: rows.filter((slip) => slip.mute).length,
    overnightOpen: rows.filter((slip) => bandOf(slip.start, slip.end) === "overnight" && inTray(slip, "open")).length,
  };
}

/** Share of the saved slips. A zero total stays at zero. */
export function callShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function callZones(slips: readonly CallSlip[]): string[] {
  const out: string[] = [];
  for (const slip of readCalls(slips)) {
    if (slip.zone && !out.includes(slip.zone)) out.push(slip.zone);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function callBands(slips: readonly CallSlip[]): CallBand[] {
  const seen = new Set<CallBand>();
  for (const slip of readCalls(slips)) seen.add(bandOf(slip.start, slip.end));
  return BANDS.filter((band) => band !== "blank" && seen.has(band));
}

/** "all" and "blank" stay. A desk zone that is no longer on a slip falls back to all. */
export function activeCallZone(filter: string, zones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const zone = zoneLabel(filter);
  return zone && zones.includes(zone) ? zone : "all";
}

export function callZoneArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return zoneLabel(filter);
}

/** "all" and "blank" stay. A band that is no longer on a slip falls back to all. */
export function activeBand(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return bands.includes(filter) ? filter : "all";
}

export function bandArg(filter: string): CallBand | null {
  if (filter === "blank") return "blank";
  if (filter === "morning" || filter === "afternoon" || filter === "evening" || filter === "overnight") return filter;
  return null;
}

/** Other slips whose window clashes with this one. The slip itself is left out. */
export function clashIds(slips: readonly CallSlip[], id: string): string[] {
  const rows = readCalls(slips);
  const slip = rows.find((item) => item.id === id);
  if (!slip) return [];
  return rows
    .filter((item) => item.id !== id && windowsOverlap(slip, item))
    .sort((a, b) => {
      const left = clockMinutes(a.start);
      const right = clockMinutes(b.start);
      if (left !== null && right !== null && left !== right) return left - right;
      return a.text.localeCompare(b.text);
    })
    .map((item) => item.id);
}

/** The next open slip at or after the clock. After the last start, the day wraps to the earliest open start. */
export function nextCall(slips: readonly CallSlip[], clock: unknown): string {
  const now = clockMinutes(clock);
  if (now === null) return "";
  const open = readCalls(slips).filter((slip) => inTray(slip, "open") && clockMinutes(slip.start) !== null);
  if (!open.length) return "";
  const byStart = (a: CallSlip, b: CallSlip) => {
    const left = clockMinutes(a.start) as number;
    const right = clockMinutes(b.start) as number;
    return left - right || a.text.localeCompare(b.text);
  };
  const later = open.filter((slip) => (clockMinutes(slip.start) as number) >= now).sort(byStart);
  if (later.length) return later[0].id;
  return open.slice().sort(byStart)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. Clocks stay columns, not search fields. */
export function callsCsv(raw: unknown): string {
  const lines = ["text,zone,start,end,span,band,rank,parked,done,mute,audit"];
  for (const slip of readCalls(raw)) {
    const span = spanMinutes(slip.start, slip.end);
    lines.push([
      csvCell(slip.text),
      csvCell(slip.zone),
      csvCell(slip.start),
      csvCell(slip.end),
      span === null ? "" : String(span),
      bandOf(slip.start, slip.end),
      String(slip.rank),
      slip.parked ? "1" : "0",
      slip.done ? "1" : "0",
      slip.mute ? "1" : "0",
      csvCell(slip.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function zoneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return zoneLabel(raw) || "all";
}

function bandSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return bandName(raw) || "all";
}

export function readCallViews(raw: unknown): CallView[] {
  if (!Array.isArray(raw)) return [];
  const out: CallView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CallView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      zone: zoneSlot(row.zone),
      band: bandSlot(row.band),
    });
  }
  return out.slice(0, 12);
}

export function addCallView(
  views: readonly CallView[],
  view: { id: string; name: string; tray: CallTray; query: string; zone: string; band: string },
): CallView[] {
  const current = readCallViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    zone: zoneSlot(view.zone),
    band: bandSlot(view.band),
  }, ...current].slice(0, 12);
}

export function dropCallView(views: readonly CallView[], id: string): CallView[] {
  return readCallViews(views).filter((view) => view.id !== id);
}

/**
 * The timezone already on the trader row.
 * A language, a country, a registration country, a desk name, a desk id, a campaign,
 * a trading server, a trading group, a broker name, an assignee, a sale status,
 * a retention status, a potential status, a KYC status, an account type, a role,
 * a validation status, or a referral code is not a timezone.
 */
export function timezoneText(value: ZoneValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim().slice(0, 64);
  if (!value || typeof value !== "object") return "";
  if (ZONE_BLOCK.some((key) => key in value)) return "";
  return typeof value.timezone === "string" ? value.timezone.replace(/\s+/g, " ").trim().slice(0, 64) : "";
}

/** The region is the part before the first slash. A timezone with no slash has a blank region. */
export function regionOf(value: ZoneValue): string {
  const timezone = timezoneText(value);
  const cut = timezone.indexOf("/");
  if (cut <= 0) return "";
  return timezone.slice(0, cut).slice(0, 32);
}

export function regionLabel(raw: unknown): string {
  return clip(raw, 32);
}

export function zoneLines(rows: readonly ZoneRow[]): ZoneLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const timezone = timezoneText(row.timezone);
    map.set(timezone, (map.get(timezone) || 0) + 1);
  }
  const out: ZoneLine[] = [];
  map.forEach((count, timezone) => out.push({ timezone, region: regionOf(timezone), count }));
  return out.sort((a, b) => {
    if (!a.timezone) return -1;
    if (!b.timezone) return 1;
    return a.timezone.localeCompare(b.timezone);
  });
}

export function namedTimezones(rows: readonly ZoneRow[]): string[] {
  return zoneLines(rows).map((line) => line.timezone).filter(Boolean);
}

export function regionLines(rows: readonly ZoneRow[]): RegionLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const region = regionOf(row.timezone);
    map.set(region, (map.get(region) || 0) + 1);
  }
  const out: RegionLine[] = [];
  map.forEach((count, region) => out.push({ region, count }));
  return out.sort((a, b) => {
    if (!a.region) return -1;
    if (!b.region) return 1;
    return a.region.localeCompare(b.region);
  });
}

export function namedRegions(rows: readonly ZoneRow[]): string[] {
  return regionLines(rows).map((line) => line.region).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function zoneShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named timezone with the most loaded rows. A tie keeps the earlier name. */
export function leadingTimezone(rows: readonly ZoneRow[]): string {
  const named = zoneLines(rows).filter((line) => line.timezone);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.timezone.localeCompare(b.timezone))[0].timezone;
}

/** The named region with the most loaded rows. A tie keeps the earlier name. A blank region is not a lead. */
export function leadingRegion(rows: readonly ZoneRow[]): string {
  const named = regionLines(rows).filter((line) => line.region);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.region.localeCompare(b.region))[0].region;
}

export function readHiddenZones(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => timezoneText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const timezone = timezoneText(String(item || ""));
    if (!timezone || !allow.has(timezone) || out.includes(timezone)) continue;
    out.push(timezone);
  }
  return out;
}

export function toggleZone(hidden: readonly string[], timezone: string, present: readonly string[]): string[] {
  const current = readHiddenZones(hidden, present);
  const next = timezoneText(timezone);
  if (!next || !present.map((item) => timezoneText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleTimezones(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenZones(hidden, present));
  return namedTimezones(present.map((timezone) => ({ timezone }))).filter((timezone) => (showHidden ? gone.has(timezone) : !gone.has(timezone)));
}

export function activeTimezone(selected: string, visible: readonly string[]): string {
  const timezone = timezoneText(selected);
  if (!timezone) return "";
  return visible.some((item) => timezoneText(item) === timezone) ? timezone : "";
}

export function visibleZoneCustomers<T extends ZoneRow>(
  rows: readonly T[],
  timezone: string,
  blank: boolean,
  region: string | null,
  query: string,
): T[] {
  const want = timezoneText(timezone);
  const wantRegion = region === null ? null : regionLabel(region);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = timezoneText(row.timezone);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (wantRegion !== null && regionOf(got) !== wantRegion) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}

/** The CSV is the timezones, regions, and counts on this page. */
export function zonesCsv(rows: readonly ZoneRow[]): string {
  const lines = ["zone,region,count"];
  for (const line of zoneLines(rows)) lines.push([csvCell(line.timezone), csvCell(line.region), String(line.count)].join(","));
  return lines.join("\n");
}
