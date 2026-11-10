/**
 * Local cloakroom passes, and the login flag already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cloak_pass (
 *   id text primary key,
 *   line text not null,
 *   bearer text not null default '',
 *   bell integer,
 *   wing text not null default '',
 *   stamp text not null default '',
 *   tone text not null default '',
 *   starred boolean not null default false,
 *   queued boolean not null default false,
 *   folded boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_login_latch_hide (
 *   latch text primary key
 * );
 */

export const CLOAK_KEY = "crmv4-cloak-passes";
export const CLOAK_VIEW_KEY = "crmv4-cloak-views";
export const LATCH_KEY = "crmv4-latch-hide";

export type CloakTone = "blank" | "calm" | "keen" | "urgent";

export type CloakWing = "blank" | "north" | "east" | "south" | "west";

export type CloakTray = "live" | "queued" | "folded";

export type BellPick = "blank" | "morning" | "afternoon" | "night" | "quiet" | "day";

export type CloakCard = {
  id: string;
  line: string;
  bearer: string;
  bell: number | null;
  wing: string;
  stamp: string;
  tone: string;
  starred: boolean;
  queued: boolean;
  folded: boolean;
  audit: string;
};

export type CloakView = {
  id: string;
  name: string;
  tray: CloakTray;
  query: string;
  bearer: string;
  wing: string;
  stamp: string;
  tone: string;
  bell: string;
};

export type CloakCounts = {
  live: number;
  queued: number;
  folded: number;
  starred: number;
  night: number;
};

export type LatchMark = "" | "open" | "shut";

export type PhoneSpan = "" | "short" | "mid" | "long";

export type PhoneMark = "" | "plus" | "local";

export type LatchValue =
  | {
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
      withdrawalsEnabled?: unknown;
      ftd?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      country?: unknown;
      desk?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type LatchRow = { latch?: LatchValue; label?: string | null; phone?: string | null };

export type LatchLine = { latch: string; count: number };

export type SpanLine = { span: string; count: number };

export type MarkLine = { mark: string; count: number };

const AUDITS = ["save", "edit", "tone", "star", "unstar", "queue", "release", "fold", "unfold", "wing"] as const;

const WINGS = ["north", "east", "south", "west"] as const;

const TONES = ["calm", "keen", "urgent"] as const;

const TONE_ORDER = ["", "calm", "keen", "urgent"] as const;

const PICKS = ["blank", "morning", "afternoon", "night", "quiet", "day"] as const;

const WATCHES = ["morning", "afternoon", "night"] as const;

const QUIET = new Set([0, 1, 2, 3, 4, 5, 22, 23]);

const LATCHES = ["open", "shut"] as const;

const SPANS = ["short", "mid", "long"] as const;

const MARKS = ["plus", "local"] as const;

const LATCH_BLOCK = ["tradingEnabled", "withdrawalsEnabled", "ftd", "name", "email", "phone", "country", "desk"] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CloakTray {
  return raw === "queued" || raw === "folded" ? raw : "live";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function wingName(raw: unknown): Exclude<CloakWing, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WINGS as readonly string[]).includes(text) ? (text as Exclude<CloakWing, "blank">) : "";
}

function toneName(raw: unknown): Exclude<CloakTone, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<CloakTone, "blank">) : "";
}

