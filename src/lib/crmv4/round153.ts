/**
 * Local kiln slips, and usernames already on each loaded row.
 * Persistence stays in this browser. A future table is a proposal only and is not applied:
 * CREATE TABLE crm_kiln_slip (
 *   id text primary key,
 *   note text not null,
 *   potter text not null default '',
 *   hour integer,
 *   glaze text not null default '',
 *   stamp text not null default '',
 *   heat text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   shelved boolean not null default false,
 *   audit text not null default ''
 * );
 */

export const KILN_KEY = "crmv4-kiln-slips";
export const KILN_VIEW_KEY = "crmv4-kiln-views";
export const HANDLE_KEY = "crmv4-handle-hide";

export type KilnHeat = "blank" | "banked" | "steady" | "fired";

export type KilnGlaze = "blank" | "ash" | "salt" | "celadon" | "tenmoku";

export type KilnTray = "open" | "held" | "shelved";

export type WatchPick = "blank" | "night" | "morning" | "afternoon" | "evening" | "odd" | "even";

export type KilnCard = {
  id: string;
  text: string;
  potter: string;
  hour: number | null;
  glaze: string;
  stamp: string;
  heat: string;
  pinned: boolean;
  shelved: boolean;
  held: boolean;
  audit: string;
};

export type KilnView = {
  id: string;
  name: string;
  tray: KilnTray;
  query: string;
  potter: string;
  glaze: string;
  stamp: string;
  heat: string;
  hour: string;
};

export type KilnCounts = {
  open: number;
  held: number;
  shelved: number;
  pinned: number;
  late: number;
};

export type HandleSpan = "" | "tiny" | "plain" | "wide";

export type HandleVoice = "" | "vowel" | "consonant";

export type HandleValue =
  | {
      username?: unknown;
      email?: unknown;
      phone?: unknown;
      name?: unknown;
      country?: unknown;
      city?: unknown;
      desk?: unknown;
      jobTitle?: unknown;
      language?: unknown;
      accountLoginId?: unknown;
      birthDate?: unknown;
      registrationDate?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type HandleRow = { handle?: HandleValue; label?: string | null };

export type LetterLine = { letter: string; count: number };

export type SpanLine = { span: string; count: number };

export type VoiceLine = { voice: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "shelve", "unshelve"] as const;

const GLAZES = ["ash", "salt", "celadon", "tenmoku"] as const;

const HEATS = ["banked", "steady", "fired"] as const;

const HEAT_ORDER = ["", "banked", "steady", "fired"] as const;

const PICKS = ["blank", "night", "morning", "afternoon", "evening", "odd", "even"] as const;

const WATCHES = ["night", "morning", "afternoon", "evening"] as const;

const SPANS = ["", "tiny", "plain", "wide"] as const;

const VOICES = ["", "vowel", "consonant"] as const;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const HANDLE_BLOCK = [
  "email",
  "phone",
  "name",
  "country",
  "city",
  "desk",
  "jobTitle",
  "language",
  "accountLoginId",
  "birthDate",
  "registrationDate",
] as const;

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): KilnTray {
  return raw === "held" || raw === "shelved" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glazeName(raw: unknown): Exclude<KilnGlaze, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GLAZES as readonly string[]).includes(text) ? (text as Exclude<KilnGlaze, "blank">) : "";
}

