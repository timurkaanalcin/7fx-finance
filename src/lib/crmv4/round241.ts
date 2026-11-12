/**
 * Call sheets for callback follow-ups, and press plates already stored as a trader name, retention status, and desk.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_call_sheet (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   agent text not null default '',
 *   bay integer,
 *   tone text not null default '',
 *   pace text not null default '',
 *   minutes integer,
 *   rank integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_press_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_press_review (
 *   trader_id text primary key
 * );
 */

export const CSH_KEY = "crmv4-call-sheet";
export const CSH_VIEW_KEY = "crmv4-call-views";
export const CSH_DENSITY_KEY = "crmv4-call-density";
export const PPL_KEY = "crmv4-press-hide";
export const PPL_REVIEW_KEY = "crmv4-press-review";

export type ToneName = "blank" | "linen" | "gilt" | "soot";

export type PaceName = "blank" | "hush" | "even" | "keen";

export type CallTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type CallDensity = "airy" | "tight";

export type CallSort = "bay" | "agent";

export type CallSheet = {
  id: string;
  title: string;
  note: string;
  agent: string;
  bay: number | null;
  tone: string;
  pace: string;
  span: number | null;
  rank: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  seal: boolean;
  audit: string;
};

export type CallView = {
  id: string;
  name: string;
  tray: CallTray;
  query: string;
  agent: string;
  tone: string;
  pace: string;
  bay: string;
  span: string;
  rank: string;
};

export type CallCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  rank: number;
  house: number;
  window: number;
  matched: number;
  seal: number;
  cooling: number;
};

export type PlateLane = "" | "folio" | "fresh" | "kept" | "still" | "gone" | "plain" | "bind";

export type PlateTone = "" | "gilt" | "linen" | "sand" | "clay" | "mist" | "ivory";

export type PlateState = "" | "clear" | "set";

export type PlateShape = "all" | "join" | "wide" | "folio" | "bind" | "notch";

export type PlateReview = "all" | "reviewed" | "fresh";

export type PlateValue = string | { name?: unknown; ink?: unknown; press?: unknown; retention?: unknown; desk?: unknown; [key: string]: unknown } | null | undefined;

export type PlateRow = { id: string; label: string; note: PlateValue };

export type PlateLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "archive", "open", "tone", "tag", "rank", "span", "seal"] as const;

const TONES = ["linen", "gilt", "soot"] as const;

const PACES = ["hush", "even", "keen"] as const;

const PACE_CYCLE = ["hush", "even", "keen"] as const;

const RANK_CYCLE = [1, 4, 7] as const;

const PEAK_BAYS = new Set([2, 5]);

const QUIET_BAYS = new Set([6]);

const HOUSE = new Set(["GILT", "SOOT"]);

const FRESH_LANE = new Set(["NEW", "LEAD", "OPEN"]);

const KEPT_LANE = new Set(["ACTIVE", "CLIENT", "RETAINED"]);

const STILL_LANE = new Set(["COLD", "QUIET", "DORMANT"]);

const GONE_LANE = new Set(["LOST", "CLOSED", "DEAD"]);

const LANE_ORDER = ["bind", "fresh", "kept", "still", "gone", "plain", "folio"] as const;

const TONE_ORDER = ["gilt", "linen", "sand", "clay", "mist", "ivory"] as const;

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CSH_CAP = 6;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CallTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function toneName(raw: unknown): Exclude<ToneName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<ToneName, "blank">) : "";
}

function paceName(raw: unknown): Exclude<PaceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<PaceName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[abc]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: CallSheet, tray: CallTray): boolean {
  if (tray === "held") return card.held && !card.archived;
  if (tray === "archived") return card.archived;
  return !card.held && !card.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

/** A blank title is left out. The saved title stays short. */
export function callLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function callNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank agent stays blank. It is not filled in. */
export function callAgent(raw: unknown): string {
  return clip(raw, 16);
}

/** A tone is LINEN, GILT, or SOOT. Anything else stays blank. Letters are stored in capitals. */
export function toneOf(raw: unknown): string {
  const name = toneName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bay is an integer from 1 through 6.
 * A blank value stays unset. 0 is not a bay.
 * 7 is not a bay.
 */
export function bayOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-6]$/.test(text)) return null;
  return Number(text);
}