/** A blank line is left out. The saved line stays short. */
export function cloakLine(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank bearer stays blank. It is not filled in. */
export function bearerLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank stamp stays blank. It is not filled in. */
export function cloakStamp(raw: unknown): string {
  return clip(raw, 6);
}

/**
 * A bell is an hour from 0 through 23.
 * A blank value stays unset. 24 and -1 are not bells.
 * A leading zero is the same hour: 08 is 8, and 00 is 0.
 */
export function bellOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 23) return raw;
  if (typeof raw === "string" && /^(?:[0-9]|0[0-9]|1[0-9]|2[0-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** North, east, south, west, or blank. Anything else is blank. */
export function wingOf(raw: unknown): CloakWing {
  return wingName(raw) || "blank";
}

/** Calm, keen, urgent, or blank. Anything else is blank. */
export function toneOf(raw: unknown): CloakTone {
  return toneName(raw) || "blank";
}

/** Morning is 0–11. Afternoon is 12–17. Night is 18–23. An unset bell is blank. */
export function watchOf(bell: unknown): "blank" | "morning" | "afternoon" | "night" {
  const hour = bellOf(bell);
  if (hour === null) return "blank";
  if (hour <= 11) return "morning";
  if (hour <= 17) return "afternoon";
  return "night";
}

/** Quiet hours are 22, 23, and 0 through 5. An unset bell is not quiet. */
export function quietBell(bell: unknown): boolean {
  const hour = bellOf(bell);
  return hour !== null && QUIET.has(hour);
}

/** Day hours are 6 through 21. An unset bell is not day. */
export function dayBell(bell: unknown): boolean {
  const hour = bellOf(bell);
  return hour !== null && !QUIET.has(hour);
}

/** The typed bell minus the pass bell. A positive gap is past the bell. The clock does not wrap. */
export function cloakGap(bell: unknown, desk: unknown): number | null {
  const from = bellOf(bell);
  const at = bellOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readCloaks(raw: unknown): CloakCard[] {
  if (!Array.isArray(raw)) return [];
  const out: CloakCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CloakCard>;
    const id = String(row.id || "").trim();
    const line = cloakLine(row.line);
    if (!id || !line || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      line,
      bearer: bearerLabel(row.bearer),
      bell: bellOf(row.bell),
      wing: wingName(row.wing),
      stamp: cloakStamp(row.stamp),
      tone: toneName(row.tone),
      starred: row.starred === true,
      queued: row.queued === true,
      folded: row.folded === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 12);
}

export function addCloak(
  cards: readonly CloakCard[],
  card: { id: string; line: string; bearer?: string; bell?: unknown; wing?: string; stamp?: string; tone?: string },
): CloakCard[] {
  const current = readCloaks(cards);
  const id = String(card.id || "").trim();
  const line = cloakLine(card.line);
  if (!id || !line || current.some((item) => item.id === id || item.line === line)) return current;
  const next: CloakCard = {
    id,
    line,
    bearer: bearerLabel(card.bearer),
    bell: bellOf(card.bell),
    wing: wingName(card.wing),
    stamp: cloakStamp(card.stamp),
    tone: toneName(card.tone),
    starred: false,
    queued: false,
    folded: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 12);
}

/** Blank becomes calm. Calm becomes keen, keen becomes urgent, and urgent returns to calm. */
export function cycleCloakTone(cards: readonly CloakCard[], id: string): CloakCard[] {
  return readCloaks(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TONE_ORDER.indexOf(card.tone as (typeof TONE_ORDER)[number]);
    const next = at < 0 || at >= TONES.length ? TONES[0] : TONES[at % TONES.length];
    if (!next || next === card.tone) return card;
    return { ...card, tone: next, audit: "tone" };
  });
}

export function setCloakStar(cards: readonly CloakCard[], id: string, starred: boolean): CloakCard[] {
  return readCloaks(cards).map((card) => (card.id === id ? { ...card, starred, audit: starred ? "star" : "unstar" } : card));
}

export function setCloakQueued(cards: readonly CloakCard[], id: string, queued: boolean): CloakCard[] {
  return readCloaks(cards).map((card) => (card.id === id ? { ...card, queued, audit: queued ? "queue" : "release" } : card));
}

export function setCloakFolded(cards: readonly CloakCard[], id: string, folded: boolean): CloakCard[] {
  return readCloaks(cards).map((card) => (card.id === id ? { ...card, folded, audit: folded ? "fold" : "unfold" } : card));
}

/** A blank edit is left out. A duplicate of another line is left out. */
export function editCloak(cards: readonly CloakCard[], id: string, line: string): CloakCard[] {
  const current = readCloaks(cards);
  const next = cloakLine(line);
  if (!next || current.some((card) => card.id !== id && card.line === next)) return current;
  return current.map((card) => (card.id === id && card.line !== next ? { ...card, line: next, audit: "edit" } : card));
}

export function bulkCloakStar(cards: readonly CloakCard[], ids: readonly string[], starred: boolean): CloakCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readCloaks(cards).map((card) => (want.has(card.id) ? { ...card, starred, audit: starred ? "star" : "unstar" } : card));
}

export function bulkCloakFold(cards: readonly CloakCard[], ids: readonly string[], folded: boolean): CloakCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readCloaks(cards).map((card) => (want.has(card.id) ? { ...card, folded, audit: folded ? "fold" : "unfold" } : card));
}

/** A blank or unknown wing is left out. A pass already in that wing is left as it is. */
export function bulkCloakWing(cards: readonly CloakCard[], ids: readonly string[], wing: string): CloakCard[] {
  const name = wingName(wing);
  const current = readCloaks(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.wing !== name ? { ...card, wing: name, audit: "wing" } : card));
}