function heatName(raw: unknown): Exclude<KilnHeat, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (HEATS as readonly string[]).includes(text) ? (text as Exclude<KilnHeat, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function kilnText(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank potter stays blank. It is not filled in. */
export function potterLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank stamp stays blank. It is not filled in. */
export function stampMark(raw: unknown): string {
  return clip(raw, 10);
}

/**
 * An hour is 0 through 23.
 * A blank value stays unset. 24 is not an hour.
 * A leading zero is still an hour: 07 is 7, and 00 is 0.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 23) return raw;
  if (typeof raw === "string" && /^(?:0?\d|1\d|2[0-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Ash, salt, celadon, tenmoku, or blank. Anything else is blank. */
export function glazeOf(raw: unknown): KilnGlaze {
  return glazeName(raw) || "blank";
}

/** Banked, steady, fired, or blank. Anything else is blank. */
export function heatOf(raw: unknown): KilnHeat {
  return heatName(raw) || "blank";
}

/** Night is 0–5. Morning is 6–11. Afternoon is 12–17. Evening is 18–23. An unset hour is blank. */
export function watchOf(hour: unknown): "blank" | "night" | "morning" | "afternoon" | "evening" {
  const count = hourOf(hour);
  if (count === null) return "blank";
  if (count <= 5) return "night";
  if (count <= 11) return "morning";
  if (count <= 17) return "afternoon";
  return "evening";
}

/** Odd hours and even hours. An unset hour is blank. Zero is even. */
export function hourPair(hour: unknown): "blank" | "odd" | "even" {
  const count = hourOf(hour);
  if (count === null) return "blank";
  return count % 2 === 1 ? "odd" : "even";
}

/** The typed hour minus the slip hour. A positive gap is past the hour. */
export function hourGap(hour: unknown, clock: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(clock);
  if (from === null || at === null) return null;
  return at - from;
}

export function readKilns(raw: unknown): KilnCard[] {
  if (!Array.isArray(raw)) return [];
  const out: KilnCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KilnCard>;
    const id = String(row.id || "").trim();
    const text = kilnText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      potter: potterLabel(row.potter),
      hour: hourOf(row.hour),
      glaze: glazeName(row.glaze),
      stamp: stampMark(row.stamp),
      heat: heatName(row.heat),
      pinned: row.pinned === true,
      shelved: row.shelved === true,
      held: row.held === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 20);
}

export function addKiln(
  cards: readonly KilnCard[],
  card: { id: string; text: string; potter?: string; hour?: unknown; glaze?: string; stamp?: string; heat?: string },
): KilnCard[] {
  const current = readKilns(cards);
  const id = String(card.id || "").trim();
  const text = kilnText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: KilnCard = {
    id,
    text,
    potter: potterLabel(card.potter),
    hour: hourOf(card.hour),
    glaze: glazeName(card.glaze),
    stamp: stampMark(card.stamp),
    heat: heatName(card.heat),
    pinned: false,
    shelved: false,
    held: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 20);
}

export function stepKilnHeat(cards: readonly KilnCard[], id: string, dir: 1 | -1): KilnCard[] {
  return readKilns(cards).map((card) => {
    if (card.id !== id) return card;
    const at = HEAT_ORDER.indexOf(card.heat as (typeof HEAT_ORDER)[number]);
    const next = HEAT_ORDER[Math.min(HEATS.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.heat) return card;
    return { ...card, heat: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setKilnPinned(cards: readonly KilnCard[], id: string, pinned: boolean): KilnCard[] {
  return readKilns(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setKilnHeld(cards: readonly KilnCard[], id: string, held: boolean): KilnCard[] {
  return readKilns(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setKilnShelved(cards: readonly KilnCard[], id: string, shelved: boolean): KilnCard[] {
  return readKilns(cards).map((card) => (card.id === id ? { ...card, shelved, audit: shelved ? "shelve" : "unshelve" } : card));
}

/** A blank edit is left out. A duplicate of another slip is left out. */
export function editKiln(cards: readonly KilnCard[], id: string, text: string): KilnCard[] {
  const current = readKilns(cards);
  const next = kilnText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkKilnPinned(cards: readonly KilnCard[], ids: readonly string[], pinned: boolean): KilnCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readKilns(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkKilnShelved(cards: readonly KilnCard[], ids: readonly string[], shelved: boolean): KilnCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readKilns(cards).map((card) => (want.has(card.id) ? { ...card, shelved, audit: shelved ? "shelve" : "unshelve" } : card));
}

export function resetKilns(): KilnCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function kilnCopy(raw: unknown): string {
  return kilnText(raw);
}

function inTray(card: KilnCard, tray: KilnTray): boolean {
  if (tray === "shelved") return card.shelved;
  if (tray === "held") return card.held && !card.shelved;
  return !card.held && !card.shelved;
}

function hourHit(hour: number | null, exact: number | null, band: WatchPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (band === null) return true;
  if (band === "blank") return hour === null;
  if (band === "odd" || band === "even") return hourPair(hour) === band;
  return watchOf(hour) === band;
}

function heatScore(heat: string): number {
  if (heat === "fired") return 3;
  if (heat === "steady") return 2;
  if (heat === "banked") return 1;
  return 0;
}

function bankedLate(card: KilnCard, clock: unknown): boolean {
  const gap = hourGap(card.hour, clock);
  return gap !== null && gap > 0 && card.heat === "banked" && inTray(card, "open");
}

/** Search stays on the note. The potter, the hour, the glaze, the stamp, and the heat are not part of the query. */
export function visibleKilns(
  cards: readonly KilnCard[],
  tray: KilnTray,
  query: string,
  potter: string | null,
  glaze: KilnGlaze | null,
  stamp: string | null,
  heat: KilnHeat | null,
  exact: number | null,
  band: WatchPick | null,
  firedOnly: boolean,
  lateOnly: boolean,
  clock: unknown,
): KilnCard[] {
  const text = query.trim().toLowerCase();
  const wantPotter = potter === null ? null : potterLabel(potter);
  const wantStamp = stamp === null ? null : stampMark(stamp);
  return readKilns(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (firedOnly && card.heat !== "fired") return false;
      if (wantPotter !== null && potterLabel(card.potter) !== wantPotter) return false;
      if (glaze !== null && glazeOf(card.glaze) !== glaze) return false;
      if (wantStamp !== null && stampMark(card.stamp) !== wantStamp) return false;
      if (heat !== null && heatOf(card.heat) !== heat) return false;
      if (!hourHit(card.hour, exact, band)) return false;
      if (lateOnly && !bankedLate(card, clock)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (heatScore(a.heat) !== heatScore(b.heat)) return heatScore(b.heat) - heatScore(a.heat);
      return a.text.localeCompare(b.text);
    });
}

/** The hour orders the desk. An unset hour stays at the end. Search stays on the note. */
export function kilnTimeline(cards: readonly KilnCard[], query: string): KilnCard[] {
  const text = query.trim().toLowerCase();
  return readKilns(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.hour === null && b.hour !== null) return 1;
      if (a.hour !== null && b.hour === null) return -1;
      if (a.hour !== null && b.hour !== null && a.hour !== b.hour) return a.hour - b.hour;
      return a.text.localeCompare(b.text);
    });
}

export function kilnCounts(cards: readonly KilnCard[], clock: unknown): KilnCounts {
  const rows = readKilns(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    shelved: rows.filter((card) => inTray(card, "shelved")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => bankedLate(card, clock)).length,
  };
}

/** Share of the saved slips. A zero total stays at zero. */
export function kilnShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function kilnPotters(cards: readonly KilnCard[]): string[] {
  const out: string[] = [];
  for (const card of readKilns(cards)) {
    if (card.potter && !out.includes(card.potter)) out.push(card.potter);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function kilnStamps(cards: readonly KilnCard[]): string[] {
  const out: string[] = [];
  for (const card of readKilns(cards)) {
    if (card.stamp && !out.includes(card.stamp)) out.push(card.stamp);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function kilnGlazes(cards: readonly KilnCard[]): Exclude<KilnGlaze, "blank">[] {
  const seen = new Set<string>();
  for (const card of readKilns(cards)) if (card.glaze) seen.add(card.glaze);
  return GLAZES.filter((glaze) => seen.has(glaze));
}

export function kilnHeats(cards: readonly KilnCard[]): Exclude<KilnHeat, "blank">[] {
  const seen = new Set<string>();
  for (const card of readKilns(cards)) if (card.heat) seen.add(card.heat);
  return HEATS.filter((heat) => seen.has(heat));
}

/** Four watches. Index 0 is night. Index 3 is evening. */
export function watchCounts(cards: readonly KilnCard[]): number[] {
  const rows = readKilns(cards);
  return WATCHES.map((band) => rows.filter((card) => watchOf(card.hour) === band).length);
}

/** "all" and "blank" stay. A potter that is no longer on a slip falls back to all. */
export function activePotter(filter: string, potters: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const potter = potterLabel(filter);
  return potter && potters.includes(potter) ? potter : "all";
}

export function potterArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return potterLabel(filter);
}

/** "all" and "blank" stay. A glaze that is no longer on a slip falls back to all. */
export function activeGlaze(filter: string, glazes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const glaze = glazeName(filter);
  return glaze && glazes.includes(glaze) ? glaze : "all";
}

export function glazeArg(filter: string): KilnGlaze | null {
  if (filter === "blank") return "blank";
  return glazeName(filter) || null;
}

/** "all" and "blank" stay. A stamp that is no longer on a slip falls back to all. */
export function activeStamp(filter: string, stamps: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const stamp = stampMark(filter);
  return stamp && stamps.includes(stamp) ? stamp : "all";
}

export function stampArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return stampMark(filter);
}

/** "all" and "blank" stay. A heat that is no longer on a slip falls back to all. */
export function activeHeat(filter: string, heats: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const heat = heatName(filter);
  return heat && heats.includes(heat) ? heat : "all";
}

export function heatArg(filter: string): KilnHeat | null {
  if (filter === "blank") return "blank";
  return heatName(filter) || null;
}

/** All, blank, the four watches, the two pairs, and the hours 0 through 23 stay. Anything else is all. */
export function activeHour(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const hour = hourOf(filter);
  return hour === null ? "all" : String(hour);
}

export function hourArg(filter: string): { exact: number | null; band: WatchPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, band: filter as WatchPick };
  const hour = hourOf(filter);
  return hour === null ? { exact: null, band: null } : { exact: hour, band: null };
}

/** Other slips with the same glaze and the same hour. A blank glaze or an unset hour clashes with nothing. */
export function kilnClashIds(cards: readonly KilnCard[], id: string): string[] {
  const rows = readKilns(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.glaze || card.hour === null) return [];
  return rows
    .filter((item) => item.id !== id && item.glaze === card.glaze && item.hour === card.hour)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/**
 * The next open slip at or after the hour you type, skipping fired heat.
 * After the last hour, the desk wraps to the earliest open hour that is not fired.
 */
export function nextKiln(cards: readonly KilnCard[], clock: unknown): string {
  const now = hourOf(clock);
  if (now === null) return "";
  const waiting = readKilns(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.heat !== "fired");
  if (!waiting.length) return "";
  const byHour = (a: KilnCard, b: KilnCard) => (a.hour ?? 0) - (b.hour ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap uses the hour you pass. */
export function kilnsCsv(raw: unknown, clock: unknown): string {
  const lines = ["note,potter,hour,glaze,stamp,heat,watch,pinned,held,shelved,gap,audit"];
  for (const card of readKilns(raw)) {
    const gap = hourGap(card.hour, clock);
    lines.push([
      csvCell(card.text),
      csvCell(card.potter),
      card.hour === null ? "" : String(card.hour),
      card.glaze,
      csvCell(card.stamp),
      card.heat,
      watchOf(card.hour),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.shelved ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function potterSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return potterLabel(raw) || "all";
}

function glazeSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return glazeName(raw) || "all";
}

function stampSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stampMark(raw) || "all";
}

function heatSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return heatName(raw) || "all";
}

export function readKilnViews(raw: unknown): KilnView[] {
  if (!Array.isArray(raw)) return [];
  const out: KilnView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KilnView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 72),
      potter: potterSlot(row.potter),
      glaze: glazeSlot(row.glaze),
      stamp: stampSlot(row.stamp),
      heat: heatSlot(row.heat),
      hour: activeHour(String(row.hour ?? "")),
    });
  }
  return out.slice(0, 6);
}

export function addKilnView(
  views: readonly KilnView[],
  view: { id: string; name: string; tray: KilnTray; query: string; potter: string; glaze: string; stamp: string; heat: string; hour: string },
): KilnView[] {
  const current = readKilnViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 72),
    potter: potterSlot(view.potter),
    glaze: glazeSlot(view.glaze),
    stamp: stampSlot(view.stamp),
    heat: heatSlot(view.heat),
    hour: activeHour(view.hour),
  }].slice(0, 6);
}

export function dropKilnView(views: readonly KilnView[], id: string): KilnView[] {
  return readKilnViews(views).filter((view) => view.id !== id);
}

function resolvedHandle(value: HandleValue): string {
  if (typeof value === "string") return clip(value, 24);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (HANDLE_BLOCK.some((key) => key in value)) return "";
  return clip(value.username, 24);
}

/**
 * A username from the handle field, or blank.
 * A name, an email, and a phone are not a username.
 * A missing username stays unmarked and is not filled in.
 */
export function assignedHandle(value: HandleValue): string {
  return resolvedHandle(value);
}

/** The first letter when the username starts with a letter. Anything else stays blank. */
export function letterOf(value: HandleValue): string {
  const handle = resolvedHandle(value);
  if (!/^[A-Za-z]/.test(handle)) return "";
  return handle[0].toUpperCase();
}

/** Tiny is 1–3 characters. Plain is 4–8. Wide is 9 or more. A blank username stays blank. */
export function spanOf(value: HandleValue): HandleSpan {
  const handle = resolvedHandle(value);
  if (!handle) return "";
  if (handle.length <= 3) return "tiny";
  if (handle.length <= 8) return "plain";
  return "wide";
}

/** Vowel or consonant from the first letter. A blank username and a non-letter start stay blank. */
export function voiceOf(value: HandleValue): HandleVoice {
  const letter = letterOf(value);
  if (!letter) return "";
  return VOWELS.has(letter) ? "vowel" : "consonant";
}

export function letterLines(rows: readonly HandleRow[]): LetterLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const letter = letterOf(row.handle);
    map.set(letter, (map.get(letter) || 0) + 1);
  }
  const out: LetterLine[] = [];
  if (map.get("")) out.push({ letter: "", count: map.get("") || 0 });
  for (const letter of LETTERS) {
    const count = map.get(letter);
    if (count) out.push({ letter, count });
  }
  return out;
}

export function namedLetters(rows: readonly HandleRow[]): string[] {
  return letterLines(rows).map((line) => line.letter).filter(Boolean);
}

export function spanLines(rows: readonly HandleRow[]): SpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = spanOf(row.handle);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: SpanLine[] = [];
  for (const span of SPANS) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly HandleRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

export function voiceLines(rows: readonly HandleRow[]): VoiceLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const voice = voiceOf(row.handle);
    map.set(voice, (map.get(voice) || 0) + 1);
  }
  const out: VoiceLine[] = [];
  for (const voice of VOICES) {
    const count = map.get(voice);
    if (count) out.push({ voice, count });
  }
  return out;
}

export function namedVoices(rows: readonly HandleRow[]): string[] {
  return voiceLines(rows).map((line) => line.voice).filter(Boolean);
}

/** The letter with the most loaded rows. A tie keeps the earlier letter. An unmarked handle is not a lead. */
export function leadingLetter(rows: readonly HandleRow[]): string {
  const named = letterLines(rows).filter((line) => line.letter);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter))[0].letter;
}

