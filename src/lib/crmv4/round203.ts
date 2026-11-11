/**
 * Oratory cards for the marketing desk, and visitor seals already stored as lastIp on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_oratory_card (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   speaker text not null default '',
 *   bell integer,
 *   nave text not null default '',
 *   voice text not null default '',
 *   candle integer,
 *   span integer,
 *   tags text not null default '',
 *   pause integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_visitor_seal_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_visitor_seal_review (
 *   customer_id text primary key
 * );
 */

export const ORC_KEY = "crmv4-oratory-card";
export const ORC_VIEW_KEY = "crmv4-oratory-views";
export const ORC_DENSITY_KEY = "crmv4-oratory-density";
export const VSL_KEY = "crmv4-seal-hide";
export const VSL_REVIEW_KEY = "crmv4-seal-review";

export type CardNave = "blank" | "apse" | "nave" | "transept";

export type CardVoice = "blank" | "murmur" | "chant" | "hush";

export type CardTray = "open" | "held" | "closed";

export type BellPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type CardDensity = "roomy" | "tight";

export type CardSort = "bell" | "title";

export type OratoryCard = {
  id: string;
  title: string;
  note: string;
  speaker: string;
  bell: number | null;
  nave: string;
  voice: string;
  candle: number | null;
  span: number | null;
  tags: string[];
  pause: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type CardView = {
  id: string;
  name: string;
  tray: CardTray;
  query: string;
  speaker: string;
  nave: string;
  voice: string;
  bell: string;
  candle: string;
  span: string;
};

export type CardCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  rest: number;
  house: number;
};

export type SealState = "" | "set" | "clear";

export type SealBand = "" | "wide" | "dot" | "stem";

export type SealTone = "" | "house" | "script" | "road";

export type SealShape = "all" | "catalog" | "wide" | "house";

export type SealValue =
  | { lastIp?: unknown; timezone?: unknown; username?: unknown; email?: unknown; phone?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown; name?: unknown }
  | string
  | number
  | null
  | undefined;

export type SealRow = { id: string; note?: SealValue; label?: string | null };

export type SealBandLine = { band: string; count: number };

const AUDITS = ["save", "edit", "voice", "pin", "unpin", "hold", "lift", "close", "open", "nave", "tag", "pause"] as const;

const NAVES = ["apse", "nave", "transept"] as const;

const VOICES = ["murmur", "chant", "hush"] as const;

const VOICE_ORDER = ["", "murmur", "chant", "hush"] as const;

const PEAK_BELLS = new Set([2, 3]);

const QUIET_BELLS = new Set([1, 6]);

const HOUSE = new Set(["APSE", "TRANSEPT"]);

const SEAL_BANDS = ["dot", "wide", "stem"] as const;

const TONES = ["house", "script", "road"] as const;

const CATALOG = new Set(["127.0.0.1", "10.0.0.1", "192.168.0.1"]);

const SEAL_BLOCK = ["timezone", "username", "email", "phone", "assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage", "name"] as const;

const CARD_CAP = 7;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CardTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function naveName(raw: unknown): Exclude<CardNave, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (NAVES as readonly string[]).includes(text) ? (text as Exclude<CardNave, "blank">) : "";
}

function voiceName(raw: unknown): Exclude<CardVoice, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (VOICES as readonly string[]).includes(text) ? (text as Exclude<CardVoice, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function cardLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function cardNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank speaker stays blank. It is not filled in. */
export function speakerLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A nave is APSE, NAVE, or TRANSEPT. Anything else stays blank. Letters are stored in capitals. */
export function naveOf(raw: unknown): string {
  const name = naveName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bell is an integer from 1 through 6.
 * A blank value stays unset. 0 and 7 are not bells.
 * A leading zero is not a bell.
 */
export function bellOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-6]$/.test(text)) return null;
  return Number(text);
}

/** A candle is 2, 4, or 8. A blank value stays unset. A leading zero is not a candle. */
export function candleOf(raw: unknown): 2 | 4 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
  return null;
}