export function resetCloaks(): CloakCard[] {
  return [];
}

/** Copy uses the line. A blank line copies nothing. */
export function cloakCopy(raw: unknown): string {
  return cloakLine(raw);
}

function inTray(card: CloakCard, tray: CloakTray): boolean {
  if (tray === "folded") return card.folded;
  if (tray === "queued") return card.queued && !card.folded;
  return !card.queued && !card.folded;
}

function bellHit(bell: number | null, exact: number | null, pick: BellPick | null): boolean {
  if (exact !== null) return bell === exact;
  if (pick === null) return true;
  if (pick === "blank") return bell === null;
  if (pick === "quiet") return quietBell(bell);
  if (pick === "day") return dayBell(bell);
  return watchOf(bell) === pick;
}

function toneScore(tone: string): number {
  if (tone === "urgent") return 3;
  if (tone === "keen") return 2;
  if (tone === "calm") return 1;
  return 0;
}

function waitingNight(card: CloakCard): boolean {
  return quietBell(card.bell) && inTray(card, "live");
}

/** Search stays on the line. The bearer, the bell, the wing, the stamp, and the tone are not part of the query. */
export function visibleCloaks(
  cards: readonly CloakCard[],
  tray: CloakTray,
  query: string,
  bearer: string | null,
  wing: CloakWing | null,
  stamp: string | null,
  tone: CloakTone | null,
  exact: number | null,
  pick: BellPick | null,
  urgentOnly: boolean,
  nightOnly: boolean,
): CloakCard[] {
  const text = query.trim().toLowerCase();
  const wantBearer = bearer === null ? null : bearerLabel(bearer);
  const wantStamp = stamp === null ? null : cloakStamp(stamp);
  return readCloaks(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (urgentOnly && card.tone !== "urgent") return false;
      if (wantBearer !== null && bearerLabel(card.bearer) !== wantBearer) return false;
      if (wing !== null && wingOf(card.wing) !== wing) return false;
      if (wantStamp !== null && cloakStamp(card.stamp) !== wantStamp) return false;
      if (tone !== null && toneOf(card.tone) !== tone) return false;
      if (!bellHit(card.bell, exact, pick)) return false;
      if (nightOnly && !waitingNight(card)) return false;
      return !text || card.line.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (toneScore(a.tone) !== toneScore(b.tone)) return toneScore(b.tone) - toneScore(a.tone);
      return a.line.localeCompare(b.line);
    });
}

/** The bell orders the desk. An unset bell stays at the end. Search stays on the line. */
export function cloakTimeline(cards: readonly CloakCard[], query: string): CloakCard[] {
  const text = query.trim().toLowerCase();
  return readCloaks(cards)
    .filter((card) => !text || card.line.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.bell === null && b.bell !== null) return 1;
      if (a.bell !== null && b.bell === null) return -1;
      if (a.bell !== null && b.bell !== null && a.bell !== b.bell) return a.bell - b.bell;
      return a.line.localeCompare(b.line);
    });
}

export function cloakCounts(cards: readonly CloakCard[]): CloakCounts {
  const rows = readCloaks(cards);
  return {
    live: rows.filter((card) => inTray(card, "live")).length,
    queued: rows.filter((card) => inTray(card, "queued")).length,
    folded: rows.filter((card) => inTray(card, "folded")).length,
    starred: rows.filter((card) => card.starred).length,
    night: rows.filter((card) => waitingNight(card)).length,
  };
}

