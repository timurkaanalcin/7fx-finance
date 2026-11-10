/** Local shift briefings, and spoken languages already on each loaded row. */

export const BRIEFING_KEY = "crmv4-briefings";
export const BRIEFING_VIEW_KEY = "crmv4-briefing-views";
export const LEXICON_KEY = "crmv4-lexicon-hide";

export type BriefingTone = "blank" | "hush" | "even" | "sharp";

export type BriefingRoom = "blank" | "salon" | "desk" | "floor" | "line";

export type BriefingTray = "open" | "parked" | "sealed";

export type QuarterPick = "blank" | "early" | "late" | "odd" | "even";

export type BriefingCard = {
  id: string;
  text: string;
  steward: string;
  quarter: number | null;
  room: string;
  ribbon: string;
  tone: string;
  pinned: boolean;
  sealed: boolean;
  parked: boolean;
  audit: string;
};

export type BriefingView = {
  id: string;
  name: string;
  tray: BriefingTray;
  query: string;
  steward: string;
  room: string;
  ribbon: string;
  tone: string;
  quarter: string;
};

export type BriefingCounts = {
  open: number;
  parked: number;
  sealed: number;
  pinned: number;
  late: number;
};

export type SpokenTongue = "" | "en" | "tr" | "de" | "ru" | "ar" | "fr" | "other";

export type ScriptFamily = "" | "latin" | "cyrillic" | "arabic" | "other";

