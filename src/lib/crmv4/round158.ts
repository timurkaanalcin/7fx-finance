/**
 * Local aviary perches for follow-up review, and presence watches already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_aviary_perch (
 *   id text primary key,
 *   note text not null,
 *   keeper text not null default '',
 *   perch integer,
 *   plumage text not null default '',
 *   band text not null default '',
 *   song text not null default '',
 *   pinned boolean not null default false,
 *   roosted boolean not null default false,
 *   caged boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_presence_hide (
 *   shelf text primary key
 * );
 */

export const PERCH_KEY = "crmv4-aviary-perches";
export const PERCH_VIEW_KEY = "crmv4-aviary-views";
export const WATCH_KEY = "crmv4-presence-hide";

export type PerchSong = "blank" | "hush" | "call" | "chorus";

export type PerchPlumage = "blank" | "dove" | "crow" | "jay" | "wren";

export type PerchTray = "open" | "roosted" | "caged";

export type LoftPick = "blank" | "low" | "mid" | "high" | "near" | "far";

export type PerchCard = {
  id: string;
  text: string;
  keeper: string;
  perch: number | null;
  plumage: string;
  band: string;
  song: string;
  pinned: boolean;
  roosted: boolean;
  caged: boolean;
  audit: string;
};

export type PerchView = {
  id: string;
  name: string;
  tray: PerchTray;
  query: string;
  keeper: string;
  plumage: string;
  band: string;
  song: string;
  perch: string;
};

export type PerchCounts = {
  open: number;
  roosted: number;
  caged: number;
  pinned: number;
  late: number;
};

export type WatchShelf = "" | "night" | "morning" | "afternoon" | "evening";

export type WatchSpan = "" | "short" | "mid" | "long";

export type WatchFold = "" | "early" | "late" | "rest";

export type WatchQuiet = "" | "quiet" | "day";

export type WatchValue =
  | {
      lastSeenAt?: unknown;
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
      lastCountryName?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type WatchRow = { lastSeenAt?: WatchValue; label?: string | null };

export type ShelfLine = { shelf: string; count: number };

export type WatchSpanLine = { span: string; count: number };

export type WatchFoldLine = { fold: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "roost", "wake", "cage", "uncage"] as const;

const PLUMAGES = ["dove", "crow", "jay", "wren"] as const;

const SONGS = ["hush", "call", "chorus"] as const;

const SONG_ORDER = ["", "hush", "call", "chorus"] as const;

const PICKS = ["blank", "low", "mid", "high", "near", "far"] as const;

const LOFTS = ["low", "mid", "high"] as const;

const SHELVES = ["night", "morning", "afternoon", "evening"] as const;

const SPANS = ["", "short", "mid", "long"] as const;

const FOLDS = ["", "early", "late", "rest"] as const;

const WATCH_BLOCK = ["timezone", "language", "country", "name", "email", "phone", "desk", "address", "city", "firstName", "lastName", "lastCountryName"] as const;

const STAMP = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): PerchTray {
  return raw === "roosted" || raw === "caged" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function plumageName(raw: unknown): Exclude<PerchPlumage, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PLUMAGES as readonly string[]).includes(text) ? (text as Exclude<PerchPlumage, "blank">) : "";
}