/** Share of the saved passes. A zero total stays at zero. */
export function cloakShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function cloakBearers(cards: readonly CloakCard[]): string[] {
  const out: string[] = [];
  for (const card of readCloaks(cards)) {
    if (card.bearer && !out.includes(card.bearer)) out.push(card.bearer);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function cloakStamps(cards: readonly CloakCard[]): string[] {
  const out: string[] = [];
  for (const card of readCloaks(cards)) {
    if (card.stamp && !out.includes(card.stamp)) out.push(card.stamp);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function cloakWings(cards: readonly CloakCard[]): Exclude<CloakWing, "blank">[] {
  const seen = new Set<string>();
  for (const card of readCloaks(cards)) if (card.wing) seen.add(card.wing);
  return WINGS.filter((wing) => seen.has(wing));
}

export function cloakTones(cards: readonly CloakCard[]): Exclude<CloakTone, "blank">[] {
  const seen = new Set<string>();
  for (const card of readCloaks(cards)) if (card.tone) seen.add(card.tone);
  return TONES.filter((tone) => seen.has(tone));
}

/** How many live passes a bearer still holds. A blank bearer is not a load. */
export function bearerLoad(cards: readonly CloakCard[], bearer: string): number {
  const name = bearerLabel(bearer);
  if (!name) return 0;
  return readCloaks(cards).filter((card) => card.bearer === name && inTray(card, "live")).length;
}

/** Three watches. Index 0 is morning. Index 2 is night. */
export function watchCounts(cards: readonly CloakCard[]): number[] {
  const rows = readCloaks(cards);
  return WATCHES.map((watch) => rows.filter((card) => watchOf(card.bell) === watch).length);
}

/** "all" and "blank" stay. A bearer that is no longer on a pass falls back to all. */
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

/** "all" and "blank" stay. A wing that is no longer on a pass falls back to all. */
export function activeWing(filter: string, wings: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const wing = wingName(filter);
  return wing && wings.includes(wing) ? wing : "all";
}

export function wingArg(filter: string): CloakWing | null {
  if (filter === "blank") return "blank";
  return wingName(filter) || null;
}

/** "all" and "blank" stay. A stamp that is no longer on a pass falls back to all. */
export function activeStamp(filter: string, stamps: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const stamp = cloakStamp(filter);
  return stamp && stamps.includes(stamp) ? stamp : "all";
}

export function stampArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return cloakStamp(filter);
}

/** "all" and "blank" stay. A tone that is no longer on a pass falls back to all. */
export function activeTone(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tone = toneName(filter);
  return tone && tones.includes(tone) ? tone : "all";
}

export function toneArg(filter: string): CloakTone | null {
  if (filter === "blank") return "blank";
  return toneName(filter) || null;
}

/** All, blank, the watches, quiet, day, and the hours 0 through 23 stay. Anything else is all. */
export function activeBell(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const bell = bellOf(filter);
  return bell === null ? "all" : String(bell);
}

export function bellArg(filter: string): { exact: number | null; pick: BellPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as BellPick };
  const bell = bellOf(filter);
  return bell === null ? { exact: null, pick: null } : { exact: bell, pick: null };
}

/** Other passes with the same wing and the same bell. A blank wing or a blank bell clashes with nothing. */
export function cloakClashIds(cards: readonly CloakCard[], id: string): string[] {
  const rows = readCloaks(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.wing || card.bell === null) return [];
  return rows
    .filter((item) => item.id !== id && item.wing === card.wing && item.bell === card.bell)
    .sort((a, b) => a.line.localeCompare(b.line))
    .map((item) => item.id);
}

/** How many saved passes share a wing and a bell with another pass. */
export function clashCloakCount(cards: readonly CloakCard[]): number {
  const rows = readCloaks(cards);
  return rows.filter((card) => cloakClashIds(rows, card.id).length > 0).length;
}

/** Other passes with the same wing and the same stamp. A blank wing or a blank stamp clashes with nothing. */
export function stampClashIds(cards: readonly CloakCard[], id: string): string[] {
  const rows = readCloaks(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.wing || !card.stamp) return [];
  return rows
    .filter((item) => item.id !== id && item.wing === card.wing && item.stamp === card.stamp)
    .sort((a, b) => a.line.localeCompare(b.line))
    .map((item) => item.id);
}

/** How many saved passes share a wing and a stamp with another pass. */
export function stampClashCount(cards: readonly CloakCard[]): number {
  const rows = readCloaks(cards);
  return rows.filter((card) => stampClashIds(rows, card.id).length > 0).length;
}

/**
 * The next live pass at or after the bell you type, skipping urgent.
 * After the last bell, the desk wraps to the earliest live pass that is not urgent.
 */
export function nextCloak(cards: readonly CloakCard[], desk: unknown): string {
  const now = bellOf(desk);
  if (now === null) return "";
  const waiting = readCloaks(cards).filter((card) => inTray(card, "live") && card.bell !== null && card.tone !== "urgent");
  if (!waiting.length) return "";
  const byBell = (a: CloakCard, b: CloakCard) => (a.bell ?? 0) - (b.bell ?? 0) || a.line.localeCompare(b.line);
  const later = waiting.filter((card) => (card.bell ?? 0) >= now).sort(byBell);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBell)[0].id;
}

/**
 * The wing with the fewest live passes.
 * A tie keeps the earlier wing: north, then east, south, and west.
 * Passes with no wing are not a load. An empty desk still suggests north.
 */
export function suggestWing(cards: readonly CloakCard[]): Exclude<CloakWing, "blank"> {
  const rows = readCloaks(cards).filter((card) => inTray(card, "live"));
  let best: Exclude<CloakWing, "blank"> = "north";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const wing of WINGS) {
    const count = rows.filter((card) => card.wing === wing).length;
    if (count < bestCount) {
      best = wing;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the passes saved in this browser. The gap uses the bell you pass. */
export function cloaksCsv(raw: unknown, desk: unknown): string {
  const lines = ["line,bearer,bell,wing,stamp,tone,watch,starred,queued,folded,gap,audit"];
  for (const card of readCloaks(raw)) {
    const gap = cloakGap(card.bell, desk);
    lines.push([
      csvCell(card.line),
      csvCell(card.bearer),
      card.bell === null ? "" : String(card.bell),
      card.wing,
      csvCell(card.stamp),
      card.tone,
      watchOf(card.bell),
      card.starred ? "1" : "0",
      card.queued ? "1" : "0",
      card.folded ? "1" : "0",
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

function wingSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return wingName(raw) || "all";
}

function stampSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return cloakStamp(raw) || "all";
}

function toneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return toneName(raw) || "all";
}

export function readCloakViews(raw: unknown): CloakView[] {
  if (!Array.isArray(raw)) return [];
  const out: CloakView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CloakView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      bearer: bearerSlot(row.bearer),
      wing: wingSlot(row.wing),
      stamp: stampSlot(row.stamp),
      tone: toneSlot(row.tone),
      bell: activeBell(String(row.bell ?? "")),
    });
  }
  return out.slice(0, 6);
}

export function addCloakView(
  views: readonly CloakView[],
  view: { id: string; name: string; tray: CloakTray; query: string; bearer: string; wing: string; stamp: string; tone: string; bell: string },
): CloakView[] {
  const current = readCloakViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    bearer: bearerSlot(view.bearer),
    wing: wingSlot(view.wing),
    stamp: stampSlot(view.stamp),
    tone: toneSlot(view.tone),
    bell: activeBell(view.bell),
  }].slice(0, 6);
}

