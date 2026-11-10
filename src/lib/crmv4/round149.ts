/** Local SLA promises, and calling regions already on each loaded phone. */

export const PROMISE_KEY = "crmv4-sla-promises";
export const PROMISE_VIEW_KEY = "crmv4-sla-views";
export const CALLING_KEY = "crmv4-calling-hide";

export type PromisePace = "blank" | "calm" | "due" | "hot";

export type PromiseChannel = "blank" | "phone" | "mail" | "chat" | "visit";

export type PromiseTray = "open" | "waiting" | "closed";

export type AllowancePick = "blank" | "short" | "mid" | "long" | "first" | "second";

export type PromiseCard = {
  id: string;
  text: string;
  owner: string;
  minutes: number | null;
  channel: string;
  tag: string;
  pace: string;
  starred: boolean;
  closed: boolean;
  waiting: boolean;
  audit: string;
};

export type PromiseView = {
  id: string;
  name: string;
  tray: PromiseTray;
  query: string;
  owner: string;
  channel: string;
  tag: string;
  pace: string;
  minutes: string;
};

export type PromiseCounts = {
  open: number;
  waiting: number;
  closed: number;
  starred: number;
  late: number;
};

export type DialRegion = "" | "tr" | "us" | "uk" | "de" | "ru" | "ae" | "other" | "local";

export type CallingValue =
  | {
      phone?: unknown;
      email?: unknown;
      country?: unknown;
      registrationCountry?: unknown;
      address?: unknown;
      timezone?: unknown;
      city?: unknown;
      lastCountry?: unknown;
      lastCountryName?: unknown;
      lastCity?: unknown;
      lastRegion?: unknown;
      language?: unknown;
      name?: unknown;
      birthDate?: unknown;
      registrationDate?: unknown;
      username?: unknown;
      isResident?: unknown;
      jobTitle?: unknown;
      desk?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type CallingRow = { phone?: CallingValue; label?: string | null };

export type RegionLine = { region: string; count: number };

export type CodeLine = { code: string; region: string; count: number };

export type DigitLine = { digit: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "star", "unstar", "wait", "release", "close", "reopen"] as const;

const CHANNELS = ["phone", "mail", "chat", "visit"] as const;

const PACES = ["calm", "due", "hot"] as const;

const PACE_ORDER = ["", "calm", "due", "hot"] as const;

const ALLOWANCES = [15, 30, 45, 60, 90, 120] as const;

const BANDS = ["blank", "short", "mid", "long", "first", "second"] as const;

const REGIONS = ["", "tr", "us", "uk", "de", "ru", "ae", "other", "local"] as const;

const PREFIXES: readonly (readonly [string, Exclude<DialRegion, "" | "other" | "local">])[] = [
  ["971", "ae"],
  ["90", "tr"],
  ["44", "uk"],
  ["49", "de"],
  ["7", "ru"],
  ["1", "us"],
];

const PHONE_BLOCK = [
  "email",
  "country",
  "registrationCountry",
  "address",
  "timezone",
  "city",
  "lastCountry",
  "lastCountryName",
  "lastCity",
  "lastRegion",
  "language",
  "name",
  "birthDate",
  "registrationDate",
  "username",
  "isResident",
  "jobTitle",
  "desk",
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): PromiseTray {
  return raw === "waiting" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function channelName(raw: unknown): Exclude<PromiseChannel, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CHANNELS as readonly string[]).includes(text) ? (text as Exclude<PromiseChannel, "blank">) : "";
}