/** A span is 15, 30, or 45 minutes. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): 15 | 30 | 45 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 45 || raw === "45") return 45;
  return null;
}

/** A pause is 0, 5, or 15. Anything else is not a pause. */
export function pauseOf(raw: unknown): 0 | 5 | 15 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 5 || raw === "5") return 5;
  if (raw === 15 || raw === "15") return 15;
  return null;
}

export function bellBand(bell: unknown): "blank" | "early" | "mid" | "late" {
  const value = bellOf(bell);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
}

/** Peak bells are 2 and 3. An unset bell is not a peak bell. */
export function peakBell(bell: unknown): boolean {
  const value = bellOf(bell);
  return value !== null && PEAK_BELLS.has(value);
}

/** Quiet bells are 1 and 6. A peak bell is not quiet. An unset bell is not quiet. */
export function quietBell(bell: unknown): boolean {
  const value = bellOf(bell);
  return value !== null && QUIET_BELLS.has(value);
}

/**
 * How far a bell sits behind the desk bell.
 * A positive gap means the card bell is behind. A negative gap means it is ahead.
 * A gap of zero means the same bell. An unset bell has no gap. Bells do not wrap.
 */
export function bellGap(bell: unknown, desk: unknown): number | null {
  const from = bellOf(bell);
  const at = bellOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** APSE and TRANSEPT are house naves. NAVE is a guest nave. A blank nave is not a house nave. */
export function houseNave(nave: unknown): boolean {
  return HOUSE.has(naveOf(nave));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): CardDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Bell or title. Anything else stays on the bell. */
export function sortMode(raw: unknown): CardSort {
  return raw === "title" ? "title" : "bell";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 4).toLowerCase();
  return /^[a-z]$/.test(text) ? text : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,\s]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = tagOf(part);
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length >= TAG_CAP) break;
  }
  return out;
}