export function dropCloakView(views: readonly CloakView[], id: string): CloakView[] {
  return readCloakViews(views).filter((view) => view.id !== id);
}

function latchRaw(value: LatchValue): LatchMark {
  if (value === true || value === 1) return "open";
  if (value === false || value === 0) return "shut";
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (text === "true" || text === "1" || text === "yes" || text === "open") return "open";
    if (text === "false" || text === "0" || text === "no" || text === "shut") return "shut";
    return "";
  }
  if (!value || typeof value !== "object") return "";
  if (LATCH_BLOCK.some((key) => key in value)) return "";
  if (!("loginEnabled" in value)) return "";
  return latchRaw(value.loginEnabled as LatchValue);
}

/**
 * Open, shut, or unmarked.
 * A trading flag, a withdrawal flag, a name, a phone, and the other blocked fields are not a login latch.
 * A missing flag stays unmarked and is not filled in.
 */
export function latchOf(value: LatchValue): LatchMark {
  return latchRaw(value);
}

function digitsOf(phone: unknown): string {
  return clip(phone, 40).replace(/\D/g, "");
}

/**
 * Short is 1–6 digits. Mid is 7–11. Long is 12 or more.
 * A blank phone stays unmarked.
 */
export function phoneSpanOf(phone: unknown): PhoneSpan {
  const digits = digitsOf(phone);
  if (!digits) return "";
  if (digits.length <= 6) return "short";
  if (digits.length <= 11) return "mid";
  return "long";
}

/** A leading plus is an international mark. Digits without a plus stay local. A blank phone stays unmarked. */
export function phoneMarkOf(phone: unknown): PhoneMark {
  const text = clip(phone, 40);
  if (!digitsOf(text)) return "";
  return text.startsWith("+") ? "plus" : "local";
}

export function latchLines(rows: readonly LatchRow[]): LatchLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const latch = latchOf(row.latch);
    map.set(latch, (map.get(latch) || 0) + 1);
  }
  const out: LatchLine[] = [];
  for (const latch of ["", ...LATCHES]) {
    const count = map.get(latch);
    if (count) out.push({ latch, count });
  }
  return out;
}