function paceName(raw: unknown): Exclude<PromisePace, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<PromisePace, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function promiseText(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank owner stays blank. It is not filled in. */
export function ownerLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A blank tag stays blank. It is not filled in. */
export function tagMark(raw: unknown): string {
  return clip(raw, 12);
}

/**
 * An allowance is 15, 30, 45, 60, 90, or 120 minutes.
 * A blank value stays unset. A leading zero is not an allowance.
 * Zero is not an allowance. Ten is not an allowance.
 */
export function allowanceOf(raw: unknown): number | null {
  if (typeof raw === "number" && ALLOWANCES.includes(raw as (typeof ALLOWANCES)[number])) return raw;
  if (typeof raw === "string" && /^(?:15|30|45|60|90|120)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** The minutes already spent are 0 through 180. A blank value stays unset. A longer number that starts with zero is not a count. */
export function elapsedOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 180) return raw;
  if (typeof raw === "string" && /^(?:0|[1-9]\d?|1[0-7]\d|180)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Phone, mail, chat, visit, or blank. Anything else is blank. */
export function channelOf(raw: unknown): PromiseChannel {
  return channelName(raw) || "blank";
}

/** Calm, due, hot, or blank. Anything else is blank. */
export function paceOf(raw: unknown): PromisePace {
  return paceName(raw) || "blank";
}

/** Short is 15 and 30. Mid is 45 and 60. Long is 90 and 120. An unset allowance is blank. */
export function allowanceBand(minutes: unknown): "blank" | "short" | "mid" | "long" {
  const count = allowanceOf(minutes);
  if (count === null) return "blank";
  if (count <= 30) return "short";
  if (count <= 60) return "mid";
  return "long";
}

/** The first half is 15, 30, and 45. The second half is 60, 90, and 120. An unset allowance is blank. */
export function allowanceHalf(minutes: unknown): "blank" | "first" | "second" {
  const count = allowanceOf(minutes);
  if (count === null) return "blank";
  return count <= 45 ? "first" : "second";
}

/** Minutes from the allowance to the minutes you type. A positive gap is over the promise. An unset value stays empty. */
export function allowanceGap(minutes: unknown, elapsed: unknown): number | null {
  const from = allowanceOf(minutes);
  const at = elapsedOf(elapsed);
  if (from === null || at === null) return null;
  return at - from;
}

export function readPromises(raw: unknown): PromiseCard[] {
  if (!Array.isArray(raw)) return [];
  const out: PromiseCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PromiseCard>;
    const id = String(row.id || "").trim();
    const text = promiseText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      owner: ownerLabel(row.owner),
      minutes: allowanceOf(row.minutes),
      channel: channelName(row.channel),
      tag: tagMark(row.tag),
      pace: paceName(row.pace),
      starred: row.starred === true,
      closed: row.closed === true,
      waiting: row.waiting === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 24);
}

export function addPromise(
  cards: readonly PromiseCard[],
  card: { id: string; text: string; owner?: string; minutes?: unknown; channel?: string; tag?: string; pace?: string },
): PromiseCard[] {
  const current = readPromises(cards);
  const id = String(card.id || "").trim();
  const text = promiseText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: PromiseCard = {
    id,
    text,
    owner: ownerLabel(card.owner),
    minutes: allowanceOf(card.minutes),
    channel: channelName(card.channel),
    tag: tagMark(card.tag),
    pace: paceName(card.pace),
    starred: false,
    closed: false,
    waiting: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 24);
}

export function stepPromisePace(cards: readonly PromiseCard[], id: string, dir: 1 | -1): PromiseCard[] {
  return readPromises(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_ORDER.indexOf(card.pace as (typeof PACE_ORDER)[number]);
    const next = PACE_ORDER[Math.min(PACES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.pace) return card;
    return { ...card, pace: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setPromiseStarred(cards: readonly PromiseCard[], id: string, starred: boolean): PromiseCard[] {
  return readPromises(cards).map((card) => (card.id === id ? { ...card, starred, audit: starred ? "star" : "unstar" } : card));
}

export function setPromiseWaiting(cards: readonly PromiseCard[], id: string, waiting: boolean): PromiseCard[] {
  return readPromises(cards).map((card) => (card.id === id ? { ...card, waiting, audit: waiting ? "wait" : "release" } : card));
}

export function setPromiseClosed(cards: readonly PromiseCard[], id: string, closed: boolean): PromiseCard[] {
  return readPromises(cards).map((card) => (card.id === id ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another promise is left out. */
export function editPromise(cards: readonly PromiseCard[], id: string, text: string): PromiseCard[] {
  const current = readPromises(cards);
  const next = promiseText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkPromiseStarred(cards: readonly PromiseCard[], ids: readonly string[], starred: boolean): PromiseCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readPromises(cards).map((card) => (want.has(card.id) ? { ...card, starred, audit: starred ? "star" : "unstar" } : card));
}

export function bulkPromiseClosed(cards: readonly PromiseCard[], ids: readonly string[], closed: boolean): PromiseCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readPromises(cards).map((card) => (want.has(card.id) ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

export function resetPromises(): PromiseCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function promiseCopy(raw: unknown): string {
  return promiseText(raw);
}

function inTray(card: PromiseCard, tray: PromiseTray): boolean {
  if (tray === "closed") return card.closed;
  if (tray === "waiting") return card.waiting && !card.closed;
  return !card.waiting && !card.closed;
}

function allowanceHit(minutes: number | null, exact: number | null, band: AllowancePick | null): boolean {
  if (exact !== null) return minutes === exact;
  if (band === null) return true;
  if (band === "blank") return minutes === null;
  if (band === "first" || band === "second") return allowanceHalf(minutes) === band;
  return allowanceBand(minutes) === band;
}

function paceScore(pace: string): number {
  if (pace === "hot") return 3;
  if (pace === "due") return 2;
  if (pace === "calm") return 1;
  return 0;
}

/** Search stays on the note. The owner, the allowance, the channel, the tag, and the pace are not part of the query. */
export function visiblePromises(
  cards: readonly PromiseCard[],
  tray: PromiseTray,
  query: string,
  owner: string | null,
  channel: PromiseChannel | null,
  tag: string | null,
  pace: PromisePace | null,
  exact: number | null,
  band: AllowancePick | null,
  hotOnly: boolean,
  lateOnly: boolean,
  elapsed: unknown,
): PromiseCard[] {
  const text = query.trim().toLowerCase();
  const wantOwner = owner === null ? null : ownerLabel(owner);
  const wantTag = tag === null ? null : tagMark(tag);
  return readPromises(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (hotOnly && card.pace !== "hot") return false;
      if (wantOwner !== null && ownerLabel(card.owner) !== wantOwner) return false;
      if (channel !== null && channelOf(card.channel) !== channel) return false;
      if (wantTag !== null && tagMark(card.tag) !== wantTag) return false;
      if (pace !== null && paceOf(card.pace) !== pace) return false;
      if (!allowanceHit(card.minutes, exact, band)) return false;
      if (lateOnly) {
        const gap = allowanceGap(card.minutes, elapsed);
        if (gap === null || gap <= 0 || !inTray(card, "open")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (paceScore(a.pace) !== paceScore(b.pace)) return paceScore(b.pace) - paceScore(a.pace);
      return a.text.localeCompare(b.text);
    });
}

/** The allowance orders the desk. An unset allowance stays at the end. Search stays on the note. */
export function promiseTimeline(cards: readonly PromiseCard[], query: string): PromiseCard[] {
  const text = query.trim().toLowerCase();
  return readPromises(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.minutes === null && b.minutes !== null) return 1;
      if (a.minutes !== null && b.minutes === null) return -1;
      if (a.minutes !== null && b.minutes !== null && a.minutes !== b.minutes) return a.minutes - b.minutes;
      return a.text.localeCompare(b.text);
    });
}

export function promiseCounts(cards: readonly PromiseCard[], elapsed: unknown): PromiseCounts {
  const rows = readPromises(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    waiting: rows.filter((card) => inTray(card, "waiting")).length,
    closed: rows.filter((card) => inTray(card, "closed")).length,
    starred: rows.filter((card) => card.starred).length,
    late: rows.filter((card) => {
      const gap = allowanceGap(card.minutes, elapsed);
      return gap !== null && gap > 0 && inTray(card, "open");
    }).length,
  };
}

/** Share of the saved promises. A zero total stays at zero. */
export function promiseShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function promiseOwners(cards: readonly PromiseCard[]): string[] {
  const out: string[] = [];
  for (const card of readPromises(cards)) {
    if (card.owner && !out.includes(card.owner)) out.push(card.owner);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function promiseTags(cards: readonly PromiseCard[]): string[] {
  const out: string[] = [];
  for (const card of readPromises(cards)) {
    if (card.tag && !out.includes(card.tag)) out.push(card.tag);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function promiseChannels(cards: readonly PromiseCard[]): Exclude<PromiseChannel, "blank">[] {
  const seen = new Set<string>();
  for (const card of readPromises(cards)) if (card.channel) seen.add(card.channel);
  return CHANNELS.filter((channel) => seen.has(channel));
}

export function promisePaces(cards: readonly PromiseCard[]): Exclude<PromisePace, "blank">[] {
  const seen = new Set<string>();
  for (const card of readPromises(cards)) if (card.pace) seen.add(card.pace);
  return PACES.filter((pace) => seen.has(pace));
}

/** Six allowances. Index 0 is 15. Index 5 is 120. */
export function allowanceCounts(cards: readonly PromiseCard[]): number[] {
  const rows = readPromises(cards);
  return ALLOWANCES.map((minutes) => rows.filter((card) => card.minutes === minutes).length);
}

/** "all" and "blank" stay. An owner that is no longer on a promise falls back to all. */
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

/** "all" and "blank" stay. A channel that is no longer on a promise falls back to all. */
export function activeChannel(filter: string, channels: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const channel = channelName(filter);
  return channel && channels.includes(channel) ? channel : "all";
}

export function channelArg(filter: string): PromiseChannel | null {
  if (filter === "blank") return "blank";
  return channelName(filter) || null;
}

/** "all" and "blank" stay. A tag that is no longer on a promise falls back to all. */
export function activeTag(filter: string, tags: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tag = tagMark(filter);
  return tag && tags.includes(tag) ? tag : "all";
}

export function tagArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return tagMark(filter);
}

/** "all" and "blank" stay. A pace that is no longer on a promise falls back to all. */
export function activePace(filter: string, paces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pace = paceName(filter);
  return pace && paces.includes(pace) ? pace : "all";
}

export function paceArg(filter: string): PromisePace | null {
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

/** All, blank, the three bands, the two halves, and the six allowances stay. Anything else is all. */
export function activeAllowance(filter: string): string {
  if ((BANDS as readonly string[]).includes(filter)) return filter;
  const minutes = allowanceOf(filter);
  return minutes === null ? "all" : String(minutes);
}

export function allowanceArg(filter: string): { exact: number | null; band: AllowancePick | null } {
  if ((BANDS as readonly string[]).includes(filter)) return { exact: null, band: filter as AllowancePick };
  const minutes = allowanceOf(filter);
  return minutes === null ? { exact: null, band: null } : { exact: minutes, band: null };
}

/** Other promises with the same channel and the same allowance. A blank channel or an unset allowance clashes with nothing. */
export function promiseClashIds(cards: readonly PromiseCard[], id: string): string[] {
  const rows = readPromises(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.channel || card.minutes === null) return [];
  return rows
    .filter((item) => item.id !== id && item.channel === card.channel && item.minutes === card.minutes)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open promise at or after the minutes you type. After the last allowance, the desk wraps to the earliest open allowance. */
export function nextPromise(cards: readonly PromiseCard[], elapsed: unknown): string {
  const now = elapsedOf(elapsed);
  if (now === null) return "";
  const waiting = readPromises(cards).filter((card) => inTray(card, "open") && card.minutes !== null);
  if (!waiting.length) return "";
  const byMinutes = (a: PromiseCard, b: PromiseCard) => (a.minutes ?? 0) - (b.minutes ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.minutes ?? 0) >= now).sort(byMinutes);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byMinutes)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the promises saved in this browser. The gap uses the minutes you pass. */
export function promisesCsv(raw: unknown, elapsed: unknown): string {
  const lines = ["note,owner,minutes,channel,tag,pace,band,starred,waiting,closed,gap,audit"];
  for (const card of readPromises(raw)) {
    const gap = allowanceGap(card.minutes, elapsed);
    lines.push([
      csvCell(card.text),
      csvCell(card.owner),
      card.minutes === null ? "" : String(card.minutes),
      card.channel,
      csvCell(card.tag),
      card.pace,
      allowanceBand(card.minutes),
      card.starred ? "1" : "0",
      card.waiting ? "1" : "0",
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

function channelSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return channelName(raw) || "all";
}

function tagSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tagMark(raw) || "all";
}

function paceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return paceName(raw) || "all";
}

export function readPromiseViews(raw: unknown): PromiseView[] {
  if (!Array.isArray(raw)) return [];
  const out: PromiseView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PromiseView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      owner: ownerSlot(row.owner),
      channel: channelSlot(row.channel),
      tag: tagSlot(row.tag),
      pace: paceSlot(row.pace),
      minutes: activeAllowance(String(row.minutes ?? "")),
    });
  }
  return out.slice(0, 8);
}

export function addPromiseView(
  views: readonly PromiseView[],
  view: { id: string; name: string; tray: PromiseTray; query: string; owner: string; channel: string; tag: string; pace: string; minutes: string },
): PromiseView[] {
  const current = readPromiseViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    owner: ownerSlot(view.owner),
    channel: channelSlot(view.channel),
    tag: tagSlot(view.tag),
    pace: paceSlot(view.pace),
    minutes: activeAllowance(view.minutes),
  }].slice(0, 8);
}

export function dropPromiseView(views: readonly PromiseView[], id: string): PromiseView[] {
  return readPromiseViews(views).filter((view) => view.id !== id);
}

function parsedPhone(raw: string): { intl: boolean; digits: string } | null {
  const compact = raw.replace(/[\s().-]/g, "");
  if (!compact) return null;
  let intl = false;
  let digits = compact;
  if (digits.startsWith("+")) {
    intl = true;
    digits = digits.slice(1);
  } else if (digits.startsWith("00")) {
    intl = true;
    digits = digits.slice(2);
  }
  if (!/^\d+$/.test(digits)) return null;
  return { intl, digits };
}

function classified(raw: string): { region: DialRegion; code: string } {
  const parsed = parsedPhone(raw);
  if (!parsed) return { region: "", code: "" };
  if (!parsed.intl) return { region: "local", code: "" };
  for (const [prefix, region] of PREFIXES) {
    if (parsed.digits.startsWith(prefix)) return { region, code: prefix };
  }
  return { region: "other", code: parsed.digits.slice(0, 3) };
}

function resolvedPhone(value: CallingValue): { region: DialRegion; code: string } {
  if (typeof value === "string") return classified(value);
  if (!value || typeof value !== "object" || typeof value === "boolean") return { region: "", code: "" };
  if (PHONE_BLOCK.some((key) => key in value)) return { region: "", code: "" };
  return classified(clip(value.phone, 32));
}

/**
 * A calling region from the phone, or blank.
 * A name, an email, and a job title are not a phone.
 * A missing phone stays unmarked and is not filled in.
 */
export function dialRegion(value: CallingValue): DialRegion {
  return resolvedPhone(value).region;
}

/** The country-code digits. A local number and a missing phone stay blank. */
export function dialCode(value: CallingValue): string {
  return resolvedPhone(value).code;
}

/** The first digit of the country code. A local number and a missing phone stay blank. */
export function dialDigit(value: CallingValue): string {
  const code = resolvedPhone(value).code;
  return /^\d$/.test(code.slice(0, 1)) ? code.slice(0, 1) : "";
}

export function regionLines(rows: readonly CallingRow[]): RegionLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const region = dialRegion(row.phone);
    map.set(region, (map.get(region) || 0) + 1);
  }
  const out: RegionLine[] = [];
  for (const region of REGIONS) {
    const count = map.get(region);
    if (count) out.push({ region, count });
  }
  return out;
}

export function namedRegions(rows: readonly CallingRow[]): string[] {
  return regionLines(rows).map((line) => line.region).filter(Boolean);
}

export function codeLines(rows: readonly CallingRow[]): CodeLine[] {
  const map = new Map<string, { region: string; count: number }>();
  for (const row of rows) {
    const code = dialCode(row.phone);
    const region = dialRegion(row.phone);
    const current = map.get(code) || { region, count: 0 };
    current.count += 1;
    map.set(code, current);
  }
  const out: CodeLine[] = [];
  map.forEach((value, code) => out.push({ code, region: value.region, count: value.count }));
  return out.sort((a, b) => {
    if (!a.code) return -1;
    if (!b.code) return 1;
    return a.code.localeCompare(b.code);
  });
}

export function namedCodes(rows: readonly CallingRow[]): string[] {
  return codeLines(rows).map((line) => line.code).filter(Boolean);
}

export function digitLines(rows: readonly CallingRow[]): DigitLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const digit = dialDigit(row.phone);
    if (!digit) continue;
    map.set(digit, (map.get(digit) || 0) + 1);
  }
  const out: DigitLine[] = [];
  map.forEach((count, digit) => out.push({ digit, count }));
  return out.sort((a, b) => a.digit.localeCompare(b.digit));
}

export function namedDigits(rows: readonly CallingRow[]): string[] {
  return digitLines(rows).map((line) => line.digit);
}

/** The named region with the most loaded rows. A tie keeps the earlier region. An unmarked region is not a lead. */
export function leadingRegion(rows: readonly CallingRow[]): string {
  const named = regionLines(rows).filter((line) => line.region);
  if (!named.length) return "";
  const order = (region: string) => REGIONS.indexOf(region as (typeof REGIONS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.region) - order(b.region))[0].region;
}

/** The named code with the most loaded rows. A tie keeps the earlier code. A blank code is not a lead. */
export function leadingCode(rows: readonly CallingRow[]): string {
  const named = codeLines(rows).filter((line) => line.code);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))[0].code;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function callingShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenCodes(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const code = /^\d{1,4}$/.test(String(item || "").trim()) ? String(item).trim() : "";
    if (!code || !known.has(code) || out.includes(code)) continue;
    out.push(code);
  }
  return out;
}

export function toggleCode(hidden: readonly string[], code: string, present: readonly string[]): string[] {
  const mark = /^\d{1,4}$/.test(code.trim()) ? code.trim() : "";
  if (!mark || !present.includes(mark)) return readHiddenCodes(hidden, present);
  const current = readHiddenCodes(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleCodes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenCodes(hidden, present));
  return present.filter((code) => (showHidden ? gone.has(code) : !gone.has(code)));
}

/** "all" and "blank" stay. A region that is no longer loaded falls back to all. */
export function activeRegion(filter: string, regions: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return regions.includes(filter) ? filter : "all";
}

export function regionArg(filter: string): DialRegion | null {
  if (filter === "blank") return "";
  if ((REGIONS as readonly string[]).includes(filter) && filter !== "") return filter as DialRegion;
  return null;
}

/** A code that is no longer on a chip falls back to all. */
export function activeCode(filter: string, codes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const code = /^\d{1,4}$/.test(filter.trim()) ? filter.trim() : "";
  return code && codes.includes(code) ? code : "all";
}

export function codeArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return /^\d{1,4}$/.test(filter.trim()) ? filter.trim() : null;
}

/** A digit that is no longer loaded falls back to all. */
export function activeDigit(filter: string, digits: readonly string[]): string {
  if (!filter || filter === "all") return "all";
  const digit = filter.trim();
  return /^\d$/.test(digit) && digits.includes(digit) ? digit : "all";
}

export function digitArg(filter: string): string | null {
  if (!filter || filter === "all") return null;
  const digit = filter.trim();
  return /^\d$/.test(digit) ? digit : null;
}

/** Search stays on the name. The phone is not part of the query. */
export function visibleCallingCustomers<T extends CallingRow>(
  rows: readonly T[],
  region: DialRegion | null,
  code: string | null,
  digit: string | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (region !== null && dialRegion(row.phone) !== region) return false;
    if (code !== null && dialCode(row.phone) !== code) return false;
    if (digit !== null && dialDigit(row.phone) !== digit) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the regions, codes, and digits on this page. */
export function callingCsv(rows: readonly CallingRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of regionLines(rows)) lines.push(["region", line.region, String(line.count)].join(","));
  for (const line of codeLines(rows)) lines.push(["code", csvCell(line.code), String(line.count)].join(","));
  for (const line of digitLines(rows)) lines.push(["digit", line.digit, String(line.count)].join(","));
  return lines.join("\n");
}
