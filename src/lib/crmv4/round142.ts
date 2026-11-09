/** Local cue cards, and customer counts grouped by the last region already on each row. */

export const CUE_KEY = "crmv4-cue-cards";
export const CUE_VIEW_KEY = "crmv4-cue-views";
export const REGION_KEY = "crmv4-region-hide";

export type CueTone = "blank" | "quiet" | "warm" | "sharp";

export type CueWing = "blank" | "north" | "south" | "east" | "west";

export type CueTray = "open" | "held" | "done";

export type MinutePick = "blank" | "early" | "middle" | "late" | "q1" | "q2" | "q3" | "q4";

export type CueCard = {
  id: string;
  text: string;
  owner: string;
  minute: number | null;
  wing: string;
  mark: string;
  tone: string;
  pinned: boolean;
  done: boolean;
  held: boolean;
  audit: string;
};

export type CueView = {
  id: string;
  name: string;
  tray: CueTray;
  query: string;
  owner: string;
  wing: string;
  mark: string;
  tone: string;
  minute: string;
};

export type CueCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  late: number;
};

export type RegionValue =
  | {
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

export type RegionRow = { region?: RegionValue; label?: string | null };

export type RegionLine = { region: string; compass: string; span: string; initial: string; count: number };

export type CompassLine = { compass: string; count: number };

export type SpanLine = { span: string; count: number };

export type RegionInitialLine = { initial: string; count: number };

export type Compass = "" | "north" | "south" | "east" | "west" | "central" | "other";

export type RegionSpan = "" | "short" | "mid" | "long";

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "done", "reopen"] as const;

const WINGS = ["north", "south", "east", "west"] as const;

const TONES = ["quiet", "warm", "sharp"] as const;

const TONE_ORDER = ["", "quiet", "warm", "sharp"] as const;

const QUARTERS = ["q1", "q2", "q3", "q4"] as const;

const COMPASSES = ["", "north", "south", "east", "west", "central", "other"] as const;

const SPANS = ["", "short", "mid", "long"] as const;

const REGION_BLOCK = [
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

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CueTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function wingName(raw: unknown): Exclude<CueWing, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WINGS as readonly string[]).includes(text) ? (text as Exclude<CueWing, "blank">) : "";
}

