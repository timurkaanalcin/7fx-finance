/** Local vellum slips, and residency plus mail-house counts already on each loaded row. */

export const VELLUM_KEY = "crmv4-vellum-slips";
export const VELLUM_VIEW_KEY = "crmv4-vellum-views";
export const HOUSE_KEY = "crmv4-house-hide";

export type VellumTone = "blank" | "quiet" | "warm" | "firm";

export type VellumLane = "blank" | "sale" | "retain" | "kyc" | "support";

export type VellumTray = "open" | "held" | "done";

export type HourPick = "blank" | "night" | "morning" | "afternoon" | "evening" | "am" | "pm";

export type Vellum = {
  id: string;
  text: string;
  bearer: string;
  hour: number | null;
  lane: string;
  stamp: string;
  tone: string;
  pinned: boolean;
  done: boolean;
  held: boolean;
  audit: string;
};

export type VellumView = {
  id: string;
  name: string;
  tray: VellumTray;
  query: string;
  bearer: string;
  lane: string;
  stamp: string;
  tone: string;
  hour: string;
};

export type VellumCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  late: number;
};

export type Stay = "" | "resident" | "visitor";

export type MailHouse = "" | "public" | "house";

export type HouseValue =
  | {
      isResident?: unknown;
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
      phone?: unknown;
      name?: unknown;
      birthDate?: unknown;
      registrationDate?: unknown;
      username?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type HouseRow = { stay?: HouseValue; mail?: HouseValue; label?: string | null };

export type StayLine = { stay: string; count: number };

export type HouseLine = { house: string; count: number };

export type DomainLine = { domain: string; house: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "done", "reopen"] as const;

const LANES = ["sale", "retain", "kyc", "support"] as const;

const TONES = ["quiet", "warm", "firm"] as const;

const TONE_ORDER = ["", "quiet", "warm", "firm"] as const;

const WATCHES = ["night", "morning", "afternoon", "evening"] as const;

const HOUR_BANDS = ["blank", "night", "morning", "afternoon", "evening", "am", "pm"] as const;

const STAYS = ["", "resident", "visitor"] as const;

const HOUSES = ["", "public", "house"] as const;

const PUBLIC_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "yahoo.co.uk",
  "icloud.com",
  "me.com",
  "yandex.com",
  "yandex.ru",
  "proton.me",
  "protonmail.com",
] as const;

const STAY_BLOCK = [
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
  "phone",
  "name",
  "birthDate",
  "registrationDate",
  "username",
] as const;

const MAIL_BLOCK = [
  "isResident",
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
  "phone",
  "name",
  "birthDate",
  "registrationDate",
  "username",
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): VellumTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function laneName(raw: unknown): Exclude<VellumLane, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (LANES as readonly string[]).includes(text) ? (text as Exclude<VellumLane, "blank">) : "";
}

function toneName(raw: unknown): Exclude<VellumTone, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<VellumTone, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function vellumText(raw: unknown): string {
  return clip(raw, 96);
}

/** A blank bearer stays blank. It is not filled in. */
export function bearerLabel(raw: unknown): string {
  return clip(raw, 20);
}

/** A blank stamp stays blank. It is not filled in. */
export function stampTag(raw: unknown): string {
  return clip(raw, 14);
}

/**
 * An hour is 0 through 23. Zero is midnight. A blank value stays unset.
 * A leading zero is still an hour. Twenty-four is not an hour.
 */
