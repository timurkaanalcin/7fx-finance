/**
 * Courtesy cards for the retention desk, and the country already stored on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_courtesy_card (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   agent text not null default '',
 *   hour integer,
 *   tone text not null default '',
 *   desk text not null default '',
 *   stage text not null default '',
 *   weight integer,
 *   window integer,
 *   tags text not null default '',
 *   snooze integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_country_seal_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_country_seal_review (
 *   customer_id text primary key
 * );
 */

export const CCR_KEY = "crmv4-courtesy-card";
export const CCR_VIEW_KEY = "crmv4-courtesy-views";
export const CCR_DENSITY_KEY = "crmv4-courtesy-density";
export const SEAL_KEY = "crmv4-country-seal-hide";
export const SEAL_REVIEW_KEY = "crmv4-country-seal-review";

export type CcrTone = "blank" | "calm" | "brisk" | "warm" | "firm";

export type CcrStage = "blank" | "draft" | "ring" | "done";

export type CcrTray = "open" | "held" | "closed";

export type HourPick = "blank" | "dawn" | "day" | "night" | "peak" | "quiet";

export type CcrDensity = "roomy" | "tight";

export type CcrSort = "hour" | "title";

export type Courtesy = {
  id: string;
  title: string;
  note: string;
  agent: string;
  hour: number | null;
  tone: string;
  desk: string;
  stage: string;
  weight: number | null;
  window: number | null;
  tags: string[];
  snooze: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type CcrView = {
  id: string;
  name: string;
  tray: CcrTray;
  query: string;
  agent: string;
  tone: string;
  desk: string;
  stage: string;
  hour: string;
  weight: string;
  window: string;
};

export type CcrCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  snoozed: number;
  house: number;
};

export type SealState = "" | "set" | "clear";

export type SealBand = "" | "pair" | "trio" | "span";

export type SealTone = "" | "soft" | "hard";

export type SealShape = "all" | "catalog" | "span" | "soft";

export type SealValue =
  | { country?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type SealRow = { id?: string; note?: SealValue; label?: string | null };

export type SealBandLine = { band: string; count: number };

export type SealToneLine = { tone: string; count: number };

const AUDITS = ["save", "edit", "stage", "pin", "unpin", "hold", "lift", "close", "reopen", "tone", "tag", "snooze"] as const;

const TONES = ["calm", "brisk", "warm", "firm"] as const;

const STAGES = ["draft", "ring", "done"] as const;

const STAGE_ORDER = ["", "draft", "ring", "done"] as const;

const HOUR_PICKS = ["blank", "dawn", "day", "night", "peak", "quiet"] as const;

const PEAK_HOURS = new Set([9, 15]);

const QUIET_HOURS = new Set([2, 4]);

const DAWN_HOURS = new Set([6, 7, 8]);

const NIGHT_HOURS = new Set([20, 21, 22]);

const HOUSE = new Set(["NY", "LN", "DX"]);

const SEAL_BANDS = ["pair", "trio", "span"] as const;

const TONE_MARKS = ["soft", "hard"] as const;

const CATALOG = new Set(["TR", "DE", "AE"]);

const SEAL_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const CARD_CAP = 6;

const VIEW_CAP = 3;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CcrTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function toneName(raw: unknown): Exclude<CcrTone, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<CcrTone, "blank">) : "";
}

function stageName(raw: unknown): Exclude<CcrStage, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (STAGES as readonly string[]).includes(text) ? (text as Exclude<CcrStage, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function cardLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function cardNote(raw: unknown): string {
  return clip(raw, 60);
}

/** A blank agent stays blank. It is not filled in. */
export function agentLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A desk is two letters. Anything else stays blank. Letters are stored in capitals. */
export function deskOf(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : "";
}

/**
 * An hour is an integer from 0 through 23.
 * A blank value stays unset. 24 is not an hour.
 * A leading zero is not an hour. The first hour is 0.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 0 || raw > 23) return null;
    return raw;
  }
  const text = clip(raw, 4);
  if (!/^(0|[1-9]\d?)$/.test(text)) return null;
  const value = Number(text);
  return value <= 23 ? value : null;
}

/** A weight is 1, 3, or 5. A blank value stays unset. A leading zero is not a weight. */
export function weightOf(raw: unknown): 1 | 3 | 5 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 5 || raw === "5") return 5;
  return null;
}