export type LexiconValue =
  | {
      language?: unknown;
      email?: unknown;
      phone?: unknown;
      country?: unknown;
      name?: unknown;
      username?: unknown;
      birthDate?: unknown;
      registrationDate?: unknown;
      address?: unknown;
      timezone?: unknown;
      city?: unknown;
      desk?: unknown;
      jobTitle?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type LexiconRow = { language?: LexiconValue; label?: string | null };

export type TongueLine = { tongue: string; count: number };

export type ScriptLine = { script: string; count: number };

export type LetterLine = { letter: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "park", "release", "seal", "reopen"] as const;

const ROOMS = ["salon", "desk", "floor", "line"] as const;

const TONES = ["hush", "even", "sharp"] as const;

const TONE_ORDER = ["", "hush", "even", "sharp"] as const;

const QUARTERS = [1, 2, 3, 4] as const;

const PICKS = ["blank", "early", "late", "odd", "even"] as const;

const TONGUES = ["", "en", "tr", "de", "ru", "ar", "fr", "other"] as const;

const SCRIPTS = ["", "latin", "cyrillic", "arabic", "other"] as const;

const ALIASES: Record<string, Exclude<SpokenTongue, "" | "other">> = {
  en: "en",
  english: "en",
  tr: "tr",
  turkish: "tr",
  türkçe: "tr",
  de: "de",
  german: "de",
  deutsch: "de",
  ru: "ru",
  russian: "ru",
  русский: "ru",
  ar: "ar",
  arabic: "ar",
  العربية: "ar",
  fr: "fr",
  french: "fr",
  français: "fr",
};

const TONGUE_BLOCK = [
  "email",
  "phone",
  "country",
  "name",
  "username",
  "birthDate",
  "registrationDate",
  "address",
  "timezone",
  "city",
  "desk",
  "jobTitle",
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BriefingTray {
  return raw === "parked" || raw === "sealed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function roomName(raw: unknown): Exclude<BriefingRoom, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (ROOMS as readonly string[]).includes(text) ? (text as Exclude<BriefingRoom, "blank">) : "";
}

function toneName(raw: unknown): Exclude<BriefingTone, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<BriefingTone, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function briefingText(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank steward stays blank. It is not filled in. */
export function stewardLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank ribbon stays blank. It is not filled in. */
export function ribbonMark(raw: unknown): string {
  return clip(raw, 10);
}

/**
 * A quarter is 1, 2, 3, or 4.
 * A blank value stays unset. A leading zero is not a quarter.
 * Zero is not a quarter. Five is not a quarter.
 */
export function quarterOf(raw: unknown): number | null {
  if (typeof raw === "number" && QUARTERS.includes(raw as (typeof QUARTERS)[number])) return raw;
  if (typeof raw === "string" && /^[1-4]$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** The minutes already spent on the watch are 0 through 240. A blank value stays unset. A longer number that starts with zero is not a count. */
export function spentOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 240) return raw;
  if (typeof raw === "string" && /^(?:0|[1-9]\d?|1\d\d|2[0-3]\d|240)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Salon, desk, floor, line, or blank. Anything else is blank. */
export function roomOf(raw: unknown): BriefingRoom {
  return roomName(raw) || "blank";
}

/** Hush, even, sharp, or blank. Anything else is blank. */
export function toneOf(raw: unknown): BriefingTone {
  return toneName(raw) || "blank";
}

/** Early is 1 and 2. Late is 3 and 4. An unset quarter is blank. */
export function quarterBand(quarter: unknown): "blank" | "early" | "late" {
  const count = quarterOf(quarter);
  if (count === null) return "blank";
  return count <= 2 ? "early" : "late";
}

/** Odd is 1 and 3. Even is 2 and 4. An unset quarter is blank. */
export function quarterPair(quarter: unknown): "blank" | "odd" | "even" {
  const count = quarterOf(quarter);
  if (count === null) return "blank";
  return count % 2 === 1 ? "odd" : "even";
}

/** Minutes from the quarter slot to the minutes you type. A quarter is fifteen minutes. A positive gap is past the slot. */
export function quarterGap(quarter: unknown, spent: unknown): number | null {
  const from = quarterOf(quarter);
  const at = spentOf(spent);
  if (from === null || at === null) return null;
  return at - from * 15;
}

export function readBriefings(raw: unknown): BriefingCard[] {
  if (!Array.isArray(raw)) return [];
  const out: BriefingCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BriefingCard>;
    const id = String(row.id || "").trim();
    const text = briefingText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      steward: stewardLabel(row.steward),
      quarter: quarterOf(row.quarter),
      room: roomName(row.room),
      ribbon: ribbonMark(row.ribbon),
      tone: toneName(row.tone),
      pinned: row.pinned === true,
      sealed: row.sealed === true,
      parked: row.parked === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 24);
}

export function addBriefing(
  cards: readonly BriefingCard[],
  card: { id: string; text: string; steward?: string; quarter?: unknown; room?: string; ribbon?: string; tone?: string },
): BriefingCard[] {
  const current = readBriefings(cards);
  const id = String(card.id || "").trim();
  const text = briefingText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: BriefingCard = {
    id,
    text,
    steward: stewardLabel(card.steward),
    quarter: quarterOf(card.quarter),
    room: roomName(card.room),
    ribbon: ribbonMark(card.ribbon),
    tone: toneName(card.tone),
    pinned: false,
    sealed: false,
    parked: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 24);
}

export function stepBriefingTone(cards: readonly BriefingCard[], id: string, dir: 1 | -1): BriefingCard[] {
  return readBriefings(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TONE_ORDER.indexOf(card.tone as (typeof TONE_ORDER)[number]);
    const next = TONE_ORDER[Math.min(TONES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.tone) return card;
    return { ...card, tone: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setBriefingPinned(cards: readonly BriefingCard[], id: string, pinned: boolean): BriefingCard[] {
  return readBriefings(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setBriefingParked(cards: readonly BriefingCard[], id: string, parked: boolean): BriefingCard[] {
  return readBriefings(cards).map((card) => (card.id === id ? { ...card, parked, audit: parked ? "park" : "release" } : card));
}

export function setBriefingSealed(cards: readonly BriefingCard[], id: string, sealed: boolean): BriefingCard[] {
  return readBriefings(cards).map((card) => (card.id === id ? { ...card, sealed, audit: sealed ? "seal" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another briefing is left out. */
export function editBriefing(cards: readonly BriefingCard[], id: string, text: string): BriefingCard[] {
  const current = readBriefings(cards);
  const next = briefingText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkBriefingPinned(cards: readonly BriefingCard[], ids: readonly string[], pinned: boolean): BriefingCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readBriefings(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkBriefingSealed(cards: readonly BriefingCard[], ids: readonly string[], sealed: boolean): BriefingCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readBriefings(cards).map((card) => (want.has(card.id) ? { ...card, sealed, audit: sealed ? "seal" : "reopen" } : card));
}

export function resetBriefings(): BriefingCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function briefingCopy(raw: unknown): string {
  return briefingText(raw);
}

function inTray(card: BriefingCard, tray: BriefingTray): boolean {
  if (tray === "sealed") return card.sealed;
  if (tray === "parked") return card.parked && !card.sealed;
  return !card.parked && !card.sealed;
}

function quarterHit(quarter: number | null, exact: number | null, band: QuarterPick | null): boolean {
  if (exact !== null) return quarter === exact;
  if (band === null) return true;
  if (band === "blank") return quarter === null;
  if (band === "odd" || band === "even") return quarterPair(quarter) === band;
  return quarterBand(quarter) === band;
}

function toneScore(tone: string): number {
  if (tone === "sharp") return 3;
  if (tone === "even") return 2;
  if (tone === "hush") return 1;
  return 0;
}

/** Search stays on the note. The steward, the quarter, the room, the ribbon, and the tone are not part of the query. */
export function visibleBriefings(
  cards: readonly BriefingCard[],
  tray: BriefingTray,
  query: string,
  steward: string | null,
  room: BriefingRoom | null,
  ribbon: string | null,
  tone: BriefingTone | null,
  exact: number | null,
  band: QuarterPick | null,
  sharpOnly: boolean,
  lateOnly: boolean,
  spent: unknown,
): BriefingCard[] {
  const text = query.trim().toLowerCase();
  const wantSteward = steward === null ? null : stewardLabel(steward);
  const wantRibbon = ribbon === null ? null : ribbonMark(ribbon);
  return readBriefings(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (sharpOnly && card.tone !== "sharp") return false;
      if (wantSteward !== null && stewardLabel(card.steward) !== wantSteward) return false;
      if (room !== null && roomOf(card.room) !== room) return false;
      if (wantRibbon !== null && ribbonMark(card.ribbon) !== wantRibbon) return false;
      if (tone !== null && toneOf(card.tone) !== tone) return false;
      if (!quarterHit(card.quarter, exact, band)) return false;
      if (lateOnly) {
        const gap = quarterGap(card.quarter, spent);
        if (gap === null || gap <= 0 || !inTray(card, "open")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (toneScore(a.tone) !== toneScore(b.tone)) return toneScore(b.tone) - toneScore(a.tone);
      return a.text.localeCompare(b.text);
    });
}

/** The quarter orders the desk. An unset quarter stays at the end. Search stays on the note. */
export function briefingTimeline(cards: readonly BriefingCard[], query: string): BriefingCard[] {
  const text = query.trim().toLowerCase();
  return readBriefings(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.quarter === null && b.quarter !== null) return 1;
      if (a.quarter !== null && b.quarter === null) return -1;
      if (a.quarter !== null && b.quarter !== null && a.quarter !== b.quarter) return a.quarter - b.quarter;
      return a.text.localeCompare(b.text);
    });
}

export function briefingCounts(cards: readonly BriefingCard[], spent: unknown): BriefingCounts {
  const rows = readBriefings(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    parked: rows.filter((card) => inTray(card, "parked")).length,
    sealed: rows.filter((card) => inTray(card, "sealed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => {
      const gap = quarterGap(card.quarter, spent);
      return gap !== null && gap > 0 && inTray(card, "open");
    }).length,
  };
}

/** Share of the saved briefings. A zero total stays at zero. */
export function briefingShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function briefingStewards(cards: readonly BriefingCard[]): string[] {
  const out: string[] = [];
  for (const card of readBriefings(cards)) {
    if (card.steward && !out.includes(card.steward)) out.push(card.steward);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function briefingRibbons(cards: readonly BriefingCard[]): string[] {
  const out: string[] = [];
  for (const card of readBriefings(cards)) {
    if (card.ribbon && !out.includes(card.ribbon)) out.push(card.ribbon);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function briefingRooms(cards: readonly BriefingCard[]): Exclude<BriefingRoom, "blank">[] {
  const seen = new Set<string>();
  for (const card of readBriefings(cards)) if (card.room) seen.add(card.room);
  return ROOMS.filter((room) => seen.has(room));
}

export function briefingTones(cards: readonly BriefingCard[]): Exclude<BriefingTone, "blank">[] {
  const seen = new Set<string>();
  for (const card of readBriefings(cards)) if (card.tone) seen.add(card.tone);
  return TONES.filter((tone) => seen.has(tone));
}

/** Four quarters. Index 0 is 1. Index 3 is 4. */
export function quarterCounts(cards: readonly BriefingCard[]): number[] {
  const rows = readBriefings(cards);
  return QUARTERS.map((quarter) => rows.filter((card) => card.quarter === quarter).length);
}

/** "all" and "blank" stay. A steward that is no longer on a briefing falls back to all. */
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

/** "all" and "blank" stay. A room that is no longer on a briefing falls back to all. */
export function activeRoom(filter: string, rooms: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const room = roomName(filter);
  return room && rooms.includes(room) ? room : "all";
}

export function roomArg(filter: string): BriefingRoom | null {
  if (filter === "blank") return "blank";
  return roomName(filter) || null;
}

/** "all" and "blank" stay. A ribbon that is no longer on a briefing falls back to all. */
export function activeRibbon(filter: string, ribbons: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ribbon = ribbonMark(filter);
  return ribbon && ribbons.includes(ribbon) ? ribbon : "all";
}

export function ribbonArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return ribbonMark(filter);
}

/** "all" and "blank" stay. A tone that is no longer on a briefing falls back to all. */
export function activeTone(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tone = toneName(filter);
  return tone && tones.includes(tone) ? tone : "all";
}

export function toneArg(filter: string): BriefingTone | null {
  if (filter === "blank") return "blank";
  return toneName(filter) || null;
}

/** All, blank, the two bands, the two pairs, and the four quarters stay. Anything else is all. */
export function activeQuarter(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const quarter = quarterOf(filter);
  return quarter === null ? "all" : String(quarter);
}

export function quarterArg(filter: string): { exact: number | null; band: QuarterPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, band: filter as QuarterPick };
  const quarter = quarterOf(filter);
  return quarter === null ? { exact: null, band: null } : { exact: quarter, band: null };
}

/** Other briefings with the same room and the same quarter. A blank room or an unset quarter clashes with nothing. */
export function briefingClashIds(cards: readonly BriefingCard[], id: string): string[] {
  const rows = readBriefings(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.room || card.quarter === null) return [];
  return rows
    .filter((item) => item.id !== id && item.room === card.room && item.quarter === card.quarter)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open briefing at or after the minutes you type. After the last quarter slot, the desk wraps to the earliest open quarter. */
export function nextBriefing(cards: readonly BriefingCard[], spent: unknown): string {
  const now = spentOf(spent);
  if (now === null) return "";
  const waiting = readBriefings(cards).filter((card) => inTray(card, "open") && card.quarter !== null);
  if (!waiting.length) return "";
  const slot = (card: BriefingCard) => (card.quarter ?? 0) * 15;
  const bySlot = (a: BriefingCard, b: BriefingCard) => slot(a) - slot(b) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => slot(card) >= now).sort(bySlot);
  if (later.length) return later[0].id;
  return waiting.slice().sort(bySlot)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the briefings saved in this browser. The gap uses the minutes you pass. */
export function briefingsCsv(raw: unknown, spent: unknown): string {
  const lines = ["note,steward,quarter,room,ribbon,tone,band,pinned,parked,sealed,gap,audit"];
  for (const card of readBriefings(raw)) {
    const gap = quarterGap(card.quarter, spent);
    lines.push([
      csvCell(card.text),
      csvCell(card.steward),
      card.quarter === null ? "" : String(card.quarter),
      card.room,
      csvCell(card.ribbon),
      card.tone,
      quarterBand(card.quarter),
      card.pinned ? "1" : "0",
      card.parked ? "1" : "0",
      card.sealed ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function stewardSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stewardLabel(raw) || "all";
}

function roomSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return roomName(raw) || "all";
}

function ribbonSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ribbonMark(raw) || "all";
}

function toneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return toneName(raw) || "all";
}

export function readBriefingViews(raw: unknown): BriefingView[] {
  if (!Array.isArray(raw)) return [];
  const out: BriefingView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BriefingView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 72),
      steward: stewardSlot(row.steward),
      room: roomSlot(row.room),
      ribbon: ribbonSlot(row.ribbon),
      tone: toneSlot(row.tone),
      quarter: activeQuarter(String(row.quarter ?? "")),
    });
  }
  return out.slice(0, 8);
}

export function addBriefingView(
  views: readonly BriefingView[],
  view: { id: string; name: string; tray: BriefingTray; query: string; steward: string; room: string; ribbon: string; tone: string; quarter: string },
): BriefingView[] {
  const current = readBriefingViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 72),
    steward: stewardSlot(view.steward),
    room: roomSlot(view.room),
    ribbon: ribbonSlot(view.ribbon),
    tone: toneSlot(view.tone),
    quarter: activeQuarter(view.quarter),
  }].slice(0, 8);
}

export function dropBriefingView(views: readonly BriefingView[], id: string): BriefingView[] {
  return readBriefingViews(views).filter((view) => view.id !== id);
}

function tongueToken(raw: string): SpokenTongue {
  const text = raw.trim().toLowerCase().replace(/_/g, "-");
  if (!text) return "";
  if (ALIASES[text]) return ALIASES[text];
  const head = text.split("-")[0];
  if (ALIASES[head]) return ALIASES[head];
  if (/^[a-z]{2,8}$/.test(head)) return "other";
  return "";
}

function resolvedTongue(value: LexiconValue): SpokenTongue {
  if (typeof value === "string") return tongueToken(value);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (TONGUE_BLOCK.some((key) => key in value)) return "";
  return tongueToken(clip(value.language, 32));
}

/**
 * A spoken language from the language field, or blank.
 * A name, an email, and a phone are not a language.
 * A missing language stays unmarked and is not filled in.
 */
export function spokenTongue(value: LexiconValue): SpokenTongue {
  return resolvedTongue(value);
}

/** Latin, Cyrillic, Arabic, other, or blank. The script follows the spoken language. */
export function scriptOf(value: LexiconValue): ScriptFamily {
  const tongue = resolvedTongue(value);
  if (tongue === "ru") return "cyrillic";
  if (tongue === "ar") return "arabic";
  if (tongue === "other") return "other";
  if (tongue === "en" || tongue === "tr" || tongue === "de" || tongue === "fr") return "latin";
  return "";
}

/** The first letter of the language code. An unmarked language stays blank. */
export function letterOf(value: LexiconValue): string {
  const tongue = resolvedTongue(value);
  return tongue ? tongue.slice(0, 1) : "";
}

export function tongueLines(rows: readonly LexiconRow[]): TongueLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const tongue = spokenTongue(row.language);
    map.set(tongue, (map.get(tongue) || 0) + 1);
  }
  const out: TongueLine[] = [];
  for (const tongue of TONGUES) {
    const count = map.get(tongue);
    if (count) out.push({ tongue, count });
  }
  return out;
}

export function namedTongues(rows: readonly LexiconRow[]): string[] {
  return tongueLines(rows).map((line) => line.tongue).filter(Boolean);
}

export function scriptLines(rows: readonly LexiconRow[]): ScriptLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const script = scriptOf(row.language);
    map.set(script, (map.get(script) || 0) + 1);
  }
  const out: ScriptLine[] = [];
  for (const script of SCRIPTS) {
    const count = map.get(script);
    if (count) out.push({ script, count });
  }
  return out;
}

export function namedScripts(rows: readonly LexiconRow[]): string[] {
  return scriptLines(rows).map((line) => line.script).filter(Boolean);
}

export function letterLines(rows: readonly LexiconRow[]): LetterLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const letter = letterOf(row.language);
    if (!letter) continue;
    map.set(letter, (map.get(letter) || 0) + 1);
  }
  const out: LetterLine[] = [];
  map.forEach((count, letter) => out.push({ letter, count }));
  return out.sort((a, b) => a.letter.localeCompare(b.letter));
}

export function namedLetters(rows: readonly LexiconRow[]): string[] {
  return letterLines(rows).map((line) => line.letter);
}

/** The named language with the most loaded rows. A tie keeps the earlier language. An unmarked language is not a lead. */
export function leadingTongue(rows: readonly LexiconRow[]): string {
  const named = tongueLines(rows).filter((line) => line.tongue);
  if (!named.length) return "";
  const order = (tongue: string) => TONGUES.indexOf(tongue as (typeof TONGUES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.tongue) - order(b.tongue))[0].tongue;
}

/** The named script with the most loaded rows. A tie keeps the earlier script. A blank script is not a lead. */
export function leadingScript(rows: readonly LexiconRow[]): string {
  const named = scriptLines(rows).filter((line) => line.script);
  if (!named.length) return "";
  const order = (script: string) => SCRIPTS.indexOf(script as (typeof SCRIPTS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.script) - order(b.script))[0].script;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function lexiconShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenTongues(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = String(item || "").trim();
    if (!mark || !(TONGUES as readonly string[]).includes(mark) || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleTongue(hidden: readonly string[], tongue: string, present: readonly string[]): string[] {
  const mark = (TONGUES as readonly string[]).includes(tongue) && tongue ? tongue : "";
  if (!mark || !present.includes(mark)) return readHiddenTongues(hidden, present);
  const current = readHiddenTongues(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleTongues(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenTongues(hidden, present));
  return present.filter((tongue) => (showHidden ? gone.has(tongue) : !gone.has(tongue)));
}

/** "all" and "blank" stay. A language that is no longer loaded falls back to all. */
export function activeTongue(filter: string, tongues: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return tongues.includes(filter) ? filter : "all";
}

export function tongueArg(filter: string): SpokenTongue | null {
  if (filter === "blank") return "";
  if ((TONGUES as readonly string[]).includes(filter) && filter !== "") return filter as SpokenTongue;
  return null;
}

/** "all" and "blank" stay. A script that is no longer loaded falls back to all. */
export function activeScript(filter: string, scripts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return scripts.includes(filter) ? filter : "all";
}

export function scriptArg(filter: string): ScriptFamily | null {
  if (filter === "blank") return "";
  if ((SCRIPTS as readonly string[]).includes(filter) && filter !== "") return filter as ScriptFamily;
  return null;
}

/** A letter that is no longer loaded falls back to all. */
export function activeLetter(filter: string, letters: readonly string[]): string {
  if (!filter || filter === "all") return "all";
  const letter = filter.trim();
  return /^[a-z]$/.test(letter) && letters.includes(letter) ? letter : "all";
}

export function letterArg(filter: string): string | null {
  if (!filter || filter === "all") return null;
  const letter = filter.trim();
  return /^[a-z]$/.test(letter) ? letter : null;
}

/** Search stays on the name. The language is not part of the query. */
export function visibleLexiconCustomers<T extends LexiconRow>(
  rows: readonly T[],
  tongue: SpokenTongue | null,
  script: ScriptFamily | null,
  letter: string | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (tongue !== null && spokenTongue(row.language) !== tongue) return false;
    if (script !== null && scriptOf(row.language) !== script) return false;
    if (letter !== null && letterOf(row.language) !== letter) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the languages, scripts, and letters on this page. */
export function lexiconCsv(rows: readonly LexiconRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of tongueLines(rows)) lines.push(["tongue", line.tongue, String(line.count)].join(","));
  for (const line of scriptLines(rows)) lines.push(["script", line.script, String(line.count)].join(","));
  for (const line of letterLines(rows)) lines.push(["letter", line.letter, String(line.count)].join(","));
  return lines.join("\n");
}