function toneName(raw: unknown): Exclude<CueTone, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<CueTone, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function cueText(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank owner stays blank. It is not filled in. */
export function ownerLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank mark stays blank. It is not filled in. */
export function markTag(raw: unknown): string {
  return clip(raw, 10);
}

/**
 * A minute is 0 through 59. Zero is a minute. A blank value stays unset.
 * A leading zero other than 0 itself is unset.
 */
export function minuteCount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 59) return raw;
  if (typeof raw === "string" && /^(?:0|[1-9]|[1-5]\d)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** North, south, east, west, or blank. Anything else is blank. */
export function wingOf(raw: unknown): CueWing {
  return wingName(raw) || "blank";
}

/** Quiet, warm, sharp, or blank. Anything else is blank. */
export function toneOf(raw: unknown): CueTone {
  return toneName(raw) || "blank";
}

/** Early is 0 through 19. Middle is 20 through 39. Late is 40 through 59. An unset minute is blank. */
export function minuteBand(minute: unknown): "blank" | "early" | "middle" | "late" {
  const count = minuteCount(minute);
  if (count === null) return "blank";
  if (count <= 19) return "early";
  if (count <= 39) return "middle";
  return "late";
}

/** Four quarters of the hour. An unset minute is blank. */
export function minuteQuarter(minute: unknown): "blank" | "q1" | "q2" | "q3" | "q4" {
  const count = minuteCount(minute);
  if (count === null) return "blank";
  return QUARTERS[Math.min(3, Math.floor(count / 15))];
}

/** Minutes from the card minute to the desk minute. A negative gap is still ahead. An unset minute stays empty. */
export function minuteGap(minute: unknown, desk: unknown): number | null {
  const from = minuteCount(minute);
  const at = minuteCount(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readCues(raw: unknown): CueCard[] {
  if (!Array.isArray(raw)) return [];
  const out: CueCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CueCard>;
    const id = String(row.id || "").trim();
    const text = cueText(row.text);
    if (!id || !text || out.some((cue) => cue.id === id)) continue;
    out.push({
      id,
      text,
      owner: ownerLabel(row.owner),
      minute: minuteCount(row.minute),
      wing: wingName(row.wing),
      mark: markTag(row.mark),
      tone: toneName(row.tone),
      pinned: row.pinned === true,
      done: row.done === true,
      held: row.held === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 36);
}

export function addCue(
  cues: readonly CueCard[],
  cue: { id: string; text: string; owner?: string; minute?: unknown; wing?: string; mark?: string; tone?: string },
): CueCard[] {
  const current = readCues(cues);
  const id = String(cue.id || "").trim();
  const text = cueText(cue.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: CueCard = {
    id,
    text,
    owner: ownerLabel(cue.owner),
    minute: minuteCount(cue.minute),
    wing: wingName(cue.wing),
    mark: markTag(cue.mark),
    tone: toneName(cue.tone),
    pinned: false,
    done: false,
    held: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 36);
}

export function stepCueTone(cues: readonly CueCard[], id: string, dir: 1 | -1): CueCard[] {
  return readCues(cues).map((cue) => {
    if (cue.id !== id) return cue;
    const at = TONE_ORDER.indexOf(cue.tone as (typeof TONE_ORDER)[number]);
    const next = TONE_ORDER[Math.min(TONES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === cue.tone) return cue;
    return { ...cue, tone: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setCuePinned(cues: readonly CueCard[], id: string, pinned: boolean): CueCard[] {
  return readCues(cues).map((cue) => (cue.id === id ? { ...cue, pinned, audit: pinned ? "pin" : "unpin" } : cue));
}

export function setCueHeld(cues: readonly CueCard[], id: string, held: boolean): CueCard[] {
  return readCues(cues).map((cue) => (cue.id === id ? { ...cue, held, audit: held ? "hold" : "release" } : cue));
}

export function setCueDone(cues: readonly CueCard[], id: string, done: boolean): CueCard[] {
  return readCues(cues).map((cue) => (cue.id === id ? { ...cue, done, audit: done ? "done" : "reopen" } : cue));
}

/** A blank edit is left out. A duplicate of another card is left out. */
export function editCue(cues: readonly CueCard[], id: string, text: string): CueCard[] {
  const current = readCues(cues);
  const next = cueText(text);
  if (!next || current.some((cue) => cue.id !== id && cue.text === next)) return current;
  return current.map((cue) => (cue.id === id && cue.text !== next ? { ...cue, text: next, audit: "edit" } : cue));
}

export function bulkCuePinned(cues: readonly CueCard[], ids: readonly string[], pinned: boolean): CueCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readCues(cues).map((cue) => (want.has(cue.id) ? { ...cue, pinned, audit: pinned ? "pin" : "unpin" } : cue));
}

export function bulkCueDone(cues: readonly CueCard[], ids: readonly string[], done: boolean): CueCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readCues(cues).map((cue) => (want.has(cue.id) ? { ...cue, done, audit: done ? "done" : "reopen" } : cue));
}

export function resetCues(): CueCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function cueCopy(raw: unknown): string {
  return cueText(raw);
}

function inTray(cue: CueCard, tray: CueTray): boolean {
  if (tray === "done") return cue.done;
  if (tray === "held") return cue.held && !cue.done;
  return !cue.held && !cue.done;
}

function minuteHit(minute: number | null, exact: number | null, band: MinutePick | null): boolean {
  if (exact !== null) return minute === exact;
  if (band === null) return true;
  if (band === "q1" || band === "q2" || band === "q3" || band === "q4") return minuteQuarter(minute) === band;
  return minuteBand(minute) === band;
}

function toneWeight(tone: string): number {
  if (tone === "sharp") return 3;
  if (tone === "warm") return 2;
  if (tone === "quiet") return 1;
  return 0;
}

/** Search stays on the note. The owner, the minute, the wing, the mark, and the tone are not part of the query. */
export function visibleCues(
  cues: readonly CueCard[],
  tray: CueTray,
  query: string,
  owner: string | null,
  wing: CueWing | null,
  mark: string | null,
  tone: CueTone | null,
  exact: number | null,
  band: MinutePick | null,
  sharpOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): CueCard[] {
  const text = query.trim().toLowerCase();
  const wantOwner = owner === null ? null : ownerLabel(owner);
  const wantMark = mark === null ? null : markTag(mark);
  return readCues(cues)
    .filter((cue) => {
      if (!inTray(cue, tray)) return false;
      if (sharpOnly && cue.tone !== "sharp") return false;
      if (wantOwner !== null && ownerLabel(cue.owner) !== wantOwner) return false;
      if (wing !== null && wingOf(cue.wing) !== wing) return false;
      if (wantMark !== null && markTag(cue.mark) !== wantMark) return false;
      if (tone !== null && toneOf(cue.tone) !== tone) return false;
      if (!minuteHit(cue.minute, exact, band)) return false;
      if (lateOnly) {
        const gap = minuteGap(cue.minute, desk);
        if (gap === null || gap <= 0 || !inTray(cue, "open")) return false;
      }
      return !text || cue.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (toneWeight(a.tone) !== toneWeight(b.tone)) return toneWeight(b.tone) - toneWeight(a.tone);
      return a.text.localeCompare(b.text);
    });
}

/** The minute orders the desk. An unset minute stays at the end. Search stays on the note. */
export function cueTimeline(cues: readonly CueCard[], query: string): CueCard[] {
  const text = query.trim().toLowerCase();
  return readCues(cues)
    .filter((cue) => !text || cue.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.minute === null && b.minute !== null) return 1;
      if (a.minute !== null && b.minute === null) return -1;
      if (a.minute !== null && b.minute !== null && a.minute !== b.minute) return a.minute - b.minute;
      return a.text.localeCompare(b.text);
    });
}

export function cueCounts(cues: readonly CueCard[], desk: unknown): CueCounts {
  const rows = readCues(cues);
  return {
    open: rows.filter((cue) => inTray(cue, "open")).length,
    held: rows.filter((cue) => inTray(cue, "held")).length,
    done: rows.filter((cue) => inTray(cue, "done")).length,
    pinned: rows.filter((cue) => cue.pinned).length,
    late: rows.filter((cue) => {
      const gap = minuteGap(cue.minute, desk);
      return gap !== null && gap > 0 && inTray(cue, "open");
    }).length,
  };
}

/** Share of the saved cards. A zero total stays at zero. */
export function cueShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function cueOwners(cues: readonly CueCard[]): string[] {
  const out: string[] = [];
  for (const cue of readCues(cues)) {
    if (cue.owner && !out.includes(cue.owner)) out.push(cue.owner);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function cueMarks(cues: readonly CueCard[]): string[] {
  const out: string[] = [];
  for (const cue of readCues(cues)) {
    if (cue.mark && !out.includes(cue.mark)) out.push(cue.mark);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function cueWings(cues: readonly CueCard[]): Exclude<CueWing, "blank">[] {
  const seen = new Set<string>();
  for (const cue of readCues(cues)) if (cue.wing) seen.add(cue.wing);
  return WINGS.filter((wing) => seen.has(wing));
}

export function cueTones(cues: readonly CueCard[]): Exclude<CueTone, "blank">[] {
  const seen = new Set<string>();
  for (const cue of readCues(cues)) if (cue.tone) seen.add(cue.tone);
  return TONES.filter((tone) => seen.has(tone));
}

/** Four quarters. The count is the cards whose minute falls in that quarter. */
export function quarterCounts(cues: readonly CueCard[]): number[] {
  const rows = readCues(cues);
  return QUARTERS.map((quarter) => rows.filter((cue) => minuteQuarter(cue.minute) === quarter).length);
}

/** "all" and "blank" stay. An owner that is no longer on a card falls back to all. */
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

/** "all" and "blank" stay. A wing that is no longer on a card falls back to all. */
export function activeWing(filter: string, wings: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const wing = wingName(filter);
  return wing && wings.includes(wing) ? wing : "all";
}

export function wingArg(filter: string): CueWing | null {
  if (filter === "blank") return "blank";
  return wingName(filter) || null;
}

/** "all" and "blank" stay. A mark that is no longer on a card falls back to all. */
export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = markTag(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return markTag(filter);
}

/** "all" and "blank" stay. A tone that is no longer on a card falls back to all. */
export function activeTone(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tone = toneName(filter);
  return tone && tones.includes(tone) ? tone : "all";
}

export function toneArg(filter: string): CueTone | null {
  if (filter === "blank") return "blank";
  return toneName(filter) || null;
}

/** All, blank, early, middle, late, the four quarters, and minutes 0 through 59 stay. Anything else is all. */
export function activeMinute(filter: string): string {
  if (filter === "blank" || filter === "early" || filter === "middle" || filter === "late") return filter;
  if ((QUARTERS as readonly string[]).includes(filter)) return filter;
  const minute = minuteCount(filter);
  return minute === null ? "all" : String(minute);
}

export function minuteArg(filter: string): { exact: number | null; band: MinutePick | null } {
  if (
    filter === "blank" ||
    filter === "early" ||
    filter === "middle" ||
    filter === "late" ||
    (QUARTERS as readonly string[]).includes(filter)
  ) {
    return { exact: null, band: filter as MinutePick };
  }
  const minute = minuteCount(filter);
  return minute === null ? { exact: null, band: null } : { exact: minute, band: null };
}

/** Other cards with the same wing and the same minute. A blank wing or an unset minute clashes with nothing. */
export function cueClashIds(cues: readonly CueCard[], id: string): string[] {
  const rows = readCues(cues);
  const cue = rows.find((item) => item.id === id);
  if (!cue || !cue.wing || cue.minute === null) return [];
  return rows
    .filter((item) => item.id !== id && item.wing === cue.wing && item.minute === cue.minute)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open card at or after the minute. After the last minute, the desk wraps to the earliest open minute. */
export function nextCue(cues: readonly CueCard[], minute: unknown): string {
  const now = minuteCount(minute);
  if (now === null) return "";
  const waiting = readCues(cues).filter((cue) => inTray(cue, "open") && cue.minute !== null);
  if (!waiting.length) return "";
  const byMinute = (a: CueCard, b: CueCard) => (a.minute ?? 0) - (b.minute ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((cue) => (cue.minute ?? 0) >= now).sort(byMinute);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byMinute)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The gap uses the minute you pass. */
export function cuesCsv(raw: unknown, desk: unknown): string {
  const lines = ["text,owner,minute,wing,mark,tone,band,pinned,done,held,gap,audit"];
  for (const cue of readCues(raw)) {
    const gap = minuteGap(cue.minute, desk);
    lines.push([
      csvCell(cue.text),
      csvCell(cue.owner),
      cue.minute === null ? "" : String(cue.minute),
      cue.wing,
      csvCell(cue.mark),
      cue.tone,
      minuteBand(cue.minute),
      cue.pinned ? "1" : "0",
      cue.done ? "1" : "0",
      cue.held ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(cue.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function ownerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ownerLabel(raw) || "all";
}

function wingSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return wingName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return markTag(raw) || "all";
}

function toneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return toneName(raw) || "all";
}

export function readCueViews(raw: unknown): CueView[] {
  if (!Array.isArray(raw)) return [];
  const out: CueView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CueView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 72),
      owner: ownerSlot(row.owner),
      wing: wingSlot(row.wing),
      mark: markSlot(row.mark),
      tone: toneSlot(row.tone),
      minute: activeMinute(String(row.minute ?? "")),
    });
  }
  return out.slice(0, 12);
}

export function addCueView(
  views: readonly CueView[],
  view: { id: string; name: string; tray: CueTray; query: string; owner: string; wing: string; mark: string; tone: string; minute: string },
): CueView[] {
  const current = readCueViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 72),
    owner: ownerSlot(view.owner),
    wing: wingSlot(view.wing),
    mark: markSlot(view.mark),
    tone: toneSlot(view.tone),
    minute: activeMinute(view.minute),
  }].slice(0, 12);
}

export function dropCueView(views: readonly CueView[], id: string): CueView[] {
  return readCueViews(views).filter((view) => view.id !== id);
}

/**
 * The last region already on the trader row. An address, a last device, a last operating system,
 * a last browser, a last city, a last country, a language, a country, a registration country,
 * a timezone, a desk name, a desk id, a campaign, a phone, a trading server, a trading group,
 * a broker name, an assignee, a sale status, a retention status, a potential status,
 * a KYC status, an account type, a role, a validation status, a referral code,
 * or a profile city is not a region.
 */
export function regionText(value: RegionValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim().slice(0, 48);
  if (!value || typeof value !== "object") return "";
  if (REGION_BLOCK.some((key) => key in value)) return "";
  return typeof value.lastRegion === "string" ? value.lastRegion.replace(/\s+/g, " ").trim().slice(0, 48) : "";
}

/** North, south, east, west, central, other, or blank. North is read before south, and west before central. */
export function compassOf(value: RegionValue): Compass {
  const text = regionText(value);
  if (!text) return "";
  if (/\bnorth\b/i.test(text)) return "north";
  if (/\bsouth\b/i.test(text)) return "south";
  if (/\beast\b/i.test(text)) return "east";
  if (/\bwest\b/i.test(text)) return "west";
  if (/\bcentral\b/i.test(text)) return "central";
  return "other";
}

/** Short is 1 through 8 characters. Mid is 9 through 16. A longer name is long. A missing region stays blank. */
export function spanOf(value: RegionValue): RegionSpan {
  const text = regionText(value);
  if (!text) return "";
  if (text.length <= 8) return "short";
  if (text.length <= 16) return "mid";
  return "long";
}

/** The first A to Z letter. Any other region uses a mark. A missing region stays blank. */
export function regionInitialOf(value: RegionValue): string {
  const region = regionText(value);
  if (!region) return "";
  const first = region[0].toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}

export function regionInitialLabel(raw: unknown): string {
  const text = clip(raw, 1).toUpperCase();
  if (text === "#") return "#";
  return /^[A-Z]$/.test(text) ? text : "";
}

export function regionLines(rows: readonly RegionRow[]): RegionLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const region = regionText(row.region);
    map.set(region, (map.get(region) || 0) + 1);
  }
  const out: RegionLine[] = [];
  map.forEach((count, region) => out.push({ region, compass: compassOf(region), span: spanOf(region), initial: regionInitialOf(region), count }));
  return out.sort((a, b) => {
    if (!a.region) return -1;
    if (!b.region) return 1;
    return a.region.localeCompare(b.region);
  });
}

export function namedRegions(rows: readonly RegionRow[]): string[] {
  return regionLines(rows).map((line) => line.region).filter(Boolean);
}

export function compassLines(rows: readonly RegionRow[]): CompassLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const compass = compassOf(row.region);
    map.set(compass, (map.get(compass) || 0) + 1);
  }
  const out: CompassLine[] = [];
  for (const compass of COMPASSES) {
    const count = map.get(compass);
    if (count) out.push({ compass, count });
  }
  return out;
}

export function namedCompasses(rows: readonly RegionRow[]): string[] {
  return compassLines(rows).map((line) => line.compass).filter(Boolean);
}

export function spanLines(rows: readonly RegionRow[]): SpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = spanOf(row.region);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: SpanLine[] = [];
  for (const span of SPANS) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly RegionRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

export function regionInitialLines(rows: readonly RegionRow[]): RegionInitialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const initial = regionInitialOf(row.region);
    map.set(initial, (map.get(initial) || 0) + 1);
  }
  const out: RegionInitialLine[] = [];
  map.forEach((count, initial) => out.push({ initial, count }));
  return out.sort((a, b) => {
    if (!a.initial && b.initial) return -1;
    if (a.initial && !b.initial) return 1;
    if (a.initial === "#" && b.initial !== "#") return 1;
    if (b.initial === "#" && a.initial !== "#") return -1;
    return a.initial.localeCompare(b.initial);
  });
}

export function namedRegionInitials(rows: readonly RegionRow[]): string[] {
  return regionInitialLines(rows).map((line) => line.initial).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function regionShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named region with the most loaded rows. A tie keeps the earlier name. */
export function leadingRegion(rows: readonly RegionRow[]): string {
  const named = regionLines(rows).filter((line) => line.region);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.region.localeCompare(b.region))[0].region;
}

/** The named compass with the most loaded rows. A tie keeps the earlier name. A blank compass is not a lead. */
export function leadingCompass(rows: readonly RegionRow[]): string {
  const named = compassLines(rows).filter((line) => line.compass);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.compass.localeCompare(b.compass))[0].compass;
}