function songName(raw: unknown): Exclude<PerchSong, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SONGS as readonly string[]).includes(text) ? (text as Exclude<PerchSong, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function perchText(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank band stays blank. It is not filled in. */
export function perchBand(raw: unknown): string {
  return clip(raw, 10);
}

/**
 * A perch is 1 through 18.
 * A blank value stays unset. 0 and 19 are not perches.
 * A leading zero is still a perch: 01 is 1, and 09 is 9.
 * 00 is not a perch.
 */
export function perchOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 18) return raw;
  if (typeof raw === "string" && /^(?:0?[1-9]|1[0-8])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Dove, crow, jay, wren, or blank. Anything else is blank. */
export function plumageOf(raw: unknown): PerchPlumage {
  return plumageName(raw) || "blank";
}

/** Hush, call, chorus, or blank. Anything else is blank. */
export function songOf(raw: unknown): PerchSong {
  return songName(raw) || "blank";
}

/** Low is 1–6. Mid is 7–12. High is 13–18. An unset perch is blank. */
export function loftOf(perch: unknown): "blank" | "low" | "mid" | "high" {
  const count = perchOf(perch);
  if (count === null) return "blank";
  if (count <= 6) return "low";
  if (count <= 12) return "mid";
  return "high";
}

/** Near is 1–9. Far is 10–18. An unset perch is blank. */
export function wingOf(perch: unknown): "blank" | "near" | "far" {
  const count = perchOf(perch);
  if (count === null) return "blank";
  return count <= 9 ? "near" : "far";
}

/** The typed perch minus the slip perch. A positive gap is past the perch. */
export function perchGap(perch: unknown, desk: unknown): number | null {
  const from = perchOf(perch);
  const at = perchOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readPerches(raw: unknown): PerchCard[] {
  if (!Array.isArray(raw)) return [];
  const out: PerchCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PerchCard>;
    const id = String(row.id || "").trim();
    const text = perchText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      keeper: keeperLabel(row.keeper),
      perch: perchOf(row.perch),
      plumage: plumageName(row.plumage),
      band: perchBand(row.band),
      song: songName(row.song),
      pinned: row.pinned === true,
      roosted: row.roosted === true,
      caged: row.caged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 12);
}

export function addPerch(
  cards: readonly PerchCard[],
  card: { id: string; text: string; keeper?: string; perch?: unknown; plumage?: string; band?: string; song?: string },
): PerchCard[] {
  const current = readPerches(cards);
  const id = String(card.id || "").trim();
  const text = perchText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: PerchCard = {
    id,
    text,
    keeper: keeperLabel(card.keeper),
    perch: perchOf(card.perch),
    plumage: plumageName(card.plumage),
    band: perchBand(card.band),
    song: songName(card.song),
    pinned: false,
    roosted: false,
    caged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 12);
}

export function stepPerchSong(cards: readonly PerchCard[], id: string, dir: 1 | -1): PerchCard[] {
  return readPerches(cards).map((card) => {
    if (card.id !== id) return card;
    const at = SONG_ORDER.indexOf(card.song as (typeof SONG_ORDER)[number]);
    const next = SONG_ORDER[Math.min(SONGS.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.song) return card;
    return { ...card, song: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setPerchPinned(cards: readonly PerchCard[], id: string, pinned: boolean): PerchCard[] {
  return readPerches(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setPerchRoosted(cards: readonly PerchCard[], id: string, roosted: boolean): PerchCard[] {
  return readPerches(cards).map((card) => (card.id === id ? { ...card, roosted, audit: roosted ? "roost" : "wake" } : card));
}

export function setPerchCaged(cards: readonly PerchCard[], id: string, caged: boolean): PerchCard[] {
  return readPerches(cards).map((card) => (card.id === id ? { ...card, caged, audit: caged ? "cage" : "uncage" } : card));
}

/** A blank edit is left out. A duplicate of another perch is left out. */
export function editPerch(cards: readonly PerchCard[], id: string, text: string): PerchCard[] {
  const current = readPerches(cards);
  const next = perchText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkPerchPinned(cards: readonly PerchCard[], ids: readonly string[], pinned: boolean): PerchCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readPerches(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkPerchCaged(cards: readonly PerchCard[], ids: readonly string[], caged: boolean): PerchCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readPerches(cards).map((card) => (want.has(card.id) ? { ...card, caged, audit: caged ? "cage" : "uncage" } : card));
}

export function resetPerches(): PerchCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function perchCopy(raw: unknown): string {
  return perchText(raw);
}

function inTray(card: PerchCard, tray: PerchTray): boolean {
  if (tray === "caged") return card.caged;
  if (tray === "roosted") return card.roosted && !card.caged;
  return !card.roosted && !card.caged;
}

function perchHit(perch: number | null, exact: number | null, band: LoftPick | null): boolean {
  if (exact !== null) return perch === exact;
  if (band === null) return true;
  if (band === "blank") return perch === null;
  if (band === "near" || band === "far") return wingOf(perch) === band;
  return loftOf(perch) === band;
}

function songScore(song: string): number {
  if (song === "chorus") return 3;
  if (song === "call") return 2;
  if (song === "hush") return 1;
  return 0;
}

function hushLate(card: PerchCard, desk: unknown): boolean {
  const gap = perchGap(card.perch, desk);
  return gap !== null && gap > 0 && card.song === "hush" && inTray(card, "open");
}

/** Search stays on the note. The keeper, the perch, the plumage, the band, and the song are not part of the query. */
export function visiblePerches(
  cards: readonly PerchCard[],
  tray: PerchTray,
  query: string,
  keeper: string | null,
  plumage: PerchPlumage | null,
  band: string | null,
  song: PerchSong | null,
  exact: number | null,
  loft: LoftPick | null,
  chorusOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): PerchCard[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = keeper === null ? null : keeperLabel(keeper);
  const wantBand = band === null ? null : perchBand(band);
  return readPerches(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (chorusOnly && card.song !== "chorus") return false;
      if (wantKeeper !== null && keeperLabel(card.keeper) !== wantKeeper) return false;
      if (plumage !== null && plumageOf(card.plumage) !== plumage) return false;
      if (wantBand !== null && perchBand(card.band) !== wantBand) return false;
      if (song !== null && songOf(card.song) !== song) return false;
      if (!perchHit(card.perch, exact, loft)) return false;
      if (lateOnly && !hushLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (songScore(a.song) !== songScore(b.song)) return songScore(b.song) - songScore(a.song);
      return a.text.localeCompare(b.text);
    });
}

/** The perch orders the desk. An unset perch stays at the end. Search stays on the note. */
export function perchTimeline(cards: readonly PerchCard[], query: string): PerchCard[] {
  const text = query.trim().toLowerCase();
  return readPerches(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.perch === null && b.perch !== null) return 1;
      if (a.perch !== null && b.perch === null) return -1;
      if (a.perch !== null && b.perch !== null && a.perch !== b.perch) return a.perch - b.perch;
      return a.text.localeCompare(b.text);
    });
}

export function perchCounts(cards: readonly PerchCard[], desk: unknown): PerchCounts {
  const rows = readPerches(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    roosted: rows.filter((card) => inTray(card, "roosted")).length,
    caged: rows.filter((card) => inTray(card, "caged")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => hushLate(card, desk)).length,
  };
}

/** Share of the saved perches. A zero total stays at zero. */
export function perchShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function perchKeepers(cards: readonly PerchCard[]): string[] {
  const out: string[] = [];
  for (const card of readPerches(cards)) {
    if (card.keeper && !out.includes(card.keeper)) out.push(card.keeper);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function perchBands(cards: readonly PerchCard[]): string[] {
  const out: string[] = [];
  for (const card of readPerches(cards)) {
    if (card.band && !out.includes(card.band)) out.push(card.band);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function perchPlumages(cards: readonly PerchCard[]): Exclude<PerchPlumage, "blank">[] {
  const seen = new Set<string>();
  for (const card of readPerches(cards)) if (card.plumage) seen.add(card.plumage);
  return PLUMAGES.filter((plumage) => seen.has(plumage));
}

export function perchSongs(cards: readonly PerchCard[]): Exclude<PerchSong, "blank">[] {
  const seen = new Set<string>();
  for (const card of readPerches(cards)) if (card.song) seen.add(card.song);
  return SONGS.filter((song) => seen.has(song));
}

/** Three lofts. Index 0 is low. Index 2 is high. */
export function loftCounts(cards: readonly PerchCard[]): number[] {
  const rows = readPerches(cards);
  return LOFTS.map((band) => rows.filter((card) => loftOf(card.perch) === band).length);
}

/** "all" and "blank" stay. A keeper that is no longer on a perch falls back to all. */
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

/** "all" and "blank" stay. A plumage that is no longer on a perch falls back to all. */
export function activePlumage(filter: string, plumages: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const plumage = plumageName(filter);
  return plumage && plumages.includes(plumage) ? plumage : "all";
}

export function plumageArg(filter: string): PerchPlumage | null {
  if (filter === "blank") return "blank";
  return plumageName(filter) || null;
}

/** "all" and "blank" stay. A band that is no longer on a perch falls back to all. */
export function activeBand(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const band = perchBand(filter);
  return band && bands.includes(band) ? band : "all";
}

export function bandArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return perchBand(filter);
}

/** "all" and "blank" stay. A song that is no longer on a perch falls back to all. */
export function activeSong(filter: string, songs: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const song = songName(filter);
  return song && songs.includes(song) ? song : "all";
}

export function songArg(filter: string): PerchSong | null {
  if (filter === "blank") return "blank";
  return songName(filter) || null;
}

/** All, blank, the three lofts, the two wings, and the perches 1 through 18 stay. Anything else is all. */
export function activePerch(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const perch = perchOf(filter);
  return perch === null ? "all" : String(perch);
}

export function perchArg(filter: string): { exact: number | null; band: LoftPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, band: filter as LoftPick };
  const perch = perchOf(filter);
  return perch === null ? { exact: null, band: null } : { exact: perch, band: null };
}

/** Other perches with the same plumage and the same band. A blank plumage or a blank band clashes with nothing. */
export function perchClashIds(cards: readonly PerchCard[], id: string): string[] {
  const rows = readPerches(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.plumage || !card.band) return [];
  return rows
    .filter((item) => item.id !== id && item.plumage === card.plumage && item.band === card.band)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** How many saved perches share a plumage and a band with another perch. */
export function clashPerchCount(cards: readonly PerchCard[]): number {
  const rows = readPerches(cards);
  return rows.filter((card) => perchClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open perch at or after the perch you type, skipping chorus.
 * After the last perch, the desk wraps to the earliest open perch that is not chorus.
 */
export function nextPerch(cards: readonly PerchCard[], desk: unknown): string {
  const now = perchOf(desk);
  if (now === null) return "";
  const waiting = readPerches(cards).filter((card) => inTray(card, "open") && card.perch !== null && card.song !== "chorus");
  if (!waiting.length) return "";
  const byPerch = (a: PerchCard, b: PerchCard) => (a.perch ?? 0) - (b.perch ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.perch ?? 0) >= now).sort(byPerch);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byPerch)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the perches saved in this browser. The gap uses the perch you pass. */
export function perchesCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,keeper,perch,plumage,band,song,loft,pinned,roosted,caged,gap,audit"];
  for (const card of readPerches(raw)) {
    const gap = perchGap(card.perch, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.keeper),
      card.perch === null ? "" : String(card.perch),
      card.plumage,
      csvCell(card.band),
      card.song,
      loftOf(card.perch),
      card.pinned ? "1" : "0",
      card.roosted ? "1" : "0",
      card.caged ? "1" : "0",
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

function plumageSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return plumageName(raw) || "all";
}

function bandSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return perchBand(raw) || "all";
}

function songSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return songName(raw) || "all";
}

export function readPerchViews(raw: unknown): PerchView[] {
  if (!Array.isArray(raw)) return [];
  const out: PerchView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PerchView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 48),
      keeper: keeperSlot(row.keeper),
      plumage: plumageSlot(row.plumage),
      band: bandSlot(row.band),
      song: songSlot(row.song),
      perch: activePerch(String(row.perch ?? "")),
    });
  }
  return out.slice(0, 4);
}

export function addPerchView(
  views: readonly PerchView[],
  view: { id: string; name: string; tray: PerchTray; query: string; keeper: string; plumage: string; band: string; song: string; perch: string },
): PerchView[] {
  const current = readPerchViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 48),
    keeper: keeperSlot(view.keeper),
    plumage: plumageSlot(view.plumage),
    band: bandSlot(view.band),
    song: songSlot(view.song),
    perch: activePerch(view.perch),
  }].slice(0, 4);
}

export function dropPerchView(views: readonly PerchView[], id: string): PerchView[] {
  return readPerchViews(views).filter((view) => view.id !== id);
}

function hourOfStamp(raw: unknown): number | null {
  const text = clip(raw, 40);
  if (!STAMP.test(text)) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const hour = new Date(at).getUTCHours();
  return hour >= 0 && hour <= 23 ? hour : null;
}

function resolvedHour(value: WatchValue): number | null {
  if (typeof value === "string") return hourOfStamp(value);
  if (!value || typeof value !== "object" || typeof value === "boolean") return null;
  if (WATCH_BLOCK.some((key) => key in value)) return null;
  return hourOfStamp(value.lastSeenAt);
}

function hourLabel(hour: number | null): string {
  return hour === null ? "" : String(hour).padStart(2, "0");
}

/**
 * A last-seen hour from the last-seen field, or blank.
 * A timezone, a language, a country, a name, an email, a phone, a desk, an address, a city,
 * a given name, a family name, and a last country are not a watch.
 * A missing last-seen time stays unmarked and is not filled in.
 */
export function assignedWatch(value: WatchValue): string {
  return hourLabel(resolvedHour(value));
}

/** Night is 00–05. Morning is 06–11. Afternoon is 12–17. Evening is 18–23. An unmarked time stays blank. */
export function shelfOf(value: WatchValue): WatchShelf {
  const hour = resolvedHour(value);
  if (hour === null) return "";
  if (hour <= 5) return "night";
  if (hour <= 11) return "morning";
  if (hour <= 17) return "afternoon";
  return "evening";
}

/** Short is hours 00–07. Mid is 08–15. Long is 16–23. An unmarked time stays blank. */
export function spanOf(value: WatchValue): WatchSpan {
  const hour = resolvedHour(value);
  if (hour === null) return "";
  if (hour <= 7) return "short";
  if (hour <= 15) return "mid";
  return "long";
}

/** Early is Monday through Wednesday. Late is Thursday through Saturday. Rest is Sunday. An unmarked time stays blank. */
export function foldOf(value: WatchValue): WatchFold {
  if (resolvedHour(value) === null) return "";
  const text = typeof value === "string" ? value : (!value || typeof value !== "object" ? "" : String(value.lastSeenAt ?? ""));
  const stamp = clip(text, 40);
  if (!STAMP.test(stamp)) return "";
  const at = Date.parse(stamp);
  if (!Number.isFinite(at)) return "";
  const day = new Date(at).getUTCDay();
  if (day === 0) return "rest";
  if (day <= 3) return "early";
  return "late";
}

/** Quiet is 22, 23, and 00–05. The rest of a marked hour is day. An unmarked time stays blank. */
export function quietOf(value: WatchValue): WatchQuiet {
  const hour = resolvedHour(value);
  if (hour === null) return "";
  return hour >= 22 || hour <= 5 ? "quiet" : "day";
}

export function shelfLines(rows: readonly WatchRow[]): ShelfLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const shelf = shelfOf(row.lastSeenAt);
    map.set(shelf, (map.get(shelf) || 0) + 1);
  }
  const out: ShelfLine[] = [];
  for (const shelf of ["", ...SHELVES]) {
    const count = map.get(shelf);
    if (count) out.push({ shelf, count });
  }
  return out;
}

export function namedShelves(rows: readonly WatchRow[]): string[] {
  return shelfLines(rows).map((line) => line.shelf).filter(Boolean);
}

export function spanLines(rows: readonly WatchRow[]): WatchSpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = spanOf(row.lastSeenAt);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: WatchSpanLine[] = [];
  for (const span of SPANS) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly WatchRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

export function foldLines(rows: readonly WatchRow[]): WatchFoldLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const fold = foldOf(row.lastSeenAt);
    map.set(fold, (map.get(fold) || 0) + 1);
  }
  const out: WatchFoldLine[] = [];
  for (const fold of FOLDS) {
    const count = map.get(fold);
    if (count) out.push({ fold, count });
  }
  return out;
}

