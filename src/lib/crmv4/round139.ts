/** Local watch slips, and customer counts grouped by the last operating system already on each row. */

export const WATCH_KEY = "crmv4-watch-slips";
export const WATCH_VIEW_KEY = "crmv4-watch-views";
export const OS_KEY = "crmv4-os-hide";

export type WatchRank = 0 | 1 | 2;

export type Tone = "calm" | "firm" | "urgent" | "blank";

export type WatchTray = "open" | "armed" | "done";

export type MinutePick = "blank" | "brief" | "steady" | "long" | "d1" | "d2" | "d3" | "d4" | "d5" | "d6";

export type WatchSlip = {
  id: string;
  text: string;
  owner: string;
  minute: number;
  tone: string;
  tag: string;
  rank: WatchRank;
  armed: boolean;
  done: boolean;
  hush: boolean;
  audit: string;
};

export type WatchView = {
  id: string;
  name: string;
  tray: WatchTray;
  query: string;
  owner: string;
  tone: string;
  tag: string;
  minute: string;
};

export type WatchCounts = {
  open: number;
  armed: number;
  done: number;
  hush: number;
  passed: number;
};

export type OsValue =
  | {
      lastOs?: unknown;
      lastBrowser?: unknown;
      lastDevice?: unknown;
      lastCity?: unknown;
      lastRegion?: unknown;
      lastCountry?: unknown;
      lastCountryName?: unknown;
      lastIp?: unknown;
      language?: unknown;
      country?: unknown;
      registrationCountry?: unknown;
      timezone?: unknown;
      address?: unknown;
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

export type OsRow = { lastOs?: OsValue; label?: string | null };

export type OsLine = { os: string; family: string; initial: string; count: number };

export type OsFamilyLine = { family: string; count: number };

export type OsInitialLine = { initial: string; count: number };

export type OsFamily = "" | "windows" | "macos" | "ios" | "android" | "linux" | "chromeos" | "other";

const AUDITS = ["save", "edit", "raise", "lower", "arm", "rest", "done", "reopen", "hush", "speak"] as const;

const TONES = ["calm", "firm", "urgent"] as const;

const FAMILIES = ["", "windows", "macos", "ios", "android", "linux", "chromeos", "other"] as const;

const DECADES = ["d1", "d2", "d3", "d4", "d5", "d6"] as const;

const OS_BLOCK = [
  "lastBrowser",
  "lastDevice",
  "lastCity",
  "lastRegion",
  "lastCountry",
  "lastCountryName",
  "lastIp",
  "language",
  "country",
  "registrationCountry",
  "timezone",
  "address",
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

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): WatchTray {
  return raw === "armed" || raw === "done" ? raw : "open";
}

function rankOf(raw: unknown): WatchRank {
  return raw === 1 || raw === 2 ? raw : 0;
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function toneName(raw: unknown): Exclude<Tone, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<Tone, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function watchText(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank owner stays blank. It is not filled in. */
export function ownerLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A blank tag stays blank. It is not filled in. */
export function watchTag(raw: unknown): string {
  return clip(raw, 14);
}

/** A minute is 1 through 60. A blank or any other value stays zero. */
export function minuteCount(raw: unknown): number {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 60) return raw;
  if (typeof raw === "string" && /^(?:[1-9]|[1-5]\d|60)$/.test(raw.trim())) return Number(raw.trim());
  return 0;
}

/** Calm, firm, urgent, or blank. Anything else is blank. */
export function toneOf(raw: unknown): Tone {
  return toneName(raw) || "blank";
}

/** Brief is 1 through 15. Steady is 16 through 40. Long is 41 through 60. A zero minute is blank. */
export function minuteBand(minute: unknown): "blank" | "brief" | "steady" | "long" {
  const count = minuteCount(minute);
  if (!count) return "blank";
  if (count <= 15) return "brief";
  if (count <= 40) return "steady";
  return "long";
}

/** Six bands of ten minutes. A zero minute is blank. */
export function minuteDecade(minute: unknown): "blank" | "d1" | "d2" | "d3" | "d4" | "d5" | "d6" {
  const count = minuteCount(minute);
  if (!count) return "blank";
  const index = Math.min(5, Math.floor((count - 1) / 10));
  return DECADES[index];
}

/** Minutes from the slip minute to the desk minute. A negative gap is still ahead. A zero minute stays empty. */
export function minuteGap(minute: unknown, desk: unknown): number | null {
  const from = minuteCount(minute);
  const at = minuteCount(desk);
  if (!from || !at) return null;
  return at - from;
}

export function readWatches(raw: unknown): WatchSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: WatchSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WatchSlip>;
    const id = String(row.id || "").trim();
    const text = watchText(row.text);
    if (!id || !text || out.some((slip) => slip.id === id)) continue;
    out.push({
      id,
      text,
      owner: ownerLabel(row.owner),
      minute: minuteCount(row.minute),
      tone: toneName(row.tone),
      tag: watchTag(row.tag),
      rank: rankOf(row.rank),
      armed: row.armed === true,
      done: row.done === true,
      hush: row.hush === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 36);
}

export function addWatch(
  slips: readonly WatchSlip[],
  slip: { id: string; text: string; owner?: string; minute?: unknown; tone?: string; tag?: string },
): WatchSlip[] {
  const current = readWatches(slips);
  const id = String(slip.id || "").trim();
  const text = watchText(slip.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: WatchSlip = {
    id,
    text,
    owner: ownerLabel(slip.owner),
    minute: minuteCount(slip.minute),
    tone: toneName(slip.tone),
    tag: watchTag(slip.tag),
    rank: 0,
    armed: false,
    done: false,
    hush: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 36);
}

export function stepWatchRank(slips: readonly WatchSlip[], id: string, dir: 1 | -1): WatchSlip[] {
  return readWatches(slips).map((slip) => {
    if (slip.id !== id) return slip;
    const next = rankOf(Math.min(2, Math.max(0, slip.rank + dir)));
    if (next === slip.rank) return slip;
    return { ...slip, rank: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setWatchArmed(slips: readonly WatchSlip[], id: string, armed: boolean): WatchSlip[] {
  return readWatches(slips).map((slip) => (slip.id === id ? { ...slip, armed, audit: armed ? "arm" : "rest" } : slip));
}

export function setWatchDone(slips: readonly WatchSlip[], id: string, done: boolean): WatchSlip[] {
  return readWatches(slips).map((slip) => (slip.id === id ? { ...slip, done, audit: done ? "done" : "reopen" } : slip));
}

export function setWatchHush(slips: readonly WatchSlip[], id: string, hush: boolean): WatchSlip[] {
  return readWatches(slips).map((slip) => (slip.id === id ? { ...slip, hush, audit: hush ? "hush" : "speak" } : slip));
}

/** A blank edit is left out. A duplicate of another slip is left out. */
export function editWatch(slips: readonly WatchSlip[], id: string, text: string): WatchSlip[] {
  const current = readWatches(slips);
  const next = watchText(text);
  if (!next || current.some((slip) => slip.id !== id && slip.text === next)) return current;
  return current.map((slip) => (slip.id === id && slip.text !== next ? { ...slip, text: next, audit: "edit" } : slip));
}

export function bulkWatchArmed(slips: readonly WatchSlip[], ids: readonly string[], armed: boolean): WatchSlip[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readWatches(slips).map((slip) => (want.has(slip.id) ? { ...slip, armed, audit: armed ? "arm" : "rest" } : slip));
}

export function bulkWatchDone(slips: readonly WatchSlip[], ids: readonly string[], done: boolean): WatchSlip[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readWatches(slips).map((slip) => (want.has(slip.id) ? { ...slip, done, audit: done ? "done" : "reopen" } : slip));
}

export function resetWatches(): WatchSlip[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function watchCopy(raw: unknown): string {
  return watchText(raw);
}

function inTray(slip: WatchSlip, tray: WatchTray): boolean {
  if (tray === "done") return slip.done;
  if (tray === "armed") return slip.armed && !slip.done;
  return !slip.armed && !slip.done;
}

function minuteHit(minute: number, exact: number | null, band: MinutePick | null): boolean {
  if (exact !== null) return minute === exact;
  if (band === null) return true;
  if (band === "d1" || band === "d2" || band === "d3" || band === "d4" || band === "d5" || band === "d6") return minuteDecade(minute) === band;
  return minuteBand(minute) === band;
}

/** Search stays on the note. The owner, the minute, the tone, and the tag are not part of the query. */
export function visibleWatches(
  slips: readonly WatchSlip[],
  tray: WatchTray,
  query: string,
  owner: string | null,
  tone: Tone | null,
  tag: string | null,
  exact: number | null,
  band: MinutePick | null,
  topOnly: boolean,
  passedOnly: boolean,
  desk: unknown,
): WatchSlip[] {
  const text = query.trim().toLowerCase();
  const wantOwner = owner === null ? null : ownerLabel(owner);
  const wantTag = tag === null ? null : watchTag(tag);
  return readWatches(slips)
    .filter((slip) => {
      if (!inTray(slip, tray)) return false;
      if (topOnly && slip.rank !== 2) return false;
      if (wantOwner !== null && ownerLabel(slip.owner) !== wantOwner) return false;
      if (tone !== null && toneOf(slip.tone) !== tone) return false;
      if (wantTag !== null && watchTag(slip.tag) !== wantTag) return false;
      if (!minuteHit(slip.minute, exact, band)) return false;
      if (passedOnly) {
        const gap = minuteGap(slip.minute, desk);
        if (gap === null || gap <= 0 || !inTray(slip, "open")) return false;
      }
      return !text || slip.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return b.rank - a.rank;
      return a.text.localeCompare(b.text);
    });
}

/** The minute orders the desk. A blank minute stays at the end. Search stays on the note. */
export function watchTimeline(slips: readonly WatchSlip[], query: string): WatchSlip[] {
  const text = query.trim().toLowerCase();
  return readWatches(slips)
    .filter((slip) => !text || slip.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (!a.minute && b.minute) return 1;
      if (a.minute && !b.minute) return -1;
      if (a.minute !== b.minute) return a.minute - b.minute;
      return a.text.localeCompare(b.text);
    });
}

export function watchCounts(slips: readonly WatchSlip[], desk: unknown): WatchCounts {
  const rows = readWatches(slips);
  return {
    open: rows.filter((slip) => inTray(slip, "open")).length,
    armed: rows.filter((slip) => inTray(slip, "armed")).length,
    done: rows.filter((slip) => inTray(slip, "done")).length,
    hush: rows.filter((slip) => slip.hush).length,
    passed: rows.filter((slip) => {
      const gap = minuteGap(slip.minute, desk);
      return gap !== null && gap > 0 && inTray(slip, "open");
    }).length,
  };
}

/** Share of the saved slips. A zero total stays at zero. */
export function watchShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function watchOwners(slips: readonly WatchSlip[]): string[] {
  const out: string[] = [];
  for (const slip of readWatches(slips)) {
    if (slip.owner && !out.includes(slip.owner)) out.push(slip.owner);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function watchTags(slips: readonly WatchSlip[]): string[] {
  const out: string[] = [];
  for (const slip of readWatches(slips)) {
    if (slip.tag && !out.includes(slip.tag)) out.push(slip.tag);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function watchTones(slips: readonly WatchSlip[]): Exclude<Tone, "blank">[] {
  const seen = new Set<string>();
  for (const slip of readWatches(slips)) if (slip.tone) seen.add(slip.tone);
  return TONES.filter((tone) => seen.has(tone));
}

/** Six bands. The count is the slips whose minute falls in that band of ten. */
export function minuteCounts(slips: readonly WatchSlip[]): number[] {
  const rows = readWatches(slips);
  return DECADES.map((decade) => rows.filter((slip) => minuteDecade(slip.minute) === decade).length);
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

/** "all" and "blank" stay. A tone that is no longer on a slip falls back to all. */
export function activeTone(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tone = toneName(filter);
  return tone && tones.includes(tone) ? tone : "all";
}

export function toneArg(filter: string): Tone | null {
  if (filter === "blank") return "blank";
  return toneName(filter) || null;
}

/** "all" and "blank" stay. A tag that is no longer on a slip falls back to all. */
export function activeWatchTag(filter: string, tags: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tag = watchTag(filter);
  return tag && tags.includes(tag) ? tag : "all";
}

export function watchTagArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return watchTag(filter);
}

/** All, blank, brief, steady, long, the six bands, and minutes 1 through 60 stay. Anything else is all. */
export function activeMinute(filter: string): string {
  if (filter === "blank" || filter === "brief" || filter === "steady" || filter === "long") return filter;
  if ((DECADES as readonly string[]).includes(filter)) return filter;
  const minute = minuteCount(filter);
  return minute ? String(minute) : "all";
}

export function minuteArg(filter: string): { exact: number | null; band: MinutePick | null } {
  if (filter === "blank" || filter === "brief" || filter === "steady" || filter === "long" || (DECADES as readonly string[]).includes(filter)) {
    return { exact: null, band: filter as MinutePick };
  }
  const minute = minuteCount(filter);
  return minute ? { exact: minute, band: null } : { exact: null, band: null };
}

/** Other slips with the same owner and the same minute. A blank owner or a zero minute clashes with nothing. */
export function watchClashIds(slips: readonly WatchSlip[], id: string): string[] {
  const rows = readWatches(slips);
  const slip = rows.find((item) => item.id === id);
  if (!slip || !slip.owner || slip.minute <= 0) return [];
  return rows
    .filter((item) => item.id !== id && item.owner === slip.owner && item.minute === slip.minute)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open slip at or after the minute. After the last minute, the desk wraps to the earliest open minute. */
export function nextWatch(slips: readonly WatchSlip[], minute: unknown): string {
  const now = minuteCount(minute);
  if (!now) return "";
  const open = readWatches(slips).filter((slip) => inTray(slip, "open") && slip.minute > 0);
  if (!open.length) return "";
  const byMinute = (a: WatchSlip, b: WatchSlip) => a.minute - b.minute || a.text.localeCompare(b.text);
  const later = open.filter((slip) => slip.minute >= now).sort(byMinute);
  if (later.length) return later[0].id;
  return open.slice().sort(byMinute)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap uses the minute you pass. */
export function watchesCsv(raw: unknown, desk: unknown): string {
  const lines = ["text,owner,minute,tone,tag,band,rank,armed,done,hush,gap,audit"];
  for (const slip of readWatches(raw)) {
    const gap = minuteGap(slip.minute, desk);
    lines.push([
      csvCell(slip.text),
      csvCell(slip.owner),
      String(slip.minute),
      slip.tone,
      csvCell(slip.tag),
      minuteBand(slip.minute),
      String(slip.rank),
      slip.armed ? "1" : "0",
      slip.done ? "1" : "0",
      slip.hush ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(slip.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function ownerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ownerLabel(raw) || "all";
}

function toneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return toneName(raw) || "all";
}

function tagSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return watchTag(raw) || "all";
}

function minuteSlot(raw: unknown): string {
  return activeMinute(String(raw ?? ""));
}

export function readWatchViews(raw: unknown): WatchView[] {
  if (!Array.isArray(raw)) return [];
  const out: WatchView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WatchView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      owner: ownerSlot(row.owner),
      tone: toneSlot(row.tone),
      tag: tagSlot(row.tag),
      minute: minuteSlot(row.minute),
    });
  }
  return out.slice(0, 12);
}

export function addWatchView(
  views: readonly WatchView[],
  view: { id: string; name: string; tray: WatchTray; query: string; owner: string; tone: string; tag: string; minute: string },
): WatchView[] {
  const current = readWatchViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    owner: ownerSlot(view.owner),
    tone: toneSlot(view.tone),
    tag: tagSlot(view.tag),
    minute: minuteSlot(view.minute),
  }].slice(0, 12);
}

export function dropWatchView(views: readonly WatchView[], id: string): WatchView[] {
  return readWatchViews(views).filter((view) => view.id !== id);
}

/**
 * The last operating system string. A last browser, a device, a last city, a last region,
 * a last country, an address, a language, a country, a registration country, a timezone,
 * a desk name, a desk id, a campaign, a phone, a trading server, a trading group,
 * a broker name, an assignee, a sale status, a retention status, a potential status,
 * a KYC status, an account type, a role, a validation status, a referral code,
 * or a profile city is not an operating system.
 */
export function osText(value: OsValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim().slice(0, 64);
  if (!value || typeof value !== "object") return "";
  if (OS_BLOCK.some((key) => key in value)) return "";
  return typeof value.lastOs === "string" ? value.lastOs.replace(/\s+/g, " ").trim().slice(0, 64) : "";
}

/** Windows, macOS, iOS, Android, Linux, ChromeOS, other, or blank. iOS is read before macOS. ChromeOS is read before Linux. */
export function osFamilyOf(value: OsValue): OsFamily {
  const text = osText(value).toLowerCase();
  if (!text) return "";
  if (text.includes("ios") || text.includes("iphone") || text.includes("ipad")) return "ios";
  if (text.includes("android")) return "android";
  if (text.includes("chrome os") || text.includes("chromeos") || text.includes("cros")) return "chromeos";
  if (text.includes("windows") || text.includes("win32") || text.includes("win64")) return "windows";
  if (text.includes("mac os") || text.includes("macos") || text.includes("os x") || text.includes("macintosh") || text.includes("macbook") || /\bmac\b/.test(text)) return "macos";
  if (text.includes("linux") || text.includes("ubuntu") || text.includes("debian")) return "linux";
  return "other";
}

/** The first A to Z letter. Any other operating system uses a mark. A missing operating system stays blank. */
export function osInitialOf(value: OsValue): string {
  const os = osText(value);
  if (!os) return "";
  const first = os[0].toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}

export function osInitialLabel(raw: unknown): string {
  const text = clip(raw, 1).toUpperCase();
  if (text === "#") return "#";
  return /^[A-Z]$/.test(text) ? text : "";
}

export function osLines(rows: readonly OsRow[]): OsLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const os = osText(row.lastOs);
    map.set(os, (map.get(os) || 0) + 1);
  }
  const out: OsLine[] = [];
  map.forEach((count, os) => out.push({ os, family: osFamilyOf(os), initial: osInitialOf(os), count }));
  return out.sort((a, b) => {
    if (!a.os) return -1;
    if (!b.os) return 1;
    return a.os.localeCompare(b.os);
  });
}

export function namedSystems(rows: readonly OsRow[]): string[] {
  return osLines(rows).map((line) => line.os).filter(Boolean);
}

export function osFamilyLines(rows: readonly OsRow[]): OsFamilyLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const family = osFamilyOf(row.lastOs);
    map.set(family, (map.get(family) || 0) + 1);
  }
  const out: OsFamilyLine[] = [];
  for (const family of FAMILIES) {
    const count = map.get(family);
    if (count) out.push({ family, count });
  }
  return out;
}

export function namedOsFamilies(rows: readonly OsRow[]): string[] {
  return osFamilyLines(rows).map((line) => line.family).filter(Boolean);
}

export function osInitialLines(rows: readonly OsRow[]): OsInitialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const initial = osInitialOf(row.lastOs);
    map.set(initial, (map.get(initial) || 0) + 1);
  }
  const out: OsInitialLine[] = [];
  map.forEach((count, initial) => out.push({ initial, count }));
  return out.sort((a, b) => {
    if (!a.initial && b.initial) return -1;
    if (a.initial && !b.initial) return 1;
    if (a.initial === "#" && b.initial !== "#") return 1;
    if (b.initial === "#" && a.initial !== "#") return -1;
    return a.initial.localeCompare(b.initial);
  });
}

export function namedOsInitials(rows: readonly OsRow[]): string[] {
  return osInitialLines(rows).map((line) => line.initial).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function osShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named operating system with the most loaded rows. A tie keeps the earlier name. */
export function leadingOs(rows: readonly OsRow[]): string {
  const named = osLines(rows).filter((line) => line.os);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.os.localeCompare(b.os))[0].os;
}

/** The named family with the most loaded rows. A tie keeps the earlier name. A blank family is not a lead. */
export function leadingOsFamily(rows: readonly OsRow[]): string {
  const named = osFamilyLines(rows).filter((line) => line.family);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.family.localeCompare(b.family))[0].family;
}

/** The named initial with the most loaded rows. A tie keeps the earlier letter. A blank initial is not a lead. */
export function leadingOsInitial(rows: readonly OsRow[]): string {
  const named = osInitialLines(rows).filter((line) => line.initial);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.initial.localeCompare(b.initial))[0].initial;
}

export function readHiddenSystems(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => osText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const os = osText(String(item || ""));
    if (!os || !allow.has(os) || out.includes(os)) continue;
    out.push(os);
  }
  return out;
}

export function toggleSystem(hidden: readonly string[], os: string, present: readonly string[]): string[] {
  const current = readHiddenSystems(hidden, present);
  const next = osText(os);
  if (!next || !present.map((item) => osText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleSystems(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSystems(hidden, present));
  return namedSystems(present.map((lastOs) => ({ lastOs }))).filter((os) => (showHidden ? gone.has(os) : !gone.has(os)));
}

export function activeSystem(selected: string, visible: readonly string[]): string {
  const os = osText(selected);
  if (!os) return "";
  return visible.some((item) => osText(item) === os) ? os : "";
}

/** "all" and "blank" stay. A family that is no longer loaded falls back to all. */
export function activeOsFamily(filter: string, families: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return families.includes(filter) ? filter : "all";
}

export function osFamilyArg(filter: string): OsFamily | null {
  if (filter === "blank") return "";
  if (filter === "windows" || filter === "macos" || filter === "ios" || filter === "android" || filter === "linux" || filter === "chromeos" || filter === "other") return filter;
  return null;
}

/** "all" and "blank" stay. An initial that is no longer loaded falls back to all. */
export function activeOsInitial(filter: string, initials: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const initial = filter === "#" ? "#" : osInitialLabel(filter);
  return initial && initials.includes(initial) ? initial : "all";
}

export function osInitialArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  if (filter === "#") return "#";
  return osInitialLabel(filter) || null;
}

/** Search stays on the name. The operating system is not part of the query. */
export function visibleOsCustomers<T extends OsRow>(
  rows: readonly T[],
  os: string,
  blank: boolean,
  family: OsFamily | null,
  initial: string | null,
  query: string,
): T[] {
  const want = osText(os);
  const wantInitial = initial === null ? null : initial === "#" ? "#" : osInitialLabel(initial);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = osText(row.lastOs);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (family !== null && osFamilyOf(got) !== family) return false;
    if (wantInitial !== null && osInitialOf(got) !== wantInitial) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the operating systems, families, initials, and counts on this page. */
export function systemsCsv(rows: readonly OsRow[]): string {
  const lines = ["os,family,initial,count"];
  for (const line of osLines(rows)) lines.push([csvCell(line.os), csvCell(line.family), csvCell(line.initial), String(line.count)].join(","));
  return lines.join("\n");
}