/** The named span with the most loaded rows. A tie keeps the earlier span. A blank span is not a lead. */
export function leadingSpan(rows: readonly HandleRow[]): string {
  const named = spanLines(rows).filter((line) => line.span);
  if (!named.length) return "";
  const order = (span: string) => SPANS.indexOf(span as (typeof SPANS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.span) - order(b.span))[0].span;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function handleShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenLetters(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = clip(item, 1).toUpperCase();
    if (!/^[A-Z]$/.test(mark) || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleLetter(hidden: readonly string[], letter: string, present: readonly string[]): string[] {
  const mark = letterOf(letter);
  if (!mark || !present.includes(mark)) return readHiddenLetters(hidden, present);
  const current = readHiddenLetters(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleLetters(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenLetters(hidden, present));
  return present.filter((letter) => (showHidden ? gone.has(letter) : !gone.has(letter)));
}

/** "all" and "blank" stay. A letter that is no longer loaded falls back to all. */
export function activeLetter(filter: string, letters: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const letter = letterOf(filter);
  return letter && letters.includes(letter) ? letter : "all";
}

export function letterArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const letter = letterOf(filter);
  return letter || null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SPANS as readonly string[]).includes(filter) && spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): HandleSpan | null {
  if (filter === "blank") return "";
  if ((SPANS as readonly string[]).includes(filter) && filter !== "") return filter as HandleSpan;
  return null;
}

/** "all" and "blank" stay. A voice that is no longer loaded falls back to all. */
export function activeVoice(filter: string, voices: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (VOICES as readonly string[]).includes(filter) && voices.includes(filter) ? filter : "all";
}

export function voiceArg(filter: string): HandleVoice | null {
  if (filter === "blank") return "";
  if ((VOICES as readonly string[]).includes(filter) && filter !== "") return filter as HandleVoice;
  return null;
}

/** Search stays on the name. The username is not part of the query. */
export function visibleHandleCustomers<T extends HandleRow>(
  rows: readonly T[],
  letter: string | null,
  voice: HandleVoice | null,
  span: HandleSpan | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (letter !== null && letterOf(row.handle) !== letter) return false;
    if (voice !== null && voiceOf(row.handle) !== voice) return false;
    if (span !== null && spanOf(row.handle) !== span) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the letters, spans, and voices on this page. */
export function handlesCsv(rows: readonly HandleRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of letterLines(rows)) lines.push(["letter", csvCell(line.letter), String(line.count)].join(","));
  for (const line of spanLines(rows)) lines.push(["span", line.span, String(line.count)].join(","));
  for (const line of voiceLines(rows)) lines.push(["voice", line.voice, String(line.count)].join(","));
  return lines.join("\n");
}