/** The named span with the most loaded rows. A tie keeps the earlier name. A blank span is not a lead. */
export function leadingSpan(rows: readonly RegionRow[]): string {
  const named = spanLines(rows).filter((line) => line.span);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.span.localeCompare(b.span))[0].span;
}

/** The named initial with the most loaded rows. A tie keeps the earlier letter. A blank initial is not a lead. */
export function leadingRegionInitial(rows: readonly RegionRow[]): string {
  const named = regionInitialLines(rows).filter((line) => line.initial);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.initial.localeCompare(b.initial))[0].initial;
}

export function readHiddenRegions(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => regionText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const region = regionText(String(item || ""));
    if (!region || !allow.has(region) || out.includes(region)) continue;
    out.push(region);
  }
  return out;
}

export function toggleRegion(hidden: readonly string[], region: string, present: readonly string[]): string[] {
  const current = readHiddenRegions(hidden, present);
  const next = regionText(region);
  if (!next || !present.map((item) => regionText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleRegions(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenRegions(hidden, present));
  return namedRegions(present.map((region) => ({ region }))).filter((region) => (showHidden ? gone.has(region) : !gone.has(region)));
}

export function activeRegion(selected: string, visible: readonly string[]): string {
  const region = regionText(selected);
  if (!region) return "";
  return visible.some((item) => regionText(item) === region) ? region : "";
}

/** "all" and "blank" stay. A compass that is no longer loaded falls back to all. */
export function activeCompass(filter: string, compasses: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return compasses.includes(filter) ? filter : "all";
}

export function compassArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "north" || filter === "south" || filter === "east" || filter === "west" || filter === "central" || filter === "other") return filter;
  return null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "short" || filter === "mid" || filter === "long") return filter;
  return null;
}

/** "all" and "blank" stay. An initial that is no longer loaded falls back to all. */
export function activeRegionInitial(filter: string, initials: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const initial = filter === "#" ? "#" : regionInitialLabel(filter);
  return initial && initials.includes(initial) ? initial : "all";
}

export function regionInitialArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const initial = filter === "#" ? "#" : regionInitialLabel(filter);
  return initial || null;
}

/** Search stays on the name. The region is not part of the query. */
export function visibleRegionCustomers<T extends RegionRow>(
  rows: readonly T[],
  region: string,
  blank: boolean,
  compass: string | null,
  span: string | null,
  initial: string | null,
  query: string,
): T[] {
  const want = regionText(region);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = regionText(row.region);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (compass !== null && compassOf(row.region) !== compass) return false;
    if (span !== null && spanOf(row.region) !== span) return false;
    if (initial !== null && regionInitialOf(row.region) !== initial) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the regions, compasses, spans, initials, and counts on this page. */
export function regionsCsv(rows: readonly RegionRow[]): string {
  const lines = ["region,compass,span,initial,count"];
  for (const line of regionLines(rows)) {
    lines.push([csvCell(line.region), line.compass, line.span, line.initial, String(line.count)].join(","));
  }
  return lines.join("\n");
}