/** A window is 10, 20, or 40 minutes. A blank value stays unset. A leading zero is not a window. */
export function windowOf(raw: unknown): 10 | 20 | 40 | null {
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  if (raw === 40 || raw === "40") return 40;
  return null;
}

/** A snooze is 0, 10, or 20 minutes. Anything else stays unset. */
export function snoozeOf(raw: unknown): 0 | 10 | 20 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  return null;
}

/** Night is 20, 21, and 22. Dawn is 6, 7, and 8. Every other hour is day. */
export function hourBand(hour: unknown): "blank" | "night" | "dawn" | "day" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (NIGHT_HOURS.has(value)) return "night";
  if (DAWN_HOURS.has(value)) return "dawn";
  return "day";
}

/** Peak hours are 9 and 15. An unset hour is not a peak. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAK_HOURS.has(value);
}

/** Quiet hours are 2 and 4. 9 and 15 are not quiet. An unset hour is not quiet. */
export function quietHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && QUIET_HOURS.has(value);
}

/**
 * The shortest signed step from the saved hour to the typed hour.
 * The ring wraps at 24. A step of 12 stays. A step of -12 stays.
 */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;
  return diff;
}

/** NY, LN, and DX are house desks. A blank desk is not. */
export function houseDesk(desk: unknown): boolean {
  return HOUSE.has(deskOf(desk));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): CcrDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Hour or title. Anything else stays on the hour. */