/** Minutes are 5, 10, or 20. A blank value stays unset. */
export function minuteOf(raw: unknown): 5 | 10 | 20 | null {
  if (raw === 5 || raw === "5") return 5;
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  return null;
}

/** Rank is 1, 4, or 7. Anything else is not a rank. 1 is the resting rank. */
export function rankOf(raw: unknown): 1 | 4 | 7 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 7 || raw === "7") return 7;
  return null;
}

export function bayBand(bay: unknown): "blank" | "early" | "mid" | "late" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 1) return "early";
  if (value <= 3) return "mid";
  return "late";
}

/** Peak bays are 2 and 5. An unset bay is not a peak bay. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAK_BAYS.has(value);
}

/** The quiet bay is 6. A peak bay is not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * How far a bay sits behind the desk bay.
 * A positive gap means the sheet is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Bays do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** GILT and SOOT are house tones. LINEN is a guest tone. A blank tone is not house. */
export function houseTone(tone: unknown): boolean {
  return HOUSE.has(toneOf(tone));
}

export function callDensity(raw: unknown): CallDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function callSort(raw: unknown): CallSort {
  return raw === "agent" ? "agent" : "bay";
}

function readOne(raw: unknown): CallSheet | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = callLine(row.title);
  if (!id || !title) return null;
  const rank = rankOf(row.rank);
  return {
    id,
    title,
    note: callNote(row.note),
    agent: callAgent(row.agent),
    bay: bayOf(row.bay),
    tone: toneOf(row.tone),
    pace: paceName(row.pace),
    span: minuteOf(row.span),
    rank: rank === null ? 1 : rank,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    seal: row.seal === true,
    audit: auditCode(row.audit),
  };
}

export function readCalls(raw: unknown): CallSheet[] {
  if (!Array.isArray(raw)) return [];
  const out: CallSheet[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, CSH_CAP);
}

export function addCall(
  cards: readonly CallSheet[],
  card: {
    id: string;
    title: string;
    note?: string;
    agent?: string;
    bay?: unknown;
    tone?: string;
    pace?: string;
    span?: unknown;
    rank?: unknown;
    tags?: unknown;
  },
): CallSheet[] {
  const current = readCalls(cards);
  const id = String(card.id || "").trim();
  const title = callLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rank = rankOf(card.rank);
  const next: CallSheet = {
    id,
    title,
    note: callNote(card.note),
    agent: callAgent(card.agent),
    bay: bayOf(card.bay),
    tone: toneOf(card.tone),
    pace: paceName(card.pace),
    span: minuteOf(card.span),
    rank: rank === null ? 1 : rank,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CSH_CAP);
}

/** A blank pace becomes hush, hush becomes even, even becomes keen, and keen returns to hush. */
export function cyclePace(cards: readonly CallSheet[], id: string): CallSheet[] {
  return readCalls(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_CYCLE.indexOf(card.pace as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    if (!next || next === card.pace) return card;
    return { ...card, pace: next, audit: "pace" };
  });
}

/** Rank steps 1 to 4, 4 to 7, and 7 back to 1. */
export function cycleRank(cards: readonly CallSheet[], id: string): CallSheet[] {
  return readCalls(cards).map((card) => {
    if (card.id !== id) return card;
    const at = RANK_CYCLE.indexOf(card.rank as (typeof RANK_CYCLE)[number]);
    const next = at < 0 ? RANK_CYCLE[0] : RANK_CYCLE[(at + 1) % RANK_CYCLE.length];
    if (next === card.rank) return card;
    return { ...card, rank: next, audit: "rank" };
  });
}

/** A blank title is left as it is. */
export function editCall(cards: readonly CallSheet[], id: string, title: unknown): CallSheet[] {
  const next = callLine(title);
  if (!next) return readCalls(cards);
  const current = readCalls(cards);
  if (current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

export function editCallNote(cards: readonly CallSheet[], id: string, note: unknown): CallSheet[] {
  const next = callNote(note);
  return readCalls(cards).map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "note" } : card));
}

export function addCallTag(cards: readonly CallSheet[], id: string, tag: unknown): CallSheet[] {
  const next = tagsOf(tag);
  if (!next.length) return readCalls(cards);
  return readCalls(cards).map((card) => {
    if (card.id !== id) return card;
    const tags = tagsOf([...card.tags, ...next]);
    if (tags.join() === card.tags.join()) return card;
    return { ...card, tags, audit: "tag" };
  });
}