function readOne(raw: unknown): OratoryCard | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<OratoryCard>;
  const id = clip(row.id, 24);
  const title = cardLine(row.title);
  if (!id || !title) return null;
  const pause = pauseOf(row.pause);
  return {
    id,
    title,
    note: cardNote(row.note),
    speaker: speakerLabel(row.speaker),
    bell: bellOf(row.bell),
    nave: naveOf(row.nave),
    voice: voiceName(row.voice),
    candle: candleOf(row.candle),
    span: spanOf(row.span),
    tags: tagsOf(row.tags),
    pause: pause === null ? 0 : pause,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readCards(raw: unknown): OratoryCard[] {
  if (!Array.isArray(raw)) return [];
  const out: OratoryCard[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, CARD_CAP);
}

export function addCard(
  cards: readonly OratoryCard[],
  card: {
    id: string;
    title: string;
    note?: string;
    speaker?: string;
    bell?: unknown;
    nave?: string;
    voice?: string;
    candle?: unknown;
    span?: unknown;
    tags?: unknown;
    pause?: unknown;
  },
): OratoryCard[] {
  const current = readCards(cards);
  const id = String(card.id || "").trim();
  const title = cardLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const pause = pauseOf(card.pause);
  const next: OratoryCard = {
    id,
    title,
    note: cardNote(card.note),
    speaker: speakerLabel(card.speaker),
    bell: bellOf(card.bell),
    nave: naveOf(card.nave),
    voice: voiceName(card.voice),
    candle: candleOf(card.candle),
    span: spanOf(card.span),
    tags: tagsOf(card.tags),
    pause: pause === null ? 0 : pause,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

export function cycleVoice(cards: readonly OratoryCard[], id: string): OratoryCard[] {
  return readCards(cards).map((card) => {
    if (card.id !== id) return card;
    const at = VOICE_ORDER.indexOf(card.voice as (typeof VOICE_ORDER)[number]);
    const next = at < 0 || at >= VOICES.length ? VOICES[0] : VOICES[at % VOICES.length];
    if (!next || next === card.voice) return card;
    return { ...card, voice: next, audit: "voice" };
  });
}

/** A blank title is left as it is. */
export function editCard(cards: readonly OratoryCard[], id: string, title: unknown): OratoryCard[] {
  const next = cardLine(title);
  if (!next) return readCards(cards);
  const current = readCards(cards);
  if (current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left as it is. */
export function editCardNote(cards: readonly OratoryCard[], id: string, note: unknown): OratoryCard[] {
  const next = cardNote(note);
  if (!next) return readCards(cards);
  return readCards(cards).map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

/** A tag that is already on the card, or a fourth tag, is left out. A tag is one letter. */
export function addCardTag(cards: readonly OratoryCard[], id: string, tag: unknown): OratoryCard[] {
  const next = tagOf(tag);
  if (!next) return readCards(cards);
  return readCards(cards).map((card) => {
    if (card.id !== id || card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** An unknown pause is left as it is. 0 clears the pause. */
export function setCardPause(cards: readonly OratoryCard[], id: string, pause: unknown): OratoryCard[] {
  const next = pauseOf(pause);
  if (next === null) return readCards(cards);
  return readCards(cards).map((card) => (card.id === id && card.pause !== next ? { ...card, pause: next, audit: "pause" } : card));
}

export function setCardPin(cards: readonly OratoryCard[], id: string, pinned: boolean): OratoryCard[] {
  return readCards(cards).map((card) => (card.id === id && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

/** P toggles the pin on the focused row of the wall currently shown. */
export function pinFocused(cards: readonly OratoryCard[], shownIds: readonly string[], index: number): OratoryCard[] {
  if (!shownIds.length) return readCards(cards);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readCards(cards).find((card) => card.id === id);
  if (!row) return readCards(cards);
  return setCardPin(cards, id, !row.pinned);
}

export function setCardHold(cards: readonly OratoryCard[], id: string, held: boolean): OratoryCard[] {
  return readCards(cards).map((card) => (card.id === id && card.held !== held ? { ...card, held, audit: held ? "hold" : "lift" } : card));
}

export function setCardClose(cards: readonly OratoryCard[], id: string, closed: boolean): OratoryCard[] {
  return readCards(cards).map((card) => (card.id === id && card.closed !== closed ? { ...card, closed, audit: closed ? "close" : "open" } : card));
}

export function bulkCardNave(cards: readonly OratoryCard[], ids: readonly string[], nave: unknown): OratoryCard[] {
  const next = naveOf(nave);
  if (!next) return readCards(cards);
  const picked = new Set(ids);
  return readCards(cards).map((card) => (picked.has(card.id) && card.nave !== next ? { ...card, nave: next, audit: "nave" } : card));
}

export function bulkCardPin(cards: readonly OratoryCard[], ids: readonly string[], pinned: boolean): OratoryCard[] {
  const picked = new Set(ids);
  return readCards(cards).map((card) => (picked.has(card.id) && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkCardClose(cards: readonly OratoryCard[], ids: readonly string[], closed: boolean): OratoryCard[] {
  const picked = new Set(ids);
  return readCards(cards).map((card) => (picked.has(card.id) && card.closed !== closed ? { ...card, closed, audit: closed ? "close" : "open" } : card));
}

export function bulkCardTag(cards: readonly OratoryCard[], ids: readonly string[], tag: unknown): OratoryCard[] {
  return ids.reduce((rows, id) => addCardTag(rows, id, tag), readCards(cards));
}

export function resetCards(): OratoryCard[] {
  return [];
}

function inTray(card: OratoryCard, tray: CardTray): boolean {
  if (tray === "closed") return card.closed;
  if (tray === "held") return card.held && !card.closed;
  return !card.held && !card.closed;
}

function bellHit(bell: number | null, exact: number | null, pick: BellPick | null): boolean {
  if (exact !== null) return bell === exact;
  if (pick === null) return true;
  if (pick === "blank") return bell === null;
  if (pick === "peak") return peakBell(bell);
  if (pick === "quiet") return quietBell(bell);
  return bellBand(bell) === pick;
}

/** An open card whose bell sits more than three bells behind the desk bell. A pause, a hold, or a close is not late. */
export function lateCard(card: OratoryCard, desk: unknown): boolean {
  const gap = bellGap(card.bell, desk);
  return inTray(card, "open") && card.pause === 0 && gap !== null && gap > 3;
}

/** An open card with a span of 15 is due now. A pause, a hold, or a close is not. */
export function soonCard(card: OratoryCard): boolean {
  return inTray(card, "open") && card.pause === 0 && card.span === 15;
}

/** Open cards that are late or due now. A paused card stays off the reminder list. */
export function reminderCards(cards: readonly OratoryCard[], desk: unknown): OratoryCard[] {
  return readCards(cards).filter((card) => lateCard(card, desk) || soonCard(card));
}

/** Search matches the title, the note, the speaker, and the tags. */
export function visibleCards(
  cards: readonly OratoryCard[],
  tray: CardTray,
  query: string,
  speaker: string | null,
  nave: string | null,
  voice: string | null,
  exact: number | null,
  pick: BellPick | null,
  candle: number | "blank" | null,
  span: number | "blank" | null,
  hushOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): OratoryCard[] {
  const text = query.trim().toLowerCase();
  return readCards(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text) {
      const hay = `${card.title} ${card.note} ${card.speaker} ${card.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (speaker !== null && card.speaker !== speaker) return false;
    if (nave === "blank" ? Boolean(card.nave) : nave && card.nave !== nave) return false;
    if (voice === "blank" ? Boolean(card.voice) : voice && card.voice !== voice) return false;
    if (!bellHit(card.bell, exact, pick)) return false;
    if (candle === "blank" ? card.candle !== null : candle !== null && card.candle !== candle) return false;
    if (span === "blank" ? card.span !== null : span !== null && card.span !== span) return false;
    if (hushOnly && card.voice !== "hush") return false;
    if (peakOnly && !peakBell(card.bell)) return false;
    if (houseOnly && !houseNave(card.nave)) return false;
    if (quietOnly && !quietBell(card.bell)) return false;
    if (awakeOnly && card.pause !== 0) return false;
    return true;
  });
}

export function sortCards(cards: readonly OratoryCard[], mode: CardSort): OratoryCard[] {
  const rows = cards.slice();
  if (mode === "title") return rows.sort((a, b) => a.title.localeCompare(b.title) || (a.bell ?? 99) - (b.bell ?? 99));
  return rows.sort((a, b) => (a.bell ?? 99) - (b.bell ?? 99) || a.title.localeCompare(b.title));
}

export function cardTimeline(cards: readonly OratoryCard[], query: string): OratoryCard[] {
  const text = query.trim().toLowerCase();
  return sortCards(
    readCards(cards).filter((card) => card.bell !== null && (!text || card.title.toLowerCase().includes(text))),
    "bell",
  );
}

export function cardCounts(cards: readonly OratoryCard[], desk: unknown): CardCounts {
  const rows = readCards(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    closed: rows.filter((card) => inTray(card, "closed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => inTray(card, "open") && card.pause === 0 && peakBell(card.bell)).length,
    late: rows.filter((card) => lateCard(card, desk)).length,
    soon: rows.filter((card) => soonCard(card)).length,
    rest: rows.filter((card) => inTray(card, "open") && card.pause > 0).length,
    house: rows.filter((card) => inTray(card, "open") && houseNave(card.nave)).length,
  };
}

export function cardShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Distinct bells on open cards. */
export function usedBells(cards: readonly OratoryCard[]): number {
  const bells = new Set<number>();
  for (const card of readCards(cards)) {
    if (inTray(card, "open") && card.bell !== null) bells.add(card.bell);
  }
  return bells.size;
}

/** Open cards that share a bell and a nave. A different nave on the same bell is not a clash. */
export function clashBellCount(cards: readonly OratoryCard[]): number {
  const groups = new Map<string, number>();
  for (const card of readCards(cards)) {
    if (!inTray(card, "open") || card.bell === null || !card.nave) continue;
    const key = `${card.bell}:${card.nave}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open cards that share a candle. An unset candle is not a clash. */
export function candleClashCount(cards: readonly OratoryCard[]): number {
  const groups = new Map<number, number>();
  for (const card of readCards(cards)) {
    if (!inTray(card, "open") || card.candle === null) continue;
    groups.set(card.candle, (groups.get(card.candle) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open cards on the same nave whose bells differ by one.
 * The count is the cards that have at least one neighbor.
 */
export function adjacentCardCount(cards: readonly OratoryCard[]): number {
  const open = readCards(cards).filter((card) => inTray(card, "open") && card.bell !== null && card.nave);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.nave === right.nave && Math.abs((left.bell ?? 0) - (right.bell ?? 0)) === 1) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The nave with the fewest open cards.
 * A tie keeps NAVE, then APSE, then TRANSEPT.
 * An empty desk still suggests NAVE.
 */
export function suggestNave(cards: readonly OratoryCard[]): "NAVE" | "APSE" | "TRANSEPT" {
  const rows = readCards(cards).filter((card) => inTray(card, "open"));
  const order = ["NAVE", "APSE", "TRANSEPT"] as const;
  let best: "NAVE" | "APSE" | "TRANSEPT" = "NAVE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const nave of order) {
    const count = rows.filter((card) => card.nave === nave).length;
    if (count < bestCount) {
      best = nave;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open cards.
 * A tie keeps 30, then 15, then 45.
 * An empty desk still suggests 30.
 */
export function suggestSpan(cards: readonly OratoryCard[]): 15 | 30 | 45 {
  const rows = readCards(cards).filter((card) => inTray(card, "open"));
  const order = [30, 15, 45] as const;
  let best: 15 | 30 | 45 = 30;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const span of order) {
    const count = rows.filter((card) => card.span === span).length;
    if (count < bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open speaker. A blank speaker is skipped. An empty desk stays blank. */
export function suggestSpeaker(cards: readonly OratoryCard[]): string {
  const found = readCards(cards).find((card) => inTray(card, "open") && card.speaker);
  return found ? found.speaker : "";
}

/**
 * The speaker carrying the fewest open cards.
 * A tie keeps the earlier name. A blank speaker is not a load.
 * An empty roster falls back to the newest speaker.
 */
export function fairSpeaker(cards: readonly OratoryCard[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = speakerLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestSpeaker(cards);
  const open = readCards(cards).filter((card) => inTray(card, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.speaker === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The speaker with the most open cards. A tie keeps the earlier name. */
export function busiestSpeaker(cards: readonly OratoryCard[]): string {
  const rows = readCards(cards).filter((card) => inTray(card, "open") && card.speaker);
  const names: string[] = [];
  for (const card of rows) if (!names.includes(card.speaker)) names.push(card.speaker);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((card) => card.speaker === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function cardSpeakers(cards: readonly OratoryCard[]): string[] {
  const out: string[] = [];
  for (const card of readCards(cards)) {
    if (card.speaker && !out.includes(card.speaker)) out.push(card.speaker);
  }
  return out;
}

export function cardNaves(cards: readonly OratoryCard[]): string[] {
  const out: string[] = [];
  for (const card of readCards(cards)) {
    if (card.nave && !out.includes(card.nave)) out.push(card.nave);
  }
  return out;
}

/**
 * The next open card at or after the desk bell.
 * A hush voice, a pause, a hold, and a close stay off the list.
 * When every open bell is behind, the earliest bell is next.
 */
export function nextCard(cards: readonly OratoryCard[], desk: unknown): string {
  const now = bellOf(desk);
  if (now === null) return "";
  const waiting = readCards(cards).filter((card) => inTray(card, "open") && card.bell !== null && card.voice !== "hush" && card.pause === 0);
  if (!waiting.length) return "";
  const byBell = (a: OratoryCard, b: OratoryCard) => (a.bell ?? 0) - (b.bell ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.bell ?? 0) >= now).sort(byBell);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBell)[0].id;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function cardCopy(card: OratoryCard, desk: unknown): string {
  const gap = bellGap(card.bell, desk);
  return [card.title, card.speaker, card.bell ?? "", card.nave, card.voice, card.candle ?? "", card.span ?? "", card.tags.join(" "), card.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The gap and the late mark use the bell you pass. */
export function cardsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,speaker,bell,nave,voice,candle,span,tags,pause,pinned,held,closed,gap,late,soon,house,note,audit"];
  for (const card of readCards(raw)) {
    const gap = bellGap(card.bell, desk);
    lines.push([
      card.title,
      card.speaker,
      card.bell === null ? "" : String(card.bell),
      card.nave,
      card.voice,
      card.candle === null ? "" : String(card.candle),
      card.span === null ? "" : String(card.span),
      card.tags.join(" "),
      String(card.pause),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCard(card, desk) ? "1" : "0",
      soonCard(card) ? "1" : "0",
      houseNave(card.nave) ? "1" : "0",
      card.note,
      card.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeSpeaker(raw: string, speakers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return speakers.includes(raw) ? raw : "all";
}

export function activeNave(raw: string, naves: readonly string[]): string {
  if (raw === "blank") return "blank";
  const nave = naveOf(raw);
  return nave && naves.includes(nave) ? nave : "all";
}

export function activeVoice(raw: string, voices: readonly string[]): string {
  if (raw === "blank") return "blank";
  const voice = voiceName(raw);
  return voice && voices.includes(voice) ? voice : "all";
}

export function activeBell(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const bell = bellOf(raw);
  return bell === null ? "all" : String(bell);
}

export function activeCandle(raw: string): string {
  if (raw === "blank") return "blank";
  const candle = candleOf(raw);
  return candle === null ? "all" : String(candle);
}

export function activeSpan(raw: string): string {
  if (raw === "blank") return "blank";
  const span = spanOf(raw);
  return span === null ? "all" : String(span);
}

export function speakerArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function naveArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return naveOf(filter) || null;
}

export function voiceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return voiceName(filter) || null;
}

export function bellArg(filter: string): { exact: number | null; pick: BellPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: bellOf(filter), pick: null };
}

export function candleArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return candleOf(filter);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

function readView(raw: unknown): CardView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CardView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    speaker: row.speaker === "blank" ? "blank" : clip(row.speaker, 16) || "all",
    nave: row.nave === "blank" || row.nave === "all" ? (row.nave === "blank" ? "blank" : "all") : naveOf(row.nave) || "all",
    voice: row.voice === "blank" || row.voice === "all" ? (row.voice === "blank" ? "blank" : "all") : voiceName(row.voice) || "all",
    bell: activeBell(String(row.bell || "all")),
    candle: activeCandle(String(row.candle || "all")),
    span: activeSpan(String(row.span || "all")),
  };
}

export function readCardViews(raw: unknown): CardView[] {
  if (!Array.isArray(raw)) return [];
  const out: CardView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addCardView(views: readonly CardView[], view: CardView): CardView[] {
  const current = readCardViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropCardView(views: readonly CardView[], id: string): CardView[] {
  return readCardViews(views).filter((view) => view.id !== id);
}

function sealBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function sealText(value: SealValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: sealBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (SEAL_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("lastIp" in value)) return { text: null, explicit: false };
  const inner = value.lastIp;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: sealBody(inner), explicit: true };
}

export function sealState(value: SealValue): SealState {
  const found = sealText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function sealCopy(value: SealValue): string {
  const found = sealText(value);
  if (!found.text) return "";
  return found.text.slice(0, 64);
}

function firstAlnum(text: string): string {
  const found = text.match(/[A-Za-z0-9]/);
  return found ? found[0].toUpperCase() : "";
}

/**
 * A colon address keeps the first mark of the first group and the first mark of the last group.
 * A dotted address keeps the first digit of the first octet and the first digit of the last octet.
 * Any other address keeps the first mark and the last mark.
 */
export function sealOf(value: SealValue): string {
  const text = sealCopy(value);
  if (!text) return "";
  if (text.includes(":")) {
    const groups = text.split(":").filter((part) => part.length > 0);
    if (groups.length < 2) return "";
    const left = firstAlnum(groups[0]);
    const right = firstAlnum(groups[groups.length - 1]);
    return left && right ? left + right : "";
  }
  if (text.includes(".")) {
    const parts = text.split(".");
    const left = (parts[0].match(/\d/) || [""])[0];
    const right = (parts[parts.length - 1].match(/\d/) || [""])[0];
    return left && right ? left + right : "";
  }
  const marks = text.match(/[A-Za-z0-9]/g);
  if (!marks || !marks.length) return "";
  const first = marks[0].toUpperCase();
  if (marks.length === 1) return first;
  return first + marks[marks.length - 1].toUpperCase();
}

/** A colon with marks on both ends is wide. Dots are a stem of dots. Any other mark is a stem. */
export function sealBand(value: SealValue): SealBand {
  const mark = sealOf(value);
  if (!mark) return "";
  const text = sealCopy(value);
  if (text.includes(":")) return "wide";
  if (text.includes(".")) return "dot";
  return "stem";
}

/**
 * A letter makes the tone script.
 * 10., 192.168., and 127. are house.
 * Every other marked address is road.
 */
export function sealTone(value: SealValue): SealTone {
  const text = sealCopy(value);
  if (!text || !sealOf(value)) return "";
  if (/[A-Za-z]/.test(text)) return "script";
  const lower = text.toLowerCase();
  if (lower.startsWith("10.") || lower.startsWith("192.168.") || lower.startsWith("127.")) return "house";
  return "road";
}

/** 127.0.0.1, 10.0.0.1, and 192.168.0.1 are the house catalog. Any other address is not. */
export function catalogSeal(value: SealValue): boolean {
  const text = sealCopy(value).toLowerCase().replace(/\s+/g, "");
  return CATALOG.has(text);
}

export function catalogSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => catalogSeal(row.note)).length;
}

export function wideSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealBand(row.note) === "wide").length;
}

export function houseSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealTone(row.note) === "house").length;
}

/** Customers whose mark is shared with at least one other customer. */
export function sharedSealCount(rows: readonly SealRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = sealOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function sealBands(rows: readonly SealRow[]): SealBandLine[] {
  return SEAL_BANDS.map((band) => ({ band, count: rows.filter((row) => sealBand(row.note) === band).length }));
}

/** The band with the most set addresses. A tie keeps dot, then wide, then stem. */
export function leadingSeal(rows: readonly SealRow[]): string {
  const lines = sealBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || SEAL_BANDS.indexOf(a.band as (typeof SEAL_BANDS)[number]) - SEAL_BANDS.indexOf(b.band as (typeof SEAL_BANDS)[number]))[0].band;
}

/** The tone with the most set addresses. A tie keeps house, then script, then road. */
export function leadingSealTone(rows: readonly SealRow[]): string {
  const counts = TONES.map((tone) => ({ tone, count: rows.filter((row) => sealTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  return live.slice().sort((a, b) => b.count - a.count || TONES.indexOf(a.tone) - TONES.indexOf(b.tone))[0].tone;
}

export function sealShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentSeals(rows: readonly SealRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = sealState(row.note);
    const band = state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenSeals(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedSeals(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleSeal(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleSealReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSealReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSealBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleSealCustomers(
  rows: readonly SealRow[],
  band: SealBand | "blank" | null,
  tone: SealTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: SealShape,
): SealRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = sealState(row.note);
    const mark = state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && sealTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogSeal(row.note)) return false;
    if (shape === "wide" && sealBand(row.note) !== "wide") return false;
    if (shape === "house" && sealTone(row.note) !== "house") return false;
    if (text) {
      const hay = `${row.label || ""} ${sealCopy(row.note)} ${sealOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeSealBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeSealTone(raw: string): string {
  return raw === "house" || raw === "script" || raw === "road" ? raw : "all";
}

export function sealBandArg(filter: string): SealBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "wide" || filter === "dot" || filter === "stem") return filter;
  return null;
}

export function sealToneArg(filter: string): SealTone | null {
  if (filter === "house" || filter === "script" || filter === "road") return filter;
  return null;
}

export function sealsCsv(rows: readonly SealRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of sealBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogSealCount(rows)}`);
  lines.push(`tone,house,${houseSealCount(rows)}`);
  lines.push(`tone,script,${rows.filter((row) => sealTone(row.note) === "script").length}`);
  lines.push(`tone,road,${rows.filter((row) => sealTone(row.note) === "road").length}`);
  return lines.join("\n");
}

export function sealRowsCsv(rows: readonly SealRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,seal,band,tone,catalog,reviewed"];
  for (const row of rows) {
    const state = sealState(row.note);
    const band = state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      sealOf(row.note),
      band,
      state === "set" ? sealTone(row.note) : "",
      catalogSeal(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}