export function sortMode(raw: unknown): CcrSort {
  return raw === "title" ? "title" : "hour";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return /^[a-z]+$/.test(text) ? text : "";
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

function readOne(raw: unknown): Courtesy | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<Courtesy>;
  const id = clip(row.id, 24);
  const title = cardLine(row.title);
  if (!id || !title) return null;
  const snooze = snoozeOf(row.snooze);
  return {
    id,
    title,
    note: cardNote(row.note),
    agent: agentLabel(row.agent),
    hour: hourOf(row.hour),
    tone: toneName(row.tone),
    desk: deskOf(row.desk),
    stage: stageName(row.stage),
    weight: weightOf(row.weight),
    window: windowOf(row.window),
    tags: tagsOf(row.tags),
    snooze: snooze === null ? 0 : snooze,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readCards(raw: unknown): Courtesy[] {
  if (!Array.isArray(raw)) return [];
  const out: Courtesy[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, CARD_CAP);
}

export function addCard(
  cards: readonly Courtesy[],
  card: {
    id: string;
    title: string;
    note?: string;
    agent?: string;
    hour?: unknown;
    tone?: string;
    desk?: string;
    stage?: string;
    weight?: unknown;
    window?: unknown;
    tags?: unknown;
    snooze?: unknown;
  },
): Courtesy[] {
  const current = readCards(cards);
  const id = String(card.id || "").trim();
  const title = cardLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const snooze = snoozeOf(card.snooze);
  const next: Courtesy = {
    id,
    title,
    note: cardNote(card.note),
    agent: agentLabel(card.agent),
    hour: hourOf(card.hour),
    tone: toneName(card.tone),
    desk: deskOf(card.desk),
    stage: stageName(card.stage),
    weight: weightOf(card.weight),
    window: windowOf(card.window),
    tags: tagsOf(card.tags),
    snooze: snooze === null ? 0 : snooze,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

export function cycleStage(cards: readonly Courtesy[], id: string): Courtesy[] {
  return readCards(cards).map((card) => {
    if (card.id !== id) return card;
    const at = STAGE_ORDER.indexOf(card.stage as (typeof STAGE_ORDER)[number]);
    const next = at < 0 || at >= STAGES.length ? STAGES[0] : STAGES[at % STAGES.length];
    if (!next || next === card.stage) return card;
    return { ...card, stage: next, audit: "stage" };
  });
}

export function setCardPin(cards: readonly Courtesy[], id: string, pinned: boolean): Courtesy[] {
  return readCards(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setCardHold(cards: readonly Courtesy[], id: string, held: boolean): Courtesy[] {
  return readCards(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "lift" } : card));
}

export function setCardClose(cards: readonly Courtesy[], id: string, closed: boolean): Courtesy[] {
  return readCards(cards).map((card) => (card.id === id ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editCard(cards: readonly Courtesy[], id: string, title: string): Courtesy[] {
  const current = readCards(cards);
  const next = cardLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editCardNote(cards: readonly Courtesy[], id: string, note: string): Courtesy[] {
  const current = readCards(cards);
  const next = cardNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

/** A tag that is already on the card, or a third tag, is left out. */
export function addCardTag(cards: readonly Courtesy[], id: string, tag: unknown): Courtesy[] {
  const next = tagOf(tag);
  if (!next) return readCards(cards);
  return readCards(cards).map((card) => {
    if (card.id !== id || card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

export function dropCardTag(cards: readonly Courtesy[], id: string, tag: unknown): Courtesy[] {
  const next = tagOf(tag);
  if (!next) return readCards(cards);
  return readCards(cards).map((card) => {
    if (card.id !== id || !card.tags.includes(next)) return card;
    return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
  });
}

/** An unknown snooze is left as it is. 0 clears the snooze. */
export function setCardSnooze(cards: readonly Courtesy[], id: string, snooze: unknown): Courtesy[] {
  const next = snoozeOf(snooze);
  if (next === null) return readCards(cards);
  return readCards(cards).map((card) => (card.id === id && card.snooze !== next ? { ...card, snooze: next, audit: "snooze" } : card));
}

export function bulkCardTone(cards: readonly Courtesy[], ids: readonly string[], tone: unknown): Courtesy[] {
  const next = toneName(tone);
  if (!next) return readCards(cards);
  const picked = new Set(ids);
  return readCards(cards).map((card) => (picked.has(card.id) && card.tone !== next ? { ...card, tone: next, audit: "tone" } : card));
}

export function bulkCardPin(cards: readonly Courtesy[], ids: readonly string[], pinned: boolean): Courtesy[] {
  const picked = new Set(ids);
  return readCards(cards).map((card) => (picked.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkCardClose(cards: readonly Courtesy[], ids: readonly string[], closed: boolean): Courtesy[] {
  const picked = new Set(ids);
  return readCards(cards).map((card) => (picked.has(card.id) ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

export function bulkCardTag(cards: readonly Courtesy[], ids: readonly string[], tag: unknown): Courtesy[] {
  return ids.reduce((rows, id) => addCardTag(rows, id, tag), readCards(cards));
}

export function resetCards(): Courtesy[] {
  return [];
}

function inTray(card: Courtesy, tray: CcrTray): boolean {
  if (tray === "closed") return card.closed;
  if (tray === "held") return card.held && !card.closed;
  return !card.held && !card.closed;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "peak") return peakHour(hour);
  if (pick === "quiet") return quietHour(hour);
  return hourBand(hour) === pick;
}

/** An open card whose hour sits more than four steps behind the desk hour. A snooze, a hold, or a close is not late. */
export function lateCard(card: Courtesy, desk: unknown): boolean {
  const gap = hourGap(card.hour, desk);
  return inTray(card, "open") && card.snooze === 0 && gap !== null && gap > 4;
}

/** An open card with a ten-minute window is the reminder. A snooze, a hold, or a close is not. */
export function soonCard(card: Courtesy): boolean {
  return inTray(card, "open") && card.snooze === 0 && card.window === 10;
}

/** Open cards that are late or soon. A snoozed card stays off the reminder list. */
export function reminderCards(cards: readonly Courtesy[], desk: unknown): Courtesy[] {
  return readCards(cards).filter((card) => lateCard(card, desk) || soonCard(card));
}

/** Search matches the title, the note, the agent, and the tags. The hour and the tone are not part of the query. */
export function visibleCards(
  cards: readonly Courtesy[],
  tray: CcrTray,
  query: string,
  agent: string | null,
  tone: CcrTone | null,
  desk: string | null,
  stage: CcrStage | null,
  exact: number | null,
  pick: HourPick | null,
  weight: number | "blank" | null,
  span: number | "blank" | null,
  ringOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): Courtesy[] {
  const text = query.trim().toLowerCase();
  const wantAgent = agent === null ? null : agentLabel(agent);
  return readCards(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (wantAgent !== null && card.agent !== wantAgent) return false;
    if (tone === "blank" && card.tone) return false;
    if (tone && tone !== "blank" && card.tone !== tone) return false;
    if (desk !== null && card.desk !== desk) return false;
    if (stage === "blank" && card.stage) return false;
    if (stage && stage !== "blank" && card.stage !== stage) return false;
    if (!hourHit(card.hour, exact, pick)) return false;
    if (weight === "blank" && card.weight !== null) return false;
    if (typeof weight === "number" && card.weight !== weight) return false;
    if (span === "blank" && card.window !== null) return false;
    if (typeof span === "number" && card.window !== span) return false;
    if (ringOnly && card.stage !== "ring") return false;
    if (peakOnly && !peakHour(card.hour)) return false;
    if (houseOnly && !houseDesk(card.desk)) return false;
    if (quietOnly && !quietHour(card.hour)) return false;
    if (awakeOnly && card.snooze !== 0) return false;
    if (!text) return true;
    return `${card.title} ${card.note} ${card.agent} ${card.tags.join(" ")}`.toLowerCase().includes(text);
  });
}

export function sortCards(cards: readonly Courtesy[], mode: CcrSort): Courtesy[] {
  const rows = readCards(cards);
  if (mode === "title") return rows.slice().sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  return rows.slice().sort((a, b) => (a.hour ?? 99) - (b.hour ?? 99) || a.title.localeCompare(b.title));
}

export function cardTimeline(cards: readonly Courtesy[], query: string): Courtesy[] {
  return sortCards(visibleCards(cards, "open", query, null, null, null, null, null, null, null, null, false, false, false, false, false).filter((card) => card.hour !== null), "hour");
}

export function cardCounts(cards: readonly Courtesy[], desk: unknown): CcrCounts {
  const rows = readCards(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    closed: rows.filter((card) => inTray(card, "closed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => peakHour(card.hour) && inTray(card, "open")).length,
    late: rows.filter((card) => lateCard(card, desk)).length,
    soon: rows.filter((card) => soonCard(card)).length,
    snoozed: rows.filter((card) => inTray(card, "open") && card.snooze !== 0).length,
    house: rows.filter((card) => houseDesk(card.desk)).length,
  };
}

export function cardShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function toneCounts(cards: readonly Courtesy[]): { tone: Exclude<CcrTone, "blank">; count: number }[] {
  const rows = readCards(cards);
  return TONES.map((tone) => ({ tone, count: rows.filter((card) => card.tone === tone).length })).filter((row) => row.count > 0);
}

export function usedHours(cards: readonly Courtesy[]): number {
  return new Set(readCards(cards).map((card) => card.hour).filter((hour): hour is number => hour !== null)).size;
}

export function clashHourIds(cards: readonly Courtesy[]): string[] {
  const open = readCards(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.tone);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.tone === card.tone && other.hour === card.hour)).map((card) => card.id);
}

export function clashHourCount(cards: readonly Courtesy[]): number {
  return clashHourIds(cards).length;
}

export function weightClashIds(cards: readonly Courtesy[]): string[] {
  const open = readCards(cards).filter((card) => inTray(card, "open") && card.weight !== null);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.weight === card.weight)).map((card) => card.id);
}

export function weightClashCount(cards: readonly Courtesy[]): number {
  return weightClashIds(cards).length;
}

export function nextCard(cards: readonly Courtesy[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readCards(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.stage !== "done" && card.snooze === 0);
  if (!waiting.length) return "";
  const byHour = (a: Courtesy, b: Courtesy) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

/**
 * The tone with the fewest open cards.
 * A tie keeps firm, then calm, then brisk, then warm.
 * Cards with no tone are not a load. An empty desk still suggests firm.
 */
export function suggestTone(cards: readonly Courtesy[]): Exclude<CcrTone, "blank"> {
  const rows = readCards(cards).filter((card) => inTray(card, "open"));
  const order = ["firm", "calm", "brisk", "warm"] as const;
  let best: Exclude<CcrTone, "blank"> = "firm";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const tone of order) {
    const count = rows.filter((card) => card.tone === tone).length;
    if (count < bestCount) {
      best = tone;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The agent carrying the fewest open cards.
 * A tie keeps the earlier name. A blank agent is not a load.
 * An empty desk stays blank.
 */
export function suggestAgent(cards: readonly Courtesy[]): string {
  const rows = readCards(cards).filter((card) => inTray(card, "open") && card.agent);
  if (!rows.length) return "";
  const names = cardAgents(rows).slice().sort((a, b) => a.localeCompare(b));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = rows.filter((card) => card.agent === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The window used most on open cards. A tie keeps 20, then 10, then 40. An empty desk suggests 20. */
export function suggestWindow(cards: readonly Courtesy[]): 10 | 20 | 40 {
  const rows = readCards(cards).filter((card) => inTray(card, "open") && card.window !== null);
  const order = [20, 10, 40] as const;
  let best: 10 | 20 | 40 = 20;
  let bestCount = -1;
  for (const span of order) {
    const count = rows.filter((card) => card.window === span).length;
    if (count > bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

export function fairAgent(cards: readonly Courtesy[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = agentLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestAgent(cards);
  const open = readCards(cards).filter((card) => inTray(card, "open"));
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  let best = sorted[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of sorted) {
    const count = open.filter((card) => card.agent === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The agent carrying the most open cards. A tie keeps the earlier name. A blank agent is not a load. */
export function busiestAgent(cards: readonly Courtesy[]): string {
  const rows = readCards(cards).filter((card) => inTray(card, "open") && card.agent);
  if (!rows.length) return "";
  const names = cardAgents(rows).slice().sort((a, b) => a.localeCompare(b));
  let best = names[0];
  let bestCount = -1;
  for (const name of names) {
    const count = rows.filter((card) => card.agent === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function cardAgents(cards: readonly Courtesy[]): string[] {
  const out: string[] = [];
  for (const card of readCards(cards)) {
    if (card.agent && !out.includes(card.agent)) out.push(card.agent);
  }
  return out;
}

export function cardDesks(cards: readonly Courtesy[]): string[] {
  const out: string[] = [];
  for (const card of readCards(cards)) {
    if (card.desk && !out.includes(card.desk)) out.push(card.desk);
  }
  return out;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function cardCopy(card: Courtesy, desk: unknown): string {
  const gap = hourGap(card.hour, desk);
  return [card.title, card.agent, card.hour ?? "", card.tone, card.desk, card.stage, card.weight ?? "", card.window ?? "", card.tags.join(" "), card.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The gap and the late mark use the hour you pass. */
export function cardsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,agent,hour,tone,desk,stage,weight,window,tags,snooze,pinned,held,closed,gap,late,soon,house,note,audit"];
  for (const card of readCards(raw)) {
    const gap = hourGap(card.hour, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.agent),
      card.hour === null ? "" : String(card.hour),
      card.tone,
      csvCell(card.desk),
      card.stage,
      card.weight === null ? "" : String(card.weight),
      card.window === null ? "" : String(card.window),
      csvCell(card.tags.join(" ")),
      String(card.snooze),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCard(card, desk) ? "1" : "0",
      soonCard(card) ? "1" : "0",
      houseDesk(card.desk) ? "1" : "0",
      csvCell(card.note),
      card.audit,
    ].join(","));
  }
  return lines.join("\n");
}

function agentSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return agentLabel(raw) || "all";
}

function toneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return toneName(raw) || "all";
}

function deskSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return deskOf(raw) || "all";
}

function stageSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stageName(raw) || "all";
}

export function activeAgent(filter: string, agents: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const name = agentLabel(filter);
  return name && agents.includes(name) ? name : "all";
}

export function activeTone(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tone = toneName(filter);
  return tone && tones.includes(tone) ? tone : "all";
}

export function activeDesk(filter: string, desks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const desk = deskOf(filter);
  return desk && desks.includes(desk) ? desk : "all";
}

export function activeStage(filter: string, stages: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const stage = stageName(filter);
  return stage && stages.includes(stage) ? stage : "all";
}

export function activeHour(filter: string): string {
  if (filter === "all") return "all";
  return (HOUR_PICKS as readonly string[]).includes(filter) ? filter : "all";
}

export function activeWeight(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  return filter === "1" || filter === "3" || filter === "5" ? filter : "all";
}

export function activeWindow(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  return filter === "10" || filter === "20" || filter === "40" ? filter : "all";
}

export function agentArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return agentLabel(filter);
}

export function toneArg(filter: string): CcrTone | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const tone = toneName(filter);
  return tone ? tone : null;
}

export function deskArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return deskOf(filter);
}

export function stageArg(filter: string): CcrStage | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const stage = stageName(filter);
  return stage ? stage : null;
}

export function hourArg(filter: string): { exact: number | null; pick: HourPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if ((HOUR_PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as HourPick };
  const exact = hourOf(filter);
  return exact === null ? { exact: null, pick: null } : { exact, pick: null };
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

export function windowArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return windowOf(filter);
}

export function readCardViews(raw: unknown): CcrView[] {
  if (!Array.isArray(raw)) return [];
  const out: CcrView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CcrView>;
    const id = clip(row.id, 24);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      agent: agentSlot(row.agent),
      tone: toneSlot(row.tone),
      desk: deskSlot(row.desk),
      stage: stageSlot(row.stage),
      hour: activeHour(String(row.hour || "all")),
      weight: activeWeight(String(row.weight || "all")),
      window: activeWindow(String(row.window || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCardView(views: readonly CcrView[], view: CcrView): CcrView[] {
  const current = readCardViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    agent: agentSlot(view.agent),
    tone: toneSlot(view.tone),
    desk: deskSlot(view.desk),
    stage: stageSlot(view.stage),
    hour: activeHour(view.hour),
    weight: activeWeight(view.weight),
    window: activeWindow(view.window),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropCardView(views: readonly CcrView[], id: string): CcrView[] {
  return readCardViews(views).filter((view) => view.id !== id);
}

/**
 * A country seal is the country already stored on the account.
 * Lengths that stay are 2, 3, and 5. A blank value stays unset.
 * Spaces and hyphens are ignored. Letters are stored in capitals.
 */
export function countryToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim().replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z]+$/.test(text)) return null;
  const size = text.length;
  if (size !== 2 && size !== 3 && size !== 5) return null;
  return text;
}

function sealBody(value: SealValue): { text: string | null; explicit: boolean } | null {
  if (typeof value === "number") return { text: null, explicit: false };
  if (typeof value === "string") {
    if (value.trim() === "") return { text: null, explicit: true };
    const text = countryToken(value);
    return { text, explicit: text !== null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (SEAL_BLOCK.some((key) => key in value)) return null;
  if (!("country" in value)) return { text: null, explicit: false };
  const inner = value.country;
  if (inner === null || inner === "") return { text: null, explicit: true };
  const text = countryToken(inner);
  if (text === null) return { text: null, explicit: false };
  return { text, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set seal is a country of length 2, 3, or 5.
 * A clear seal is an explicit blank. A missing field stays unmarked.
 */
export function sealState(value: SealValue): SealState {
  const body = sealBody(value);
  if (!body) return "";
  if (body.text !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The country letters, or a blank string when the seal is clear or unmarked. */
export function sealCopy(value: SealValue): string {
  return sealBody(value)?.text || "";
}

/**
 * Pair is 2. Trio is 3. Span is 5.
 * A blank country has no band.
 */
export function sealBand(value: SealValue): SealBand {
  const text = sealBody(value)?.text;
  if (!text) return "";
  if (text.length === 2) return "pair";
  if (text.length === 3) return "trio";
  return "span";
}

/** Soft when the country ends with a vowel. Hard when it does not. A blank country has no tone. */
export function sealTone(value: SealValue): SealTone {
  const text = sealBody(value)?.text;
  if (!text) return "";
  return "AEIOU".includes(text[text.length - 1]) ? "soft" : "hard";
}

/** TR, DE, and AE are the house catalog. */
export function catalogSeal(value: SealValue): boolean {
  const text = sealBody(value)?.text;
  if (!text) return false;
  return CATALOG.has(text);
}

/** A country of 5 letters. A clear country is not wide. */
export function wideSeal(value: SealValue): boolean {
  const text = sealBody(value)?.text;
  if (!text) return false;
  return text.length === 5;
}

export function softSeal(value: SealValue): boolean {
  return sealTone(value) === "soft";
}

export function catalogSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealState(row.note) === "set" && catalogSeal(row.note)).length;
}

export function wideSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealState(row.note) === "set" && wideSeal(row.note)).length;
}

export function softSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealState(row.note) === "set" && softSeal(row.note)).length;
}

/** How many distinct countries are carried by two or more loaded rows. */
export function sharedSealCount(rows: readonly SealRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (sealState(row.note) !== "set") continue;
    const text = sealCopy(row.note);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function sealBands(rows: readonly SealRow[]): SealBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = sealState(row.note);
    if (state === "") continue;
    const band = state === "set" ? sealBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: SealBandLine[] = [];
  for (const band of ["", ...SEAL_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function sealTones(rows: readonly SealRow[]): SealToneLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = sealState(row.note);
    if (state !== "set") continue;
    const tone = sealTone(row.note);
    map.set(tone, (map.get(tone) || 0) + 1);
  }
  const out: SealToneLine[] = [];
  for (const tone of TONE_MARKS) {
    const count = map.get(tone);
    if (count) out.push({ tone, count });
  }
  return out;
}

/** The band with the most set countries. A tie keeps pair, then trio, then span. A clear country is not a lead. */
export function leadingSeal(rows: readonly SealRow[]): string {
  const named = sealBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => SEAL_BANDS.indexOf(band as (typeof SEAL_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The tone with the most set countries. A tie keeps soft, then hard. */
export function leadingSealTone(rows: readonly SealRow[]): string {
  const named = sealTones(rows);
  if (!named.length) return "";
  const order = (tone: string) => TONE_MARKS.indexOf(tone as (typeof TONE_MARKS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.tone) - order(b.tone))[0].tone;
}

export function sealShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((SEAL_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentSeals(rows: readonly SealRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = sealState(row.note);
    const token = state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenSeals(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandOwner(item);
    if (!band || !allow.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleSeal(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandOwner(band);
  if (!token || !present.includes(token)) return readHiddenSeals(hidden, present);
  const current = readHiddenSeals(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleSealBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function activeSealBand(filter: string, present: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const band = bandOwner(filter);
  return band && present.includes(band) ? band : "all";
}

export function sealBandArg(filter: string): SealBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandOwner(filter);
  return band && band !== "blank" ? (band as SealBand) : null;
}

function toneOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (TONE_MARKS as readonly string[]).includes(text) ? text : "";
}

export function activeSealTone(filter: string): string {
  if (filter === "all") return "all";
  return toneOwner(filter) || "all";
}

export function sealToneArg(filter: string): SealTone | null {
  const tone = toneOwner(filter);
  return tone ? (tone as SealTone) : null;
}

function rowId(row: SealRow): string {
  return String(row.id || "");
}

export function readReviewedSeals(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (!id || !allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function toggleSealReview(reviewed: readonly string[], id: string, ids: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !ids.includes(token)) return readReviewedSeals(reviewed, ids);
  const current = readReviewedSeals(reviewed, ids);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkSealReview(reviewed: readonly string[], ids: readonly string[], allow: readonly string[], on: boolean): string[] {
  const current = new Set(readReviewedSeals(reviewed, allow));
  for (const id of ids) {
    const token = String(id || "").trim();
    if (!token || !allow.includes(token)) continue;
    if (on) current.add(token);
    else current.delete(token);
  }
  return readReviewedSeals(Array.from(current), allow);
}

/** Search matches the name and the country. The band and the tone are not part of the query. */
export function visibleSealCustomers<T extends SealRow>(
  rows: readonly T[],
  band: SealBand | "blank" | null,
  tone: SealTone | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: SealShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = sealState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && sealBand(row.note) !== band) return false;
    if (tone !== null && sealTone(row.note) !== tone) return false;
    if (shape === "catalog" && !catalogSeal(row.note)) return false;
    if (shape === "span" && (state !== "set" || sealBand(row.note) !== "span")) return false;
    if (shape === "soft" && !softSeal(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    const country = sealCopy(row.note);
    return `${row.label || ""} ${country}`.toLowerCase().includes(text);
  });
}

/** The CSV is the bands and tones on this page. */
export function sealsCsv(rows: readonly SealRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = sealState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", "set", "clear"]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of sealBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of sealTones(rows)) lines.push(["tone", csvCell(line.tone), String(line.count)].join(","));
  lines.push(["shape", "catalog", String(catalogSealCount(rows))].join(","));
  lines.push(["shape", "wide", String(wideSealCount(rows))].join(","));
  lines.push(["shape", "soft", String(softSealCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedSealCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function sealRowsCsv(rows: readonly SealRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,tone,country,catalog,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(sealBand(row.note)),
      csvCell(sealTone(row.note)),
      csvCell(sealCopy(row.note)),
      catalogSeal(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
