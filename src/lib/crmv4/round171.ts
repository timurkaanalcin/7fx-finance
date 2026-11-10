/**
 * Local choir stalls for the rehearsal desk, and the last-seen age already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_choir_stall (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   singer text not null default '',
 *   verse integer,
 *   voice text not null default '',
 *   part text not null default '',
 *   ink text not null default '',
 *   rank integer,
 *   pulse integer,
 *   pinned boolean not null default false,
 *   voiced boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_ember_hide (
 *   band text primary key
 * );
 */

export const STALL_KEY = "crmv4-choir-stalls";
export const STALL_VIEW_KEY = "crmv4-choir-views";
export const EMBER_KEY = "crmv4-ember-hide";

export type StallInk = "blank" | "dry" | "wet" | "gloss";

export type StallVoice = "blank" | "soprano" | "alto" | "tenor" | "bass";

export type StallTray = "open" | "voiced" | "filed";

export type VersePick = "blank" | "low" | "mid" | "high" | "end" | "body";

export type Stall = {
  id: string;
  title: string;
  note: string;
  singer: string;
  verse: number | null;
  voice: string;
  part: string;
  ink: string;
  rank: number | null;
  pulse: number | null;
  pinned: boolean;
  voiced: boolean;
  filed: boolean;
  audit: string;
};

export type StallView = {
  id: string;
  name: string;
  tray: StallTray;
  query: string;
  singer: string;
  voice: string;
  part: string;
  ink: string;
  verse: string;
  rank: string;
  pulse: string;
};

export type StallCounts = {
  open: number;
  voiced: number;
  filed: number;
  pinned: number;
  end: number;
  late: number;
};

export type EmberState = "" | "set" | "clear";

export type EmberBand = "" | "live" | "day" | "week" | "quiet";

export type EmberDepth = "" | "near" | "mid" | "far";

export type EmberValue =
  | {
      lastSeenAt?: unknown;
      loginBlockedAt?: unknown;
      loginBlockedMessage?: unknown;
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
      withdrawalsEnabled?: unknown;
      isTest?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      country?: unknown;
      desk?: unknown;
    }
  | string
  | null
  | undefined;

export type EmberRow = { at?: EmberValue; label?: string | null };

export type BandLine = { band: string; count: number };

export type DepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "ink", "pin", "unpin", "voice", "hush", "file", "reopen", "move"] as const;

const VOICES = ["soprano", "alto", "tenor", "bass"] as const;

const INKS = ["dry", "wet", "gloss"] as const;

const INK_ORDER = ["", "dry", "wet", "gloss"] as const;

const PICKS = ["blank", "low", "mid", "high", "end", "body"] as const;

const BANDS = ["low", "mid", "high"] as const;

const ENDS = new Set([1, 12]);

const RANKS = [1, 2, 3, 4] as const;

const PULSES = [2, 3, 4, 6] as const;

const EMBER_BANDS = ["live", "day", "week", "quiet"] as const;

const DEPTHS = ["near", "mid", "far"] as const;

const STATES = ["set", "clear"] as const;

const EMBER_BLOCK = [
  "loginBlockedAt",
  "loginBlockedMessage",
  "loginEnabled",
  "tradingEnabled",
  "withdrawalsEnabled",
  "isTest",
  "name",
  "email",
  "phone",
  "country",
  "desk",
  "saleStatus",
  "retentionStatus",
  "potentialStatus",
  "documentsStatus",
  "accountType",
  "validationStatus",
  "registrationDate",
  "birthDate",
  "lastContactAt",
] as const;

const STALL_CAP = 8;

const VIEW_CAP = 5;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): StallTray {
  return raw === "voiced" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function voiceName(raw: unknown): Exclude<StallVoice, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (VOICES as readonly string[]).includes(text) ? (text as Exclude<StallVoice, "blank">) : "";
}