export function hourCount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 23) return raw;
  if (typeof raw === "string" && /^(?:[0-9]|0[0-9]|1[0-9]|2[0-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Sale, retain, kyc, support, or blank. Anything else is blank. */
export function laneOf(raw: unknown): VellumLane {
  return laneName(raw) || "blank";
}

/** Quiet, warm, firm, or blank. Anything else is blank. */
export function toneOf(raw: unknown): VellumTone {
  return toneName(raw) || "blank";
}

/** Night is 0 through 5. Morning is 6 through 11. Afternoon is 12 through 17. Evening is 18 through 23. An unset hour is blank. */
export function hourWatch(hour: unknown): "blank" | "night" | "morning" | "afternoon" | "evening" {
  const count = hourCount(hour);
  if (count === null) return "blank";
  if (count <= 5) return "night";
  if (count <= 11) return "morning";
  if (count <= 17) return "afternoon";
  return "evening";
}

/** Morning half is 0 through 11. Evening half is 12 through 23. An unset hour is blank. */
export function hourHalf(hour: unknown): "blank" | "am" | "pm" {
  const count = hourCount(hour);
  if (count === null) return "blank";
  return count < 12 ? "am" : "pm";
}

/** Hours from the slip hour to the desk hour. A negative gap is still ahead. An unset hour stays empty. */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourCount(hour);
  const at = hourCount(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readVellums(raw: unknown): Vellum[] {
  if (!Array.isArray(raw)) return [];
  const out: Vellum[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Vellum>;
    const id = String(row.id || "").trim();
    const text = vellumText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      bearer: bearerLabel(row.bearer),
      hour: hourCount(row.hour),
      lane: laneName(row.lane),
      stamp: stampTag(row.stamp),
      tone: toneName(row.tone),
      pinned: row.pinned === true,
      done: row.done === true,
      held: row.held === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 24);
}

export function addVellum(
  cards: readonly Vellum[],
  card: { id: string; text: string; bearer?: string; hour?: unknown; lane?: string; stamp?: string; tone?: string },
): Vellum[] {
  const current = readVellums(cards);
  const id = String(card.id || "").trim();
  const text = vellumText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: Vellum = {
    id,
    text,
    bearer: bearerLabel(card.bearer),
    hour: hourCount(card.hour),
    lane: laneName(card.lane),
    stamp: stampTag(card.stamp),
    tone: toneName(card.tone),
    pinned: false,
    done: false,
    held: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 24);
}

export function stepVellumTone(cards: readonly Vellum[], id: string, dir: 1 | -1): Vellum[] {
  return readVellums(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TONE_ORDER.indexOf(card.tone as (typeof TONE_ORDER)[number]);
    const next = TONE_ORDER[Math.min(TONES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.tone) return card;
    return { ...card, tone: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setVellumPinned(cards: readonly Vellum[], id: string, pinned: boolean): Vellum[] {
  return readVellums(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setVellumHeld(cards: readonly Vellum[], id: string, held: boolean): Vellum[] {
  return readVellums(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setVellumDone(cards: readonly Vellum[], id: string, done: boolean): Vellum[] {
  return readVellums(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another slip is left out. */
export function editVellum(cards: readonly Vellum[], id: string, text: string): Vellum[] {
  const current = readVellums(cards);
  const next = vellumText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkVellumPinned(cards: readonly Vellum[], ids: readonly string[], pinned: boolean): Vellum[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readVellums(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkVellumDone(cards: readonly Vellum[], ids: readonly string[], done: boolean): Vellum[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readVellums(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

export function resetVellums(): Vellum[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function vellumCopy(raw: unknown): string {
  return vellumText(raw);
}

function inTray(card: Vellum, tray: VellumTray): boolean {
  if (tray === "done") return card.done;
  if (tray === "held") return card.held && !card.done;
  return !card.held && !card.done;
}

function hourHit(hour: number | null, exact: number | null, band: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (band === null) return true;
  if (band === "am" || band === "pm") return hourHalf(hour) === band;
  return hourWatch(hour) === band;
}

function toneWeight(tone: string): number {
  if (tone === "firm") return 3;
  if (tone === "warm") return 2;
  if (tone === "quiet") return 1;
  return 0;
}

/** Search stays on the note. The bearer, the hour, the lane, the stamp, and the tone are not part of the query. */
export function visibleVellums(
  cards: readonly Vellum[],
  tray: VellumTray,
  query: string,
  bearer: string | null,
  lane: VellumLane | null,
  stamp: string | null,
  tone: VellumTone | null,
  exact: number | null,
  band: HourPick | null,
  firmOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): Vellum[] {
  const text = query.trim().toLowerCase();
  const wantBearer = bearer === null ? null : bearerLabel(bearer);
  const wantStamp = stamp === null ? null : stampTag(stamp);
  return readVellums(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (firmOnly && card.tone !== "firm") return false;
      if (wantBearer !== null && bearerLabel(card.bearer) !== wantBearer) return false;
      if (lane !== null && laneOf(card.lane) !== lane) return false;
      if (wantStamp !== null && stampTag(card.stamp) !== wantStamp) return false;
      if (tone !== null && toneOf(card.tone) !== tone) return false;
      if (!hourHit(card.hour, exact, band)) return false;
      if (lateOnly) {
        const gap = hourGap(card.hour, desk);
        if (gap === null || gap <= 0 || !inTray(card, "open")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (toneWeight(a.tone) !== toneWeight(b.tone)) return toneWeight(b.tone) - toneWeight(a.tone);
      return a.text.localeCompare(b.text);
    });
}

/** The hour orders the desk. An unset hour stays at the end. Search stays on the note. */
export function vellumTimeline(cards: readonly Vellum[], query: string): Vellum[] {
  const text = query.trim().toLowerCase();
  return readVellums(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.hour === null && b.hour !== null) return 1;
      if (a.hour !== null && b.hour === null) return -1;
      if (a.hour !== null && b.hour !== null && a.hour !== b.hour) return a.hour - b.hour;
      return a.text.localeCompare(b.text);
    });
}

export function vellumCounts(cards: readonly Vellum[], desk: unknown): VellumCounts {
  const rows = readVellums(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => {
      const gap = hourGap(card.hour, desk);
      return gap !== null && gap > 0 && inTray(card, "open");
    }).length,
  };
}

/** Share of the saved slips. A zero total stays at zero. */
export function vellumShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function vellumBearers(cards: readonly Vellum[]): string[] {
  const out: string[] = [];
  for (const card of readVellums(cards)) {
    if (card.bearer && !out.includes(card.bearer)) out.push(card.bearer);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function vellumStamps(cards: readonly Vellum[]): string[] {
  const out: string[] = [];
  for (const card of readVellums(cards)) {
    if (card.stamp && !out.includes(card.stamp)) out.push(card.stamp);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function vellumLanes(cards: readonly Vellum[]): Exclude<VellumLane, "blank">[] {
  const seen = new Set<string>();
  for (const card of readVellums(cards)) if (card.lane) seen.add(card.lane);
  return LANES.filter((lane) => seen.has(lane));
}

export function vellumTones(cards: readonly Vellum[]): Exclude<VellumTone, "blank">[] {
  const seen = new Set<string>();
  for (const card of readVellums(cards)) if (card.tone) seen.add(card.tone);
  return TONES.filter((tone) => seen.has(tone));
}

/** Four watches. The count is the slips whose hour falls in that watch. */
export function watchCounts(cards: readonly Vellum[]): number[] {
  const rows = readVellums(cards);
  return WATCHES.map((watch) => rows.filter((card) => hourWatch(card.hour) === watch).length);
}

/** "all" and "blank" stay. A bearer that is no longer on a slip falls back to all. */
export function activeBearer(filter: string, bearers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const bearer = bearerLabel(filter);
  return bearer && bearers.includes(bearer) ? bearer : "all";
}

export function bearerArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return bearerLabel(filter);
}

/** "all" and "blank" stay. A lane that is no longer on a slip falls back to all. */
export function activeLane(filter: string, lanes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const lane = laneName(filter);
  return lane && lanes.includes(lane) ? lane : "all";
}

export function laneArg(filter: string): VellumLane | null {
  if (filter === "blank") return "blank";
  return laneName(filter) || null;
}

/** "all" and "blank" stay. A stamp that is no longer on a slip falls back to all. */
export function activeStamp(filter: string, stamps: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const stamp = stampTag(filter);
  return stamp && stamps.includes(stamp) ? stamp : "all";
}

export function stampArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return stampTag(filter);
}

/** "all" and "blank" stay. A tone that is no longer on a slip falls back to all. */
export function activeTone(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tone = toneName(filter);
  return tone && tones.includes(tone) ? tone : "all";
}

export function toneArg(filter: string): VellumTone | null {
  if (filter === "blank") return "blank";
  return toneName(filter) || null;
}

/** All, blank, the four watches, the two halves, and hours 0 through 23 stay. Anything else is all. */
export function activeHour(filter: string): string {
  if ((HOUR_BANDS as readonly string[]).includes(filter)) return filter;
  const hour = hourCount(filter);
  return hour === null ? "all" : String(hour);
}

export function hourArg(filter: string): { exact: number | null; band: HourPick | null } {
  if ((HOUR_BANDS as readonly string[]).includes(filter)) return { exact: null, band: filter as HourPick };
  const hour = hourCount(filter);
  return hour === null ? { exact: null, band: null } : { exact: hour, band: null };
}

/** Other slips with the same lane and the same hour. A blank lane or an unset hour clashes with nothing. */
export function vellumClashIds(cards: readonly Vellum[], id: string): string[] {
  const rows = readVellums(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.lane || card.hour === null) return [];
  return rows
    .filter((item) => item.id !== id && item.lane === card.lane && item.hour === card.hour)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open slip at or after the hour. After the last hour, the desk wraps to the earliest open hour. */
export function nextVellum(cards: readonly Vellum[], hour: unknown): string {
  const now = hourCount(hour);
  if (now === null) return "";
  const waiting = readVellums(cards).filter((card) => inTray(card, "open") && card.hour !== null);
  if (!waiting.length) return "";
  const byHour = (a: Vellum, b: Vellum) => (a.hour ?? 0) - (b.hour ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap uses the hour you pass. */
export function vellumsCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,bearer,hour,lane,stamp,tone,watch,pinned,done,held,gap,audit"];
  for (const card of readVellums(raw)) {
    const gap = hourGap(card.hour, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.bearer),
      card.hour === null ? "" : String(card.hour),
      card.lane,
      csvCell(card.stamp),
      card.tone,
      hourWatch(card.hour),
      card.pinned ? "1" : "0",
      card.done ? "1" : "0",
      card.held ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function bearerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return bearerLabel(raw) || "all";
}

function laneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return laneName(raw) || "all";
}

function stampSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stampTag(raw) || "all";
}

function toneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return toneName(raw) || "all";
}

export function readVellumViews(raw: unknown): VellumView[] {
  if (!Array.isArray(raw)) return [];
  const out: VellumView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<VellumView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 96),
      bearer: bearerSlot(row.bearer),
      lane: laneSlot(row.lane),
      stamp: stampSlot(row.stamp),
      tone: toneSlot(row.tone),
      hour: activeHour(String(row.hour ?? "")),
    });
  }
  return out.slice(0, 8);
}

export function addVellumView(
  views: readonly VellumView[],
  view: { id: string; name: string; tray: VellumTray; query: string; bearer: string; lane: string; stamp: string; tone: string; hour: string },
): VellumView[] {
  const current = readVellumViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 96),
    bearer: bearerSlot(view.bearer),
    lane: laneSlot(view.lane),
    stamp: stampSlot(view.stamp),
    tone: toneSlot(view.tone),
    hour: activeHour(view.hour),
  }].slice(0, 8);
}

export function dropVellumView(views: readonly VellumView[], id: string): VellumView[] {
  return readVellumViews(views).filter((view) => view.id !== id);
}

function stayWord(raw: unknown): Stay {
  if (raw === true) return "resident";
  if (raw === false) return "visitor";
  const text = clip(raw, 12).toLowerCase();
  if (text === "true" || text === "1" || text === "yes" || text === "resident") return "resident";
  if (text === "false" || text === "0" || text === "no" || text === "visitor") return "visitor";
  return "";
}

function resolvedStay(value: HouseValue): Stay {
  if (typeof value === "boolean" || typeof value === "string" || typeof value === "number") return stayWord(value);
  if (!value || typeof value !== "object") return "";
  if (STAY_BLOCK.some((key) => key in value)) return "";
  return stayWord(value.isResident);
}

/**
 * Resident, visitor, or unmarked. A country, an address, a registration country, and a timezone are not residency.
 * A missing mark stays unmarked and is not filled in.
 */
export function stayOf(value: HouseValue): Stay {
  return resolvedStay(value);
}

function cleanDomain(raw: unknown): string {
  const text = clip(raw, 80).toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(text)) return "";
  const tail = text.split(".").pop() || "";
  if (tail.length < 2) return "";
  return text;
}

function domainOfText(raw: unknown): string {
  const text = clip(raw, 120).toLowerCase();
  const match = /^[^@\s]+@([a-z0-9.-]+)$/.exec(text);
  if (!match) return "";
  return cleanDomain(match[1]);
}

function houseOfDomain(domain: string): MailHouse {
  if (!domain) return "";
  return (PUBLIC_DOMAINS as readonly string[]).includes(domain) ? "public" : "house";
}

function resolvedDomain(value: HouseValue): string {
  if (typeof value === "string") return domainOfText(value);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (MAIL_BLOCK.some((key) => key in value)) return "";
  return domainOfText(value.email);
}

/** The mail domain already on the row. A name is not an email. A phone is not an email. A missing address stays blank. */
export function mailDomain(value: HouseValue): string {
  return resolvedDomain(value);
}

/** Public is a known public mail house. House is any other domain. A missing address stays blank. */
export function mailHouse(value: HouseValue): MailHouse {
  return houseOfDomain(resolvedDomain(value));
}

export function stayLines(rows: readonly HouseRow[]): StayLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const stay = stayOf(row.stay);
    map.set(stay, (map.get(stay) || 0) + 1);
  }
  const out: StayLine[] = [];
  for (const stay of STAYS) {
    const count = map.get(stay);
    if (count) out.push({ stay, count });
  }
  return out;
}

export function namedStays(rows: readonly HouseRow[]): string[] {
  return stayLines(rows).map((line) => line.stay).filter(Boolean);
}

export function houseLines(rows: readonly HouseRow[]): HouseLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const house = mailHouse(row.mail);
    map.set(house, (map.get(house) || 0) + 1);
  }
  const out: HouseLine[] = [];
  for (const house of HOUSES) {
    const count = map.get(house);
    if (count) out.push({ house, count });
  }
  return out;
}

export function namedHouses(rows: readonly HouseRow[]): string[] {
  return houseLines(rows).map((line) => line.house).filter(Boolean);
}

export function domainLines(rows: readonly HouseRow[]): DomainLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const domain = mailDomain(row.mail);
    map.set(domain, (map.get(domain) || 0) + 1);
  }
  const out: DomainLine[] = [];
  map.forEach((count, domain) => out.push({ domain, house: houseOfDomain(domain), count }));
  return out.sort((a, b) => {
    if (!a.domain) return -1;
    if (!b.domain) return 1;
    return a.domain.localeCompare(b.domain);
  });
}

export function namedDomains(rows: readonly HouseRow[]): string[] {
  return domainLines(rows).map((line) => line.domain).filter(Boolean);
}

/** The named stay with the most loaded rows. A tie keeps resident before visitor. An unmarked stay is not a lead. */
export function leadingStay(rows: readonly HouseRow[]): string {
  const named = stayLines(rows).filter((line) => line.stay);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.stay.localeCompare(b.stay))[0].stay;
}

/** The named mail house with the most loaded rows. A tie keeps house before public. A blank house is not a lead. */
export function leadingHouse(rows: readonly HouseRow[]): string {
  const named = houseLines(rows).filter((line) => line.house);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.house.localeCompare(b.house))[0].house;
}

/** The named domain with the most loaded rows. A tie keeps the earlier domain. A blank domain is not a lead. */
export function leadingDomain(rows: readonly HouseRow[]): string {
  const named = domainLines(rows).filter((line) => line.domain);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain))[0].domain;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function houseShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenDomains(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const domain = cleanDomain(item);
    if (!domain || !known.has(domain) || out.includes(domain)) continue;
    out.push(domain);
  }
  return out;
}

export function toggleDomain(hidden: readonly string[], domain: string, present: readonly string[]): string[] {
  const mark = cleanDomain(domain);
  if (!mark || !present.includes(mark)) return readHiddenDomains(hidden, present);
  const current = readHiddenDomains(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleDomains(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenDomains(hidden, present));
  return present.filter((domain) => (showHidden ? gone.has(domain) : !gone.has(domain)));
}

/** "all" and "blank" stay. A stay that is no longer loaded falls back to all. */
export function activeStay(filter: string, stays: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return stays.includes(filter) ? filter : "all";
}

export function stayArg(filter: string): Stay | null {
  if (filter === "blank") return "";
  if (filter === "resident" || filter === "visitor") return filter;
  return null;
}

/** "all" and "blank" stay. A house that is no longer loaded falls back to all. */
export function activeHouse(filter: string, houses: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return houses.includes(filter) ? filter : "all";
}

export function houseArg(filter: string): MailHouse | null {
  if (filter === "blank") return "";
  if (filter === "public" || filter === "house") return filter;
  return null;
}

/** A domain that is no longer on a chip falls back to all. */
export function activeDomain(filter: string, domains: readonly string[]): string {
  if (!filter || filter === "all") return "all";
  const domain = cleanDomain(filter);
  return domain && domains.includes(domain) ? domain : "all";
}

export function domainArg(filter: string): string | null {
  if (!filter || filter === "all") return null;
  return cleanDomain(filter) || null;
}

/** Search stays on the name. The email and the residency mark are not part of the query. */
export function visibleHouseCustomers<T extends HouseRow>(
  rows: readonly T[],
  stay: Stay | null,
  house: MailHouse | null,
  domain: string | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (stay !== null && stayOf(row.stay) !== stay) return false;
    if (house !== null && mailHouse(row.mail) !== house) return false;
    if (domain !== null && mailDomain(row.mail) !== domain) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the stays, mail houses, domains, and counts on this page. */
export function housesCsv(rows: readonly HouseRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of stayLines(rows)) lines.push(["stay", line.stay, String(line.count)].join(","));
  for (const line of houseLines(rows)) lines.push(["house", line.house, String(line.count)].join(","));
  for (const line of domainLines(rows)) lines.push(["domain", csvCell(line.domain), String(line.count)].join(","));
  return lines.join("\n");
}