export function setCallRank(cards: readonly CallSheet[], id: string, rank: unknown): CallSheet[] {
  const next = rankOf(rank);
  if (next === null) return readCalls(cards);
  return readCalls(cards).map((card) => (card.id === id && card.rank !== next ? { ...card, rank: next, audit: "rank" } : card));
}

/** Snooze steps a blank span to 10, 5 to 10, and 10 to 20. A span of 20 stays. */
export function snoozeCall(cards: readonly CallSheet[], id: string): CallSheet[] {
  return readCalls(cards).map((card) => {
    if (card.id !== id || card.span === 20) return card;
    const next = card.span === 10 ? 20 : 10;
    return { ...card, span: next, audit: "span" };
  });
}

export function setCallPin(cards: readonly CallSheet[], id: string, pinned: boolean): CallSheet[] {
  return readCalls(cards).map((card) => (card.id === id && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function pinFocusedCall(cards: readonly CallSheet[], shownIds: readonly string[], index: number): CallSheet[] {
  const id = shownIds[index];
  if (!id) return readCalls(cards);
  const card = readCalls(cards).find((item) => item.id === id);
  if (!card) return readCalls(cards);
  return setCallPin(cards, id, !card.pinned);
}

export function snoozeFocusedCall(cards: readonly CallSheet[], shownIds: readonly string[], index: number): CallSheet[] {
  const id = shownIds[index];
  return id ? snoozeCall(cards, id) : readCalls(cards);
}

export function holdFocusedCall(cards: readonly CallSheet[], shownIds: readonly string[], index: number): CallSheet[] {
  const id = shownIds[index];
  if (!id) return readCalls(cards);
  const card = readCalls(cards).find((item) => item.id === id);
  if (!card || card.archived) return readCalls(cards);
  return setCallHold(cards, id, !card.held);
}

export function paceFocusedCall(cards: readonly CallSheet[], shownIds: readonly string[], index: number): CallSheet[] {
  const id = shownIds[index];
  return id ? cyclePace(cards, id) : readCalls(cards);
}

export function rankFocusedCall(cards: readonly CallSheet[], shownIds: readonly string[], index: number): CallSheet[] {
  const id = shownIds[index];
  return id ? cycleRank(cards, id) : readCalls(cards);
}

export function sealFocusedCall(cards: readonly CallSheet[], shownIds: readonly string[], index: number): CallSheet[] {
  const id = shownIds[index];
  if (!id) return readCalls(cards);
  const card = readCalls(cards).find((item) => item.id === id);
  if (!card) return readCalls(cards);
  return setCallSeal(cards, id, !card.seal);
}

export function tagFocusedCall(cards: readonly CallSheet[], shownIds: readonly string[], index: number): CallSheet[] {
  const id = shownIds[index];
  return id ? addCallTag(cards, id, "a") : readCalls(cards);
}

export function setCallHold(cards: readonly CallSheet[], id: string, held: boolean): CallSheet[] {
  return readCalls(cards).map((card) => (card.id === id && !card.archived && card.held !== held ? { ...card, held, audit: held ? "hold" : "resume" } : card));
}

export function setCallArchive(cards: readonly CallSheet[], id: string, archived: boolean): CallSheet[] {
  return readCalls(cards).map((card) => (card.id === id && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function setCallSeal(cards: readonly CallSheet[], id: string, seal: boolean): CallSheet[] {
  return readCalls(cards).map((card) => (card.id === id && card.seal !== seal ? { ...card, seal, audit: "seal" } : card));
}

export function bulkCallTone(cards: readonly CallSheet[], ids: readonly string[], tone: unknown): CallSheet[] {
  const next = toneOf(tone);
  if (!next) return readCalls(cards);
  const want = new Set(ids);
  return readCalls(cards).map((card) => (want.has(card.id) && card.tone !== next ? { ...card, tone: next, audit: "tone" } : card));
}

export function bulkCallPin(cards: readonly CallSheet[], ids: readonly string[], pinned: boolean): CallSheet[] {
  const want = new Set(ids);
  return readCalls(cards).map((card) => (want.has(card.id) && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkCallArchive(cards: readonly CallSheet[], ids: readonly string[], archived: boolean): CallSheet[] {
  const want = new Set(ids);
  return readCalls(cards).map((card) => (want.has(card.id) && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function bulkCallPace(cards: readonly CallSheet[], ids: readonly string[], pace: unknown): CallSheet[] {
  const next = paceName(pace);
  if (!next) return readCalls(cards);
  const want = new Set(ids);
  return readCalls(cards).map((card) => (want.has(card.id) && card.pace !== next ? { ...card, pace: next, audit: "pace" } : card));
}

export function bulkCallTag(cards: readonly CallSheet[], ids: readonly string[], tag: unknown): CallSheet[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addCallTag(rows, id, tag) : rows), readCalls(cards));
}

/** An open sheet whose bay sits more than two bays behind the desk. A raised rank, a hold, or an archive is not late. */
export function lateCall(card: CallSheet, desk: unknown): boolean {
  const gap = bayGap(card.bay, desk);
  return inTray(card, "open") && card.rank === 1 && gap !== null && gap > 2;
}

/** An open sheet with a span of 5 minutes is due now. A raised rank, a hold, or an archive is not. */
export function soonCall(card: CallSheet): boolean {
  return inTray(card, "open") && card.rank === 1 && card.span === 5;
}

/** An open resting sheet on a keen pace whose bay is 6. That quiet keen sheet is cooling. */
export function coolingCall(card: CallSheet): boolean {
  return inTray(card, "open") && card.rank === 1 && card.pace === "keen" && card.bay === 6;
}

export function reminderCalls(cards: readonly CallSheet[], desk: unknown): CallSheet[] {
  return readCalls(cards).filter((card) => lateCall(card, desk) || soonCall(card));
}

export function coolingCalls(cards: readonly CallSheet[]): CallSheet[] {
  return readCalls(cards).filter((card) => coolingCall(card));
}

/** Open resting sheets whose bay sits within one bay of the desk. */
export function windowCalls(cards: readonly CallSheet[], desk: unknown): CallSheet[] {
  return readCalls(cards).filter((card) => {
    const gap = bayGap(card.bay, desk);
    return inTray(card, "open") && card.rank === 1 && gap !== null && gap >= -1 && gap <= 1;
  });
}

export function matchedCalls(cards: readonly CallSheet[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readCalls(cards).filter((card) => inTray(card, "open") && card.rank === 1 && card.bay === at).length;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } | null {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  const exact = bayOf(filter);
  return exact === null ? null : { exact, pick: null };
}

export function activeBay(filter: string): string {
  return bayArg(filter) ? filter : "all";
}

export function minuteArg(filter: string): 5 | 10 | 20 | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return minuteOf(filter);
}

export function activeMinute(filter: string): string {
  const span = minuteArg(filter);
  return span === null && filter !== "all" ? "all" : filter === "all" || span ? filter : "all";
}

export function paceArg(filter: string): Exclude<PaceName, "blank"> | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const name = paceName(filter);
  return name || null;
}

export function activePace(filter: string, paces: readonly string[]): string {
  return paces.includes(filter) || filter === "all" || filter === "blank" ? filter : "all";
}

export function rankArg(filter: string): 1 | 4 | 7 | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

export function activeRank(filter: string): string {
  return rankArg(filter) || filter === "all" ? (rankArg(filter) === null && filter !== "all" ? "all" : filter) : "all";
}

export function toneArg(filter: string): string | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const tone = toneOf(filter);
  return tone || null;
}

export function activeTone(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  return toneOf(filter) ? filter.toLowerCase() : "all";
}

export function agentArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  const agent = callAgent(filter);
  return agent || null;
}

export function activeAgent(filter: string, agents: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return agents.includes(filter) ? filter : "all";
}

export function moveCallFocus(index: number, count: number, step: number): number {
  if (count <= 0) return 0;
  return (index + step + count) % count;
}

/** An empty book suggests linen. When house tones outnumber linen, linen is suggested. Otherwise gilt. */
export function suggestTone(cards: readonly CallSheet[]): string {
  const rows = readCalls(cards).filter((card) => card.tone);
  if (!rows.length) return "LINEN";
  const house = rows.filter((card) => houseTone(card.tone)).length;
  return house > rows.length - house ? "LINEN" : "GILT";
}

/** An empty book suggests 10 minutes. A late sheet suggests 20. */
export function suggestMinutes(cards: readonly CallSheet[], desk: unknown): 10 | 20 {
  const rows = readCalls(cards);
  if (!rows.length) return 10;
  return rows.some((card) => lateCall(card, desk)) ? 20 : 10;
}

/** The agent with the fewest open sheets. A tie keeps the earlier name. A blank roster has no agent. */
export function fairAgent(cards: readonly CallSheet[], roster: string): string {
  const names: string[] = [];
  for (const part of roster.split(",")) {
    const name = callAgent(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return "";
  const open = readCalls(cards).filter((card) => inTray(card, "open"));
  let best = names[0];
  let bestCount = open.filter((card) => card.agent === best).length;
  for (const name of names.slice(1)) {
    const count = open.filter((card) => card.agent === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function suggestAgent(cards: readonly CallSheet[], roster: string): string {
  return fairAgent(cards, roster);
}

/** The agent with the most open sheets. A tie keeps the name that sorts later. */
export function busiestAgent(cards: readonly CallSheet[]): string {
  const rows = readCalls(cards).filter((card) => inTray(card, "open") && card.agent);
  const names: string[] = [];
  for (const card of rows) if (!names.includes(card.agent)) names.push(card.agent);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = rows.filter((card) => card.agent === best).length;
  for (const name of names) {
    const count = rows.filter((card) => card.agent === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function callCounts(cards: readonly CallSheet[], desk: unknown): CallCounts {
  const rows = readCalls(cards);
  const open = rows.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    held: rows.filter((card) => inTray(card, "held")).length,
    archived: rows.filter((card) => inTray(card, "archived")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakBay(card.bay)).length,
    late: open.filter((card) => lateCall(card, desk)).length,
    soon: open.filter((card) => soonCall(card)).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseTone(card.tone)).length,
    window: windowCalls(rows, desk).length,
    matched: matchedCalls(rows, desk),
    seal: open.filter((card) => card.seal).length,
    cooling: open.filter((card) => coolingCall(card)).length,
  };
}

export function callShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function lateCallShare(cards: readonly CallSheet[], desk: unknown): number {
  const counts = callCounts(cards, desk);
  return callShare(counts.late, counts.open);
}

export function rankLoad(cards: readonly CallSheet[]): number {
  return callCounts(cards, 3).rank;
}

/** Open sheets that share a bay with another open resting sheet. */
export function clashBayCount(cards: readonly CallSheet[]): number {
  const open = readCalls(cards).filter((card) => inTray(card, "open") && card.rank === 1 && card.bay !== null);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.bay === card.bay)).length;
}

/** Open sheets that share an agent and a span with another open sheet. */
export function spanClashCount(cards: readonly CallSheet[]): number {
  const open = readCalls(cards).filter((card) => inTray(card, "open") && card.agent && card.span !== null);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.agent === card.agent && other.span === card.span)).length;
}

export function pairAgentCount(cards: readonly CallSheet[]): number {
  const open = readCalls(cards).filter((card) => inTray(card, "open") && card.agent);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.agent === card.agent)).length;
}

/** Open sheets whose bay is exactly one away from another open sheet. */
export function neighborCallCount(cards: readonly CallSheet[]): number {
  const open = readCalls(cards).filter((card) => inTray(card, "open") && card.bay !== null);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.bay !== null && Math.abs(other.bay - (card.bay as number)) === 1)).length;
}

export function callTimeline(cards: readonly CallSheet[]): { bay: number; titles: string[] }[] {
  const map = new Map<number, string[]>();
  for (const card of readCalls(cards)) {
    if (!inTray(card, "open") || card.bay === null) continue;
    const list = map.get(card.bay) || [];
    list.push(card.title);
    map.set(card.bay, list);
  }
  return Array.from(map.keys()).sort((a, b) => a - b).map((bay) => ({ bay, titles: map.get(bay) || [] }));
}

export function callAgents(cards: readonly CallSheet[]): string[] {
  const names: string[] = [];
  for (const card of readCalls(cards)) if (card.agent && !names.includes(card.agent)) names.push(card.agent);
  return names;
}

export function callTones(cards: readonly CallSheet[]): string[] {
  const names: string[] = [];
  for (const card of readCalls(cards)) if (card.tone && !names.includes(card.tone)) names.push(card.tone);
  return names;
}

export function nextCall(cards: readonly CallSheet[], id: string): CallSheet | null {
  const open = readCalls(cards)
    .filter((card) => inTray(card, "open"))
    .slice()
    .sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  const at = open.findIndex((card) => card.id === id);
  if (at < 0 || at === open.length - 1) return null;
  return open[at + 1];
}

export function sortCalls(cards: readonly CallSheet[], sort: CallSort): CallSheet[] {
  return readCalls(cards).slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "agent") return a.agent.localeCompare(b.agent) || a.title.localeCompare(b.title);
    return (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title);
  });
}

export function visibleCalls(
  cards: readonly CallSheet[],
  tray: CallTray,
  query: string,
  agent: string | null,
  tone: string | "blank" | null,
  pace: Exclude<PaceName, "blank"> | "blank" | null,
  bay: { exact: number | null; pick: BayPick | null } | null,
  span: 5 | 10 | 20 | "blank" | null,
  rank: 1 | 4 | 7 | "blank" | null,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
  keenOnly: boolean,
): CallSheet[] {
  const text = query.trim().toLowerCase();
  return readCalls(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.agent}`.toLowerCase().includes(text)) return false;
    if (agent !== null && card.agent !== agent) return false;
    if (tone === "blank" && card.tone) return false;
    if (tone && tone !== "blank" && card.tone !== tone) return false;
    if (pace === "blank" && card.pace) return false;
    if (pace && pace !== "blank" && card.pace !== pace) return false;
    if (bay && !bayHit(card.bay, bay.exact, bay.pick)) return false;
    if (span === "blank" && card.span !== null) return false;
    if (typeof span === "number" && card.span !== span) return false;
    if (rank === "blank") return false;
    if (typeof rank === "number" && card.rank !== rank) return false;
    if (houseOnly && !houseTone(card.tone)) return false;
    if (peakOnly && !peakBay(card.bay)) return false;
    if (quietOnly && !quietBay(card.bay)) return false;
    if (restingOnly && card.rank !== 1) return false;
    if (keenOnly && card.pace !== "keen") return false;
    return true;
  });
}

export function callCopy(card: CallSheet): string {
  return [card.title, card.agent, card.bay ?? "", card.tone, card.pace, card.span ?? "", card.rank, card.tags.join(" ")].join(" · ");
}

export function callsCsv(cards: readonly CallSheet[], desk: unknown): string {
  const lines = ["title,agent,bay,tone,pace,minutes,rank,tags,pinned,held,archived,seal,gap,late,soon,cooling,peak,quiet,house,band,audit,note"];
  for (const card of readCalls(cards)) {
    const gap = bayGap(card.bay, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.agent),
      card.bay === null ? "" : String(card.bay),
      card.tone,
      card.pace,
      card.span === null ? "" : String(card.span),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.archived ? "1" : "0",
      card.seal ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCall(card, desk) ? "1" : "0",
      soonCall(card) ? "1" : "0",
      coolingCall(card) ? "1" : "0",
      peakBay(card.bay) ? "1" : "0",
      quietBay(card.bay) ? "1" : "0",
      houseTone(card.tone) ? "1" : "0",
      bayBand(card.bay),
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}

function readView(raw: unknown): CallView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 40),
    agent: clip(row.agent, 16) || "all",
    tone: activeTone(clip(row.tone, 8) || "all"),
    pace: clip(row.pace, 8) || "all",
    bay: activeBay(clip(row.bay, 8) || "all"),
    span: activeMinute(clip(row.span, 4) || "all"),
    rank: activeRank(clip(row.rank, 4) || "all"),
  };
}

export function readCallViews(raw: unknown): CallView[] {
  if (!Array.isArray(raw)) return [];
  const out: CallView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addCallView(views: readonly CallView[], view: CallView): CallView[] {
  const current = readCallViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name, tray: trayOf(view.tray) }, ...current].slice(0, VIEW_CAP);
}

export function dropCallView(views: readonly CallView[], id: string): CallView[] {
  return readCallViews(views).filter((view) => view.id !== id);
}

function plateParts(value: PlateValue): { ok: boolean; name: string; ink: string; press: string } {
  if (typeof value === "string") return { ok: true, name: clip(value, 48), ink: "", press: "" };
  if (!value || typeof value !== "object") return { ok: false, name: "", ink: "", press: "" };
  for (const key of MONEY_KEYS) if (key in value) return { ok: false, name: "", ink: "", press: "" };
  const ink = clip(value.ink ?? value.retention, 24).toUpperCase().replace(/[^A-Z]/g, "");
  const press = clip(value.press ?? value.desk, 24);
  return { ok: true, name: clip(value.name, 48), ink, press };
}

export function plateState(value: PlateValue): PlateState {
  const found = plateParts(value);
  if (!found.ok) return "";
  return found.name ? "set" : "clear";
}

function lettersOf(name: string): string {
  return name.replace(/[^A-Za-z]/g, "");
}

function wordsOf(name: string): string[] {
  return name.split(/\s+/).filter(Boolean);
}

/** The mark is the last letter of the first word and the first letter of the last word. */
export function plateMark(value: PlateValue): string {
  const found = plateParts(value);
  if (!found.ok || !found.name) return "";
  const words = wordsOf(found.name);
  if (!words.length) return "";
  const firstLetters = lettersOf(words[0]);
  const lastWord = [...words].reverse().find((word) => lettersOf(word)) || words[words.length - 1];
  const lastLetters = lettersOf(lastWord);
  const a = firstLetters.slice(-1) || "";
  const b = lastLetters[0] || "";
  return (a + b).toUpperCase();
}

/**
 * A hyphen in the name is a bind and wins over the retention status.
 * A blank status is a folio. New, lead, or open is fresh.
 * Active, client, or retained is kept.
 * Cold, quiet, or dormant is still.
 * Lost, closed, or dead is gone.
 * Any other status is plain. A digit does not change the lane.
 */
export function plateLane(value: PlateValue): PlateLane {
  const found = plateParts(value);
  if (!found.ok || !found.name) return "";
  if (found.name.includes("-")) return "bind";
  if (!found.ink) return "folio";
  if (FRESH_LANE.has(found.ink)) return "fresh";
  if (KEPT_LANE.has(found.ink)) return "kept";
  if (STILL_LANE.has(found.ink)) return "still";
  if (GONE_LANE.has(found.ink)) return "gone";
  return "plain";
}

/**
 * A blank desk is mist. NA or a question mark is clay.
 * A desk that ends with a digit is sand.
 * A through F is gilt. G through P is linen. Anything else is ivory.
 */
export function plateTone(value: PlateValue): PlateTone {
  const found = plateParts(value);
  if (!found.ok || !found.name) return "";
  if (!found.press) return "mist";
  const token = found.press.toUpperCase();
  if (token === "NA" || token === "?") return "clay";
  const last = found.press.trim().slice(-1);
  if (/\d/.test(last)) return "sand";
  const first = found.press.trim()[0] || "";
  if (/[A-Fa-f]/.test(first)) return "gilt";
  if (/[G-Pg-p]/.test(first)) return "linen";
  return "ivory";
}

export function joinedPlate(value: PlateValue): boolean {
  const found = plateParts(value);
  return found.ok && found.name.includes("&");
}

export function widePlate(value: PlateValue): boolean {
  const found = plateParts(value);
  return found.ok && wordsOf(found.name).length >= 3;
}

export function notchPlate(value: PlateValue): boolean {
  const found = plateParts(value);
  return found.ok && /\d/.test(found.name);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function plateStep(value: PlateValue): 0 | 1 | 2 | 3 {
  const found = plateParts(value);
  if (!found.ok || !found.name) return 0;
  const words = wordsOf(found.name);
  if (words.length <= 1) return 1;
  if (words.length === 2) return 2;
  return 3;
}

export function plateLanes(rows: readonly PlateRow[]): PlateLaneLine[] {
  const lanes = ["folio", "fresh", "kept", "still", "gone", "plain", "bind"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => plateLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps bind, then fresh, kept, still, gone, plain, and folio. */
export function leadingPlate(rows: readonly PlateRow[]): string {
  const lines = plateLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingPlateTone(rows: readonly PlateRow[]): string {
  const lines = TONE_ORDER.map((tone) => ({ tone, count: rows.filter((row) => plateTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || TONE_ORDER.indexOf(a.tone) - TONE_ORDER.indexOf(b.tone))[0].tone;
}

export function plateShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function sharedPlateCount(rows: readonly PlateRow[]): number {
  const marks = rows.map((row) => plateMark(row.note)).filter(Boolean);
  return rows.filter((row) => {
    const mark = plateMark(row.note);
    return Boolean(mark) && marks.filter((item) => item === mark).length > 1;
  }).length;
}

export function folioPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateLane(row.note) === "folio").length;
}

export function freshPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateLane(row.note) === "fresh").length;
}

export function keptPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateLane(row.note) === "kept").length;
}

export function stillPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateLane(row.note) === "still").length;
}

export function gonePlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateLane(row.note) === "gone").length;
}

export function plainPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateLane(row.note) === "plain").length;
}

export function bindPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateLane(row.note) === "bind").length;
}

export function giltPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateTone(row.note) === "gilt").length;
}

export function joinedPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => joinedPlate(row.note)).length;
}

export function notchPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => notchPlate(row.note)).length;
}

export function presentPlateLanes(rows: readonly PlateRow[]): string[] {
  return plateLanes(rows).map((line) => line.lane);
}

export function readHiddenPlates(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if (!allow.has(lane) || out.includes(lane)) continue;
    out.push(lane);
  }
  return out;
}

export function readReviewedPlates(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (!allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function togglePlate(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePlateReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPlateReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePlateLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function plateLaneArg(filter: string): PlateLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "folio" || filter === "fresh" || filter === "kept" || filter === "still" || filter === "gone" || filter === "plain" || filter === "bind") return filter;
  return null;
}

export function activePlateLane(filter: string, lanes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return lanes.includes(filter) ? filter : "all";
}

export function plateToneArg(filter: string): PlateTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "linen" || filter === "sand" || filter === "clay" || filter === "mist" || filter === "ivory") return filter;
  return null;
}

export function activePlateTone(filter: string): string {
  return plateToneArg(filter) || filter === "all" ? filter : "all";
}

export function visiblePlates(
  rows: readonly PlateRow[],
  lane: PlateLane | "blank" | null,
  tone: PlateTone | null,
  query: string,
  review: PlateReview,
  reviewed: readonly string[],
  shape: PlateShape,
): PlateRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const found = plateParts(row.note);
    if (!found.ok) return false;
    if (text && !`${found.name} ${row.label}`.toLowerCase().includes(text)) return false;
    const current = plateLane(row.note);
    if (lane === "blank" && current) return false;
    if (lane && lane !== "blank" && current !== lane) return false;
    if (tone && plateTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "join" && !joinedPlate(row.note)) return false;
    if (shape === "wide" && !widePlate(row.note)) return false;
    if (shape === "folio" && current !== "folio") return false;
    if (shape === "bind" && current !== "bind") return false;
    if (shape === "notch" && !notchPlate(row.note)) return false;
    return true;
  });
}

export function platesCsv(rows: readonly PlateRow[]): string {
  const lines = ["lane,count"];
  for (const line of plateLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function plateRowsCsv(rows: readonly PlateRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,tone,step,join,wide,notch,bind,folio,fresh,kept,still,gone,plain,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = plateParts(row.note);
    if (!found.ok) continue;
    const lane = plateLane(row.note);
    lines.push([
      csvCell(found.name),
      plateMark(row.note),
      lane,
      plateTone(row.note),
      String(plateStep(row.note)),
      joinedPlate(row.note) ? "1" : "0",
      widePlate(row.note) ? "1" : "0",
      notchPlate(row.note) ? "1" : "0",
      lane === "bind" ? "1" : "0",
      lane === "folio" ? "1" : "0",
      lane === "fresh" ? "1" : "0",
      lane === "kept" ? "1" : "0",
      lane === "still" ? "1" : "0",
      lane === "gone" ? "1" : "0",
      lane === "plain" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function plateCopy(value: PlateValue): string {
  const found = plateParts(value);
  if (!found.ok) return "";
  return [found.name, plateMark(value), plateLane(value), plateTone(value)].join(" · ");
}