function inkName(raw: unknown): Exclude<StallInk, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<StallInk, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function stallLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function stallNote(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank singer stays blank. It is not filled in. */
export function singerLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank part stays blank. It is not filled in. */
export function stallPart(raw: unknown): string {
  return clip(raw, 4);
}

/**
 * A verse is an integer from 1 through 12.
 * A blank value stays unset. 0 and 13 are not verses.
 * A leading zero is the same verse: 01 is 1, and 09 is 9.
 */
export function verseOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 12) return raw;
  if (typeof raw === "string" && /^(?:[1-9]|0[1-9]|1[0-2])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A rank is an integer from 1 through 4.
 * A blank value stays unset. 0 and 5 are not ranks.
 * A leading zero is the same rank: 01 is 1.
 */
export function rankOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && (RANKS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:[1-4]|0[1-4])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A pulse is 2, 3, 4, or 6. A blank value stays unset. A leading zero is not a pulse. */
export function pulseOf(raw: unknown): number | null {
  if (typeof raw === "number" && (PULSES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:2|3|4|6)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Soprano, alto, tenor, bass, or blank. Anything else is blank. */
export function voiceOf(raw: unknown): StallVoice {
  return voiceName(raw) || "blank";
}

/** Dry, wet, gloss, or blank. Anything else is blank. */
export function inkOf(raw: unknown): StallInk {
  return inkName(raw) || "blank";
}

/** Low is 1–4. Mid is 5–8. High is 9–12. An unset verse is blank. */
export function verseBand(verse: unknown): "blank" | "low" | "mid" | "high" {
  const value = verseOf(verse);
  if (value === null) return "blank";
  if (value <= 4) return "low";
  if (value <= 8) return "mid";
  return "high";
}

/** End verses are 1 and 12. An unset verse is not an end. */
export function endVerse(verse: unknown): boolean {
  const value = verseOf(verse);
  return value !== null && ENDS.has(value);
}

/** Body verses are 2 through 11. An unset verse is not body. */
export function bodyVerse(verse: unknown): boolean {
  const value = verseOf(verse);
  return value !== null && !ENDS.has(value);
}

/**
 * The shortest signed step from the stall verse to the typed verse.
 * The book wraps at 12. A step of 6 stays positive. A step of -6 becomes 6.
 * A positive step means the typed verse is ahead of the stall.
 */
export function verseGap(verse: unknown, desk: unknown): number | null {
  const from = verseOf(verse);
  const at = verseOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 6) diff -= 12;
  if (diff < -5) diff += 12;
  return diff;
}

export function readStalls(raw: unknown): Stall[] {
  if (!Array.isArray(raw)) return [];
  const out: Stall[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Stall>;
    const id = String(row.id || "").trim();
    const title = stallLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: stallNote(row.note),
      singer: singerLabel(row.singer),
      verse: verseOf(row.verse),
      voice: voiceName(row.voice),
      part: stallPart(row.part),
      ink: inkName(row.ink),
      rank: rankOf(row.rank),
      pulse: pulseOf(row.pulse),
      pinned: row.pinned === true,
      voiced: row.voiced === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, STALL_CAP);
}

export function addStall(
  cards: readonly Stall[],
  card: {
    id: string;
    title: string;
    note?: string;
    singer?: string;
    verse?: unknown;
    voice?: string;
    part?: string;
    ink?: string;
    rank?: unknown;
    pulse?: unknown;
  },
): Stall[] {
  const current = readStalls(cards);
  const id = String(card.id || "").trim();
  const title = stallLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Stall = {
    id,
    title,
    note: stallNote(card.note),
    singer: singerLabel(card.singer),
    verse: verseOf(card.verse),
    voice: voiceName(card.voice),
    part: stallPart(card.part),
    ink: inkName(card.ink),
    rank: rankOf(card.rank),
    pulse: pulseOf(card.pulse),
    pinned: false,
    voiced: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, STALL_CAP);
}

/** Blank becomes dry. Dry becomes wet, wet becomes gloss, and gloss returns to dry. */
export function cycleInk(cards: readonly Stall[], id: string): Stall[] {
  return readStalls(cards).map((card) => {
    if (card.id !== id) return card;
    const at = INK_ORDER.indexOf(card.ink as (typeof INK_ORDER)[number]);
    const next = at < 0 || at >= INKS.length ? INKS[0] : INKS[at % INKS.length];
    if (!next || next === card.ink) return card;
    return { ...card, ink: next, audit: "ink" };
  });
}

export function setStallPin(cards: readonly Stall[], id: string, pinned: boolean): Stall[] {
  return readStalls(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setStallVoice(cards: readonly Stall[], id: string, voiced: boolean): Stall[] {
  return readStalls(cards).map((card) => (card.id === id ? { ...card, voiced, audit: voiced ? "voice" : "hush" } : card));
}

export function setStallFiled(cards: readonly Stall[], id: string, filed: boolean): Stall[] {
  return readStalls(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editStall(cards: readonly Stall[], id: string, title: string): Stall[] {
  const current = readStalls(cards);
  const next = stallLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editStallNote(cards: readonly Stall[], id: string, note: string): Stall[] {
  const current = readStalls(cards);
  const next = stallNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkStallPin(cards: readonly Stall[], ids: readonly string[], pinned: boolean): Stall[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readStalls(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkStallFile(cards: readonly Stall[], ids: readonly string[], filed: boolean): Stall[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readStalls(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank or unknown voice is left out. A stall already in that voice is left as it is. */
export function bulkStallVoice(cards: readonly Stall[], ids: readonly string[], voice: string): Stall[] {
  const name = voiceName(voice);
  const current = readStalls(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.voice !== name ? { ...card, voice: name, audit: "move" } : card));
}

export function resetStalls(): Stall[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function stallCopy(raw: unknown): string {
  return stallLine(raw);
}

function inTray(card: Stall, tray: StallTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "voiced") return card.voiced && !card.filed;
  return !card.voiced && !card.filed;
}

function verseHit(verse: number | null, exact: number | null, pick: VersePick | null): boolean {
  if (exact !== null) return verse === exact;
  if (pick === null) return true;
  if (pick === "blank") return verse === null;
  if (pick === "end") return endVerse(verse);
  if (pick === "body") return bodyVerse(verse);
  return verseBand(verse) === pick;
}

function inkScore(ink: string): number {
  if (ink === "gloss") return 3;
  if (ink === "wet") return 2;
  if (ink === "dry") return 1;
  return 0;
}

function waitingEnd(card: Stall): boolean {
  return endVerse(card.verse) && inTray(card, "open");
}

function haystack(card: Stall): string {
  return `${card.title}\n${card.note}\n${card.part}`.toLowerCase();
}

/** An open stall is late when the desk verse is more than three verses ahead. */
export function lateStall(card: Stall, desk: unknown): boolean {
  const gap = verseGap(card.verse, desk);
  return inTray(card, "open") && gap !== null && gap > 3;
}

/** Search matches the title, the note, and the part. The singer, the verse, and the voice are not part of the query. */
export function visibleStalls(
  cards: readonly Stall[],
  tray: StallTray,
  query: string,
  singer: string | null,
  voice: StallVoice | null,
  part: string | null,
  ink: StallInk | null,
  exact: number | null,
  pick: VersePick | null,
  rank: number | "blank" | null,
  pulse: number | "blank" | null,
  glossOnly: boolean,
  endOnly: boolean,
): Stall[] {
  const text = query.trim().toLowerCase();
  const wantSinger = singer === null ? null : singerLabel(singer);
  const wantPart = part === null ? null : stallPart(part);
  return readStalls(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (glossOnly && card.ink !== "gloss") return false;
      if (wantSinger !== null && singerLabel(card.singer) !== wantSinger) return false;
      if (voice !== null && voiceOf(card.voice) !== voice) return false;
      if (wantPart !== null && stallPart(card.part) !== wantPart) return false;
      if (ink !== null && inkOf(card.ink) !== ink) return false;
      if (!verseHit(card.verse, exact, pick)) return false;
      if (rank === "blank" && card.rank !== null) return false;
      if (typeof rank === "number" && card.rank !== rank) return false;
      if (pulse === "blank" && card.pulse !== null) return false;
      if (typeof pulse === "number" && card.pulse !== pulse) return false;
      if (endOnly && !waitingEnd(card)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (inkScore(a.ink) !== inkScore(b.ink)) return inkScore(b.ink) - inkScore(a.ink);
      return a.title.localeCompare(b.title);
    });
}

/** The verse orders the book. An unset verse stays at the end. Search matches the title, the note, and the part. */
export function stallTimeline(cards: readonly Stall[], query: string): Stall[] {
  const text = query.trim().toLowerCase();
  return readStalls(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.verse === null && b.verse !== null) return 1;
      if (a.verse !== null && b.verse === null) return -1;
      if (a.verse !== null && b.verse !== null && a.verse !== b.verse) return a.verse - b.verse;
      return a.title.localeCompare(b.title);
    });
}

export function stallCounts(cards: readonly Stall[], desk: unknown): StallCounts {
  const rows = readStalls(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    voiced: rows.filter((card) => inTray(card, "voiced")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    end: rows.filter((card) => waitingEnd(card)).length,
    late: rows.filter((card) => lateStall(card, desk)).length,
  };
}

/** Share of the saved stalls. A zero total stays at zero. */
export function stallShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function stallSingers(cards: readonly Stall[]): string[] {
  const out: string[] = [];
  for (const card of readStalls(cards)) {
    if (card.singer && !out.includes(card.singer)) out.push(card.singer);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function stallParts(cards: readonly Stall[]): string[] {
  const out: string[] = [];
  for (const card of readStalls(cards)) {
    if (card.part && !out.includes(card.part)) out.push(card.part);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function stallVoices(cards: readonly Stall[]): Exclude<StallVoice, "blank">[] {
  const seen = new Set<string>();
  for (const card of readStalls(cards)) if (card.voice) seen.add(card.voice);
  return VOICES.filter((voice) => seen.has(voice));
}

export function stallInks(cards: readonly Stall[]): Exclude<StallInk, "blank">[] {
  const seen = new Set<string>();
  for (const card of readStalls(cards)) if (card.ink) seen.add(card.ink);
  return INKS.filter((ink) => seen.has(ink));
}

/** How many open stalls a singer still holds. A blank singer is not a load. */
export function singerLoad(cards: readonly Stall[], singer: string): number {
  const name = singerLabel(singer);
  if (!name) return 0;
  return readStalls(cards).filter((card) => card.singer === name && inTray(card, "open")).length;
}

/** Four voices. Index 0 is soprano. Index 3 is bass. */
export function voiceCounts(cards: readonly Stall[]): number[] {
  const rows = readStalls(cards);
  return VOICES.map((voice) => rows.filter((card) => voiceOf(card.voice) === voice).length);
}

/** "all" and "blank" stay. A singer that is no longer on a stall falls back to all. */
export function activeSinger(filter: string, singers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const singer = singerLabel(filter);
  return singer && singers.includes(singer) ? singer : "all";
}

export function singerArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return singerLabel(filter);
}

/** "all" and "blank" stay. A voice that is no longer on a stall falls back to all. */
export function activeVoice(filter: string, voices: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const voice = voiceName(filter);
  return voice && voices.includes(voice) ? voice : "all";
}

export function voiceArg(filter: string): StallVoice | null {
  if (filter === "blank") return "blank";
  return voiceName(filter) || null;
}

/** "all" and "blank" stay. A part that is no longer on a stall falls back to all. */
export function activePart(filter: string, parts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const part = stallPart(filter);
  return part && parts.includes(part) ? part : "all";
}

export function partArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return stallPart(filter);
}

/** "all" and "blank" stay. An ink that is no longer on a stall falls back to all. */
export function activeInk(filter: string, inks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ink = inkName(filter);
  return ink && inks.includes(ink) ? ink : "all";
}

export function inkArg(filter: string): StallInk | null {
  if (filter === "blank") return "blank";
  return inkName(filter) || null;
}

/** All, blank, the bands, end, body, and the verses 1 through 12 stay. Anything else is all. */
export function activeVerse(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const verse = verseOf(filter);
  return verse === null ? "all" : String(verse);
}

export function verseArg(filter: string): { exact: number | null; pick: VersePick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as VersePick };
  const verse = verseOf(filter);
  return verse === null ? { exact: null, pick: null } : { exact: verse, pick: null };
}

/** All, blank, and the ranks 1 through 4 stay. Anything else is all. */
export function activeRank(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const rank = rankOf(filter);
  return rank === null ? "all" : String(rank);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

/** All, blank, and the pulses 2, 3, 4, and 6 stay. Anything else is all. */
export function activePulse(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const pulse = pulseOf(filter);
  return pulse === null ? "all" : String(pulse);
}

export function pulseArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return pulseOf(filter);
}

/** Other stalls with the same voice and the same verse. A blank voice or a blank verse clashes with nothing. */
export function stallClashIds(cards: readonly Stall[], id: string): string[] {
  const rows = readStalls(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.voice || card.verse === null) return [];
  return rows
    .filter((item) => item.id !== id && item.voice === card.voice && item.verse === card.verse)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved stalls share a voice and a verse with another stall. */
export function clashStallCount(cards: readonly Stall[]): number {
  const rows = readStalls(cards);
  return rows.filter((card) => stallClashIds(rows, card.id).length > 0).length;
}

/** Other stalls with the same voice and the same rank. A blank voice or a blank rank clashes with nothing. */
export function rankClashIds(cards: readonly Stall[], id: string): string[] {
  const rows = readStalls(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.voice || card.rank === null) return [];
  return rows
    .filter((item) => item.id !== id && item.voice === card.voice && item.rank === card.rank)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved stalls share a voice and a rank with another stall. */
export function rankClashCount(cards: readonly Stall[]): number {
  const rows = readStalls(cards);
  return rows.filter((card) => rankClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open stall at or after the verse you type, skipping gloss.
 * After 12, the book wraps to the earliest open stall that is not gloss.
 */
export function nextStall(cards: readonly Stall[], desk: unknown): string {
  const now = verseOf(desk);
  if (now === null) return "";
  const waiting = readStalls(cards).filter((card) => inTray(card, "open") && card.verse !== null && card.ink !== "gloss");
  if (!waiting.length) return "";
  const byVerse = (a: Stall, b: Stall) => (a.verse ?? 0) - (b.verse ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.verse ?? 0) >= now).sort(byVerse);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byVerse)[0].id;
}

/**
 * The voice with the fewest open stalls.
 * A tie keeps the earlier voice: soprano, then alto, tenor, and bass.
 * Stalls with no voice are not a load. An empty desk still suggests soprano.
 */
export function suggestVoice(cards: readonly Stall[]): Exclude<StallVoice, "blank"> {
  const rows = readStalls(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<StallVoice, "blank"> = "soprano";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const voice of VOICES) {
    const count = rows.filter((card) => card.voice === voice).length;
    if (count < bestCount) {
      best = voice;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The singer with the fewest open stalls.
 * A tie keeps the earlier name. A blank singer is not a candidate.
 * A desk with no named singer suggests nothing.
 */
export function suggestSinger(cards: readonly Stall[]): string {
  const rows = readStalls(cards).filter((card) => inTray(card, "open") && card.singer);
  const singers: string[] = [];
  for (const card of rows) {
    if (!singers.includes(card.singer)) singers.push(card.singer);
  }
  singers.sort((a, b) => a.localeCompare(b));
  if (!singers.length) return "";
  let best = singers[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const singer of singers) {
    const count = rows.filter((card) => card.singer === singer).length;
    if (count < bestCount) {
      best = singer;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the stalls saved in this browser. The gap and the late mark use the verse you pass. */
export function stallsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,singer,verse,voice,part,ink,rank,pulse,band,pinned,voiced,filed,gap,late,note,audit"];
  for (const card of readStalls(raw)) {
    const gap = verseGap(card.verse, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.singer),
      card.verse === null ? "" : String(card.verse),
      card.voice,
      csvCell(card.part),
      card.ink,
      card.rank === null ? "" : String(card.rank),
      card.pulse === null ? "" : String(card.pulse),
      verseBand(card.verse),
      card.pinned ? "1" : "0",
      card.voiced ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateStall(card, desk) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function singerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return singerLabel(raw) || "all";
}

function voiceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return voiceName(raw) || "all";
}

function partSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stallPart(raw) || "all";
}

function inkSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return inkName(raw) || "all";
}

export function readStallViews(raw: unknown): StallView[] {
  if (!Array.isArray(raw)) return [];
  const out: StallView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<StallView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      singer: singerSlot(row.singer),
      voice: voiceSlot(row.voice),
      part: partSlot(row.part),
      ink: inkSlot(row.ink),
      verse: activeVerse(String(row.verse ?? "")),
      rank: activeRank(String(row.rank ?? "")),
      pulse: activePulse(String(row.pulse ?? "")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addStallView(
  views: readonly StallView[],
  view: {
    id: string;
    name: string;
    tray: StallTray;
    query: string;
    singer: string;
    voice: string;
    part: string;
    ink: string;
    verse: string;
    rank: string;
    pulse: string;
  },
): StallView[] {
  const current = readStallViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    singer: singerSlot(view.singer),
    voice: voiceSlot(view.voice),
    part: partSlot(view.part),
    ink: inkSlot(view.ink),
    verse: activeVerse(view.verse),
    rank: activeRank(view.rank),
    pulse: activePulse(view.pulse),
  }].slice(0, VIEW_CAP);
}

export function dropStallView(views: readonly StallView[], id: string): StallView[] {
  return readStallViews(views).filter((view) => view.id !== id);
}

function clockParts(text: string): { hour: number; minute: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(text);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] ? Number(match[6]) : 0;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  if (Number.isNaN(Date.parse(text))) return null;
  return { hour, minute };
}

function emberBody(value: EmberValue): { iso: string; explicit: boolean } | null {
  if (typeof value === "string") {
    const text = clip(value, 40);
    if (!text) return { iso: "", explicit: true };
    const parts = clockParts(text);
    return parts ? { iso: text, explicit: true } : { iso: "", explicit: false };
  }
  if (!value || typeof value !== "object") return { iso: "", explicit: false };
  if (EMBER_BLOCK.some((key) => key in value)) return null;
  if (!("lastSeenAt" in value)) return { iso: "", explicit: false };
  const inner = value.lastSeenAt;
  if (inner === null) return { iso: "", explicit: true };
  if (typeof inner !== "string") return { iso: "", explicit: false };
  const text = clip(inner, 40);
  if (!text) return { iso: "", explicit: true };
  const parts = clockParts(text);
  return parts ? { iso: text, explicit: true } : { iso: "", explicit: false };
}

function momentMs(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const text = clip(raw, 40);
  if (!clockParts(text)) return null;
  const ms = Date.parse(text);
  return Number.isNaN(ms) ? null : ms;
}

/** Minutes from the last-seen time to now. A future of more than two minutes is left out. */
function ageMinutes(iso: string, now: unknown): number | null {
  const seen = momentMs(iso);
  const at = momentMs(now);
  if (seen === null || at === null) return null;
  const delta = at - seen;
  if (delta < -120000) return null;
  return delta / 60000;
}

/**
 * Set, clear, or unmarked.
 * A set time can be read as a clock. A clear time is an explicit blank. A missing field stays unmarked.
 * A login block, a name, and the other blocked fields are not a last-seen time.
 */
export function emberState(value: EmberValue): EmberState {
  const body = emberBody(value);
  if (!body) return "";
  if (body.iso) return "set";
  return body.explicit ? "clear" : "";
}

/**
 * Live is under 60 minutes. Day is under 24 hours. Week is under 7 days. Older is quiet.
 * A last-seen more than two minutes ahead of now stays unmarked. A blank time has no band.
 */
export function emberBand(value: EmberValue, now: unknown): EmberBand {
  const body = emberBody(value);
  if (!body?.iso) return "";
  const minutes = ageMinutes(body.iso, now);
  if (minutes === null) return "";
  if (minutes < 60) return "live";
  if (minutes < 1440) return "day";
  if (minutes < 10080) return "week";
  return "quiet";
}

/**
 * Near, mid, or far inside the band.
 * Live cuts at 15 and 40 minutes. Day cuts at 6 and 16 hours.
 * Week cuts at 2 and 5 days. Quiet cuts at 14 and 30 days.
 */
export function emberDepth(value: EmberValue, now: unknown): EmberDepth {
  const band = emberBand(value, now);
  const body = emberBody(value);
  if (!band || !body?.iso) return "";
  const minutes = ageMinutes(body.iso, now);
  if (minutes === null) return "";
  const cuts = band === "live" ? [15, 40] : band === "day" ? [360, 960] : band === "week" ? [2880, 7200] : [20160, 43200];
  if (minutes < cuts[0]) return "near";
  if (minutes < cuts[1]) return "mid";
  return "far";
}

export function bandLines(rows: readonly EmberRow[], now: unknown): BandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = emberState(row.at);
    const band = state === "set" ? emberBand(row.at, now) : "";
    const key = state === "clear" ? "" : band;
    if (state === "") continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  const out: BandLine[] = [];
  for (const band of ["", ...EMBER_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function depthLines(rows: readonly EmberRow[], now: unknown): DepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = emberDepth(row.at, now);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: DepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps live, then day, week, and quiet. An unmarked field is not a lead. */
export function leadingBand(rows: readonly EmberRow[], now: unknown): string {
  const named = bandLines(rows, now).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => EMBER_BANDS.indexOf(band as (typeof EMBER_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps near, then mid, then far. A blank time is not a lead. */
export function leadingDepth(rows: readonly EmberRow[], now: unknown): string {
  const named = depthLines(rows, now).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function emberShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((EMBER_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentBands(rows: readonly EmberRow[], now: unknown): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = emberState(row.at);
    const token = state === "set" ? emberBand(row.at, now) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenBands(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandToken(item);
    if (!band || !known.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleBand(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandToken(band);
  if (!token || !present.includes(token)) return readHiddenBands(hidden, present);
  const current = readHiddenBands(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenBands(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeBand(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (EMBER_BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function bandArg(filter: string): EmberBand | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (EMBER_BANDS as readonly string[]).includes(filter) ? (filter as EmberBand) : null;
}

/** "all" and "blank" stay. A depth that is no longer loaded falls back to all. */
export function activeDepth(filter: string, depths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (DEPTHS as readonly string[]).includes(filter) && depths.includes(filter) ? filter : "all";
}

export function depthArg(filter: string): EmberDepth | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (DEPTHS as readonly string[]).includes(filter) ? (filter as EmberDepth) : null;
}

/** Search stays on the name. The band and the depth are not part of the query. */
export function visibleEmberCustomers<T extends EmberRow>(
  rows: readonly T[],
  band: EmberBand | "blank" | null,
  depth: EmberDepth | null,
  query: string,
  now: unknown,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = emberState(row.at);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && emberBand(row.at, now) !== band) return false;
    if (depth !== null && emberDepth(row.at, now) !== depth) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function embersCsv(rows: readonly EmberRow[], now: unknown): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = emberState(row.at);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of bandLines(rows, now)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of depthLines(rows, now)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  return lines.join("\n");
}

export const CHOIR_VOICES = VOICES;
export const CHOIR_BANDS = BANDS;