export function namedLatches(rows: readonly LatchRow[]): string[] {
  return latchLines(rows).map((line) => line.latch).filter(Boolean);
}

export function spanLines(rows: readonly LatchRow[]): SpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = phoneSpanOf(row.phone);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: SpanLine[] = [];
  for (const span of ["", ...SPANS]) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly LatchRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

export function markLines(rows: readonly LatchRow[]): MarkLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const mark = phoneMarkOf(row.phone);
    map.set(mark, (map.get(mark) || 0) + 1);
  }
  const out: MarkLine[] = [];
  for (const mark of ["", ...MARKS]) {
    const count = map.get(mark);
    if (count) out.push({ mark, count });
  }
  return out;
}

export function namedMarks(rows: readonly LatchRow[]): string[] {
  return markLines(rows).map((line) => line.mark).filter(Boolean);
}

/** The named latch with the most loaded rows. A tie keeps open before shut. An unmarked flag is not a lead. */
export function leadingLatch(rows: readonly LatchRow[]): string {
  const named = latchLines(rows).filter((line) => line.latch);
  if (!named.length) return "";
  const order = (latch: string) => LATCHES.indexOf(latch as (typeof LATCHES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.latch) - order(b.latch))[0].latch;
}

/** The phone span with the most loaded rows. A tie keeps short, then mid, then long. A blank phone is not a lead. */
export function leadingSpan(rows: readonly LatchRow[]): string {
  const named = spanLines(rows).filter((line) => line.span);
  if (!named.length) return "";
  const order = (span: string) => SPANS.indexOf(span as (typeof SPANS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.span) - order(b.span))[0].span;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function ltcShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function latchToken(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "open" || text === "shut" || text === "blank") return text;
  return "";
}

export function presentLatches(rows: readonly LatchRow[]): string[] {
  const out: string[] = [];
  for (const line of latchLines(rows)) {
    const token = line.latch || "blank";
    if (!out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenLatches(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const latch = latchToken(item);
    if (!latch || !known.has(latch) || out.includes(latch)) continue;
    out.push(latch);
  }
  return out;
}

export function toggleLatch(hidden: readonly string[], latch: string, present: readonly string[]): string[] {
  const token = latchToken(latch);
  if (!token || !present.includes(token)) return readHiddenLatches(hidden, present);
  const current = readHiddenLatches(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleLatches(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenLatches(hidden, present));
  return present.filter((latch) => (showHidden ? gone.has(latch) : !gone.has(latch)));
}

/** "all" and "blank" stay. A latch that is no longer loaded falls back to all. */
export function activeLatch(filter: string, latches: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (LATCHES as readonly string[]).includes(filter) && latches.includes(filter) ? filter : "all";
}

export function latchArg(filter: string): LatchMark | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (LATCHES as readonly string[]).includes(filter) ? (filter as LatchMark) : null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SPANS as readonly string[]).includes(filter) && spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): PhoneSpan | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (SPANS as readonly string[]).includes(filter) ? (filter as PhoneSpan) : null;
}

/** "all" and "blank" stay. A mark that is no longer loaded falls back to all. */
export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (MARKS as readonly string[]).includes(filter) && marks.includes(filter) ? filter : "all";
}

export function markArg(filter: string): PhoneMark | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (MARKS as readonly string[]).includes(filter) ? (filter as PhoneMark) : null;
}

/** Search stays on the name. The latch, the phone span, and the plus mark are not part of the query. */
export function visibleLatchCustomers<T extends LatchRow>(
  rows: readonly T[],
  latch: LatchMark | null,
  span: PhoneSpan | null,
  mark: PhoneMark | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (latch !== null && latchOf(row.latch) !== latch) return false;
    if (span !== null && phoneSpanOf(row.phone) !== span) return false;
    if (mark !== null && phoneMarkOf(row.phone) !== mark) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the latches, phone spans, and plus marks on this page. */
export function latchesCsv(rows: readonly LatchRow[]): string {
  const lines = ["kind,latch,count"];
  for (const line of latchLines(rows)) lines.push(["latch", csvCell(line.latch), String(line.count)].join(","));
  for (const line of spanLines(rows)) lines.push(["span", csvCell(line.span), String(line.count)].join(","));
  for (const line of markLines(rows)) lines.push(["mark", csvCell(line.mark), String(line.count)].join(","));
  return lines.join("\n");
}