export function namedFolds(rows: readonly WatchRow[]): string[] {
  return foldLines(rows).map((line) => line.fold).filter(Boolean);
}

/** The shelf with the most loaded rows. A tie keeps the earlier shelf. An unmarked time is not a lead. */
export function leadingShelf(rows: readonly WatchRow[]): string {
  const named = shelfLines(rows).filter((line) => line.shelf);
  if (!named.length) return "";
  const order = (shelf: string) => SHELVES.indexOf(shelf as (typeof SHELVES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.shelf) - order(b.shelf))[0].shelf;
}

/** The named fold with the most loaded rows. A tie keeps the earlier fold. A blank fold is not a lead. */
export function leadingFold(rows: readonly WatchRow[]): string {
  const named = foldLines(rows).filter((line) => line.fold);
  if (!named.length) return "";
  const order = (fold: string) => FOLDS.indexOf(fold as (typeof FOLDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.fold) - order(b.fold))[0].fold;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function watchShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenShelves(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = clip(item, 16).toLowerCase();
    if (!(SHELVES as readonly string[]).includes(mark) || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleShelf(hidden: readonly string[], shelf: string, present: readonly string[]): string[] {
  const mark = (SHELVES as readonly string[]).includes(shelf) ? shelf : shelfOf(shelf);
  if (!mark || !present.includes(mark)) return readHiddenShelves(hidden, present);
  const current = readHiddenShelves(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleShelves(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenShelves(hidden, present));
  return present.filter((shelf) => (showHidden ? gone.has(shelf) : !gone.has(shelf)));
}

/** "all" and "blank" stay. A shelf that is no longer loaded falls back to all. */
export function activeShelf(filter: string, shelves: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const shelf = (SHELVES as readonly string[]).includes(filter) ? filter : shelfOf(filter);
  return shelf && shelves.includes(shelf) ? shelf : "all";
}

export function shelfArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (SHELVES as readonly string[]).includes(filter) ? filter : null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SPANS as readonly string[]).includes(filter) && spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): WatchSpan | null {
  if (filter === "blank") return "";
  if ((SPANS as readonly string[]).includes(filter) && filter !== "") return filter as WatchSpan;
  return null;
}

/** "all" and "blank" stay. A fold that is no longer loaded falls back to all. */
export function activeFold(filter: string, folds: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (FOLDS as readonly string[]).includes(filter) && folds.includes(filter) ? filter : "all";
}

export function foldArg(filter: string): WatchFold | null {
  if (filter === "blank") return "";
  if ((FOLDS as readonly string[]).includes(filter) && filter !== "") return filter as WatchFold;
  return null;
}

/** Search stays on the name. The last-seen hour is not part of the query. */
export function visibleWatchCustomers<T extends WatchRow>(
  rows: readonly T[],
  shelf: string | null,
  fold: WatchFold | null,
  span: WatchSpan | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (shelf !== null && shelfOf(row.lastSeenAt) !== shelf) return false;
    if (fold !== null && foldOf(row.lastSeenAt) !== fold) return false;
    if (span !== null && spanOf(row.lastSeenAt) !== span) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the shelves, spans, folds, and quiet hours on this page. */
export function watchesCsv(rows: readonly WatchRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of shelfLines(rows)) lines.push(["shelf", csvCell(line.shelf), String(line.count)].join(","));
  for (const line of spanLines(rows)) lines.push(["span", line.span, String(line.count)].join(","));
  for (const line of foldLines(rows)) lines.push(["fold", line.fold, String(line.count)].join(","));
  let quiet = 0;
  let day = 0;
  for (const row of rows) {
    const mark = quietOf(row.lastSeenAt);
    if (mark === "quiet") quiet += 1;
    if (mark === "day") day += 1;
  }
  if (quiet) lines.push(["quiet", "quiet", String(quiet)].join(","));
  if (day) lines.push(["quiet", "day", String(day)].join(","));
  return lines.join("\n");
}
