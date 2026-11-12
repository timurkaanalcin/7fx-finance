/**
 * Berth slips for withdrawal follow-ups, and badge marks already stored as customer, status, and method.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_berth_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   clerk text not null default '',
 *   hook integer,
 *   cord text not null default '',
 *   pace text not null default '',
 *   sla integer,
 *   rank integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_badge_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_badge_review (
 *   request_id text primary key
 * );
*/

export const BRT_KEY = "crmv4-berth-slip";
export const BRT_VIEW_KEY = "crmv4-berth-views";
export const BRT_DENSITY_KEY = "crmv4-berth-density";
export const BDG_KEY = "crmv4-badge-hide";
export const BDG_REVIEW_KEY = "crmv4-badge-review";

export type CordName = "blank" | "hemp" | "silk" | "wire";

export type PaceName = "blank" | "hush" | "march" | "sprint";

export type BerthTray = "open" | "held" | "archived";

export type HookPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type BerthDensity = "airy" | "tight";

export type BerthSort = "hook" | "clerk";

export type BerthCard = {
  id: string;
  title: string;
  note: string;
  clerk: string;
  hook: number | null;
  cord: string;
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

export type BerthView = {
  id: string;
  name: string;
  tray: BerthTray;
  query: string;
  clerk: string;
  cord: string;
  pace: string;
  hook: string;
  span: string;
  rank: string;
};

export type BerthCounts = {
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

export type BadgeLane = "" | "hall" | "seal" | "queue" | "gate" | "vault" | "cipher";

export type BadgeTone = "" | "gilt" | "pale" | "linen" | "ash" | "haze";

export type BadgeState = "" | "clear" | "set";

export type BadgeShape = "all" | "join" | "wide" | "hall" | "cipher" | "seal";

export type BadgeReview = "all" | "reviewed" | "fresh";

export type BadgeValue = string | { name?: unknown; check?: unknown; tier?: unknown; [key: string]: unknown } | null | undefined;

export type BadgeRow = { id: string; label: string; note: BadgeValue };

export type BadgeLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "archive", "open", "cord", "tag", "rank", "span", "seal"] as const;

const GLASSES = ["hemp", "silk", "wire"] as const;

const GAITS = ["hush", "march", "sprint"] as const;

const GAIT_CYCLE = ["hush", "march", "sprint"] as const;

const PEAK_BAYS = new Set([3, 8]);

const QUIET_BAYS = new Set([1]);

const HOUSE = new Set(["WIRE", "HEMP"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const BRT_CAP = 8;

const VIEW_CAP = 5;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BerthTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function cordName(raw: unknown): Exclude<CordName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (GLASSES as readonly string[]).includes(text) ? (text as Exclude<CordName, "blank">) : "";
}

function paceName(raw: unknown): Exclude<PaceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GAITS as readonly string[]).includes(text) ? (text as Exclude<PaceName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[efgh]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: BerthCard, tray: BerthTray): boolean {
  if (tray === "held") return card.held && !card.archived;
  if (tray === "archived") return card.archived;
  return !card.held && !card.archived;
}

/** A blank title is left out. The saved title stays short. */
export function berthLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function berthNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A blank clerk stays blank. It is not filled in. */
export function berthClerk(raw: unknown): string {
  return clip(raw, 20);
}

/** A cord is HEMP, SILK, or WIRE. Anything else stays blank. Letters are stored in capitals. */
export function cordOf(raw: unknown): string {
  const name = cordName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A hook is an integer from 1 through 7.
 * A blank value stays unset. 0 is not a hook.
 * A second digit is not a hook.
 */
export function hookOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 8) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-8]$/.test(text)) return null;
  return Number(text);
}

/** A span is 5, 15, or 60 minutes. A blank value stays unset. */
export function spanOf(raw: unknown): 10 | 30 | 90 | null {
  if (raw === 10 || raw === "10") return 10;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 90 || raw === "90") return 90;
  return null;
}

/** Rank is 2, 5, or 8. Anything else is not a rank. 2 is the resting rank. */
export function rankOf(raw: unknown): 2 | 5 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 5 || raw === "5") return 5;
  if (raw === 8 || raw === "8") return 8;
  return null;
}

export function hookBand(hook: unknown): "blank" | "early" | "mid" | "late" {
  const value = hookOf(hook);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak hooks are 2 and 6. An unset hook is not a peak hook. */
export function peakHook(hook: unknown): boolean {
  const value = hookOf(hook);
  return value !== null && PEAK_BAYS.has(value);
}

/** The quiet hook is 7. A peak hook is not quiet. An unset hook is not quiet. */
export function quietHook(hook: unknown): boolean {
  const value = hookOf(hook);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * How far a hook sits behind the desk hook.
 * A positive gap means the slip is behind. A negative gap means it is ahead.
 * A gap of zero means the same hook. An unset hook has no gap. Hooks do not wrap.
 */
export function hookGap(hook: unknown, desk: unknown): number | null {
  const from = hookOf(hook);
  const at = hookOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** SILK and WIRE are house cord. HEMP is a guest cord. A blank cord is not house cord. */
export function houseCord(cord: unknown): boolean {
  return HOUSE.has(cordOf(cord));
}

export function berthDensity(raw: unknown): BerthDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function berthSort(raw: unknown): BerthSort {
  return raw === "clerk" ? "clerk" : "hook";
}

function readOne(raw: unknown): BerthCard | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = berthLine(row.title);
  if (!id || !title) return null;
  const rank = rankOf(row.rank);
  return {
    id,
    title,
    note: berthNote(row.note),
    clerk: berthClerk(row.clerk),
    hook: hookOf(row.hook),
    cord: cordOf(row.cord),
    pace: paceName(row.pace),
    span: spanOf(row.span),
    rank: rank === null ? 2 : rank,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    seal: row.seal === true,
    audit: auditCode(row.audit),
  };
}

export function readBerths(raw: unknown): BerthCard[] {
  if (!Array.isArray(raw)) return [];
  const out: BerthCard[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, BRT_CAP);
}

export function addBerth(
  cards: readonly BerthCard[],
  card: {
    id: string;
    title: string;
    note?: string;
    clerk?: string;
    hook?: unknown;
    cord?: string;
    pace?: string;
    span?: unknown;
    rank?: unknown;
    tags?: unknown;
  },
): BerthCard[] {
  const current = readBerths(cards);
  const id = String(card.id || "").trim();
  const title = berthLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rank = rankOf(card.rank);
  const next: BerthCard = {
    id,
    title,
    note: berthNote(card.note),
    clerk: berthClerk(card.clerk),
    hook: hookOf(card.hook),
    cord: cordOf(card.cord),
    pace: paceName(card.pace),
    span: spanOf(card.span),
    rank: rank === null ? 2 : rank,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, BRT_CAP);
}

/** A blank pace becomes hush, hush becomes march, march becomes sprint, and sprint returns to hush. */
export function cyclePace(cards: readonly BerthCard[], id: string): BerthCard[] {
  return readBerths(cards).map((card) => {
    if (card.id !== id) return card;
    const at = GAIT_CYCLE.indexOf(card.pace as (typeof GAIT_CYCLE)[number]);
    const next = at < 0 ? GAIT_CYCLE[0] : GAIT_CYCLE[(at + 1) % GAIT_CYCLE.length];
    if (!next || next === card.pace) return card;
    return { ...card, pace: next, audit: "pace" };
  });
}

/** A blank title is left as it is. */
export function editBerth(cards: readonly BerthCard[], id: string, title: unknown): BerthCard[] {
  const next = berthLine(title);
  if (!next) return readBerths(cards);
  const current = readBerths(cards);
  if (current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

export function editBerthNote(cards: readonly BerthCard[], id: string, note: unknown): BerthCard[] {
  const next = berthNote(note);
  return readBerths(cards).map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "note" } : card));
}

export function addBerthTag(cards: readonly BerthCard[], id: string, tag: unknown): BerthCard[] {
  const next = tagsOf(tag);
  if (!next.length) return readBerths(cards);
  return readBerths(cards).map((card) => {
    if (card.id !== id) return card;
    const tags = tagsOf([...card.tags, ...next]);
    if (tags.join() === card.tags.join()) return card;
    return { ...card, tags, audit: "tag" };
  });
}

export function setBerthRank(cards: readonly BerthCard[], id: string, rank: unknown): BerthCard[] {
  const next = rankOf(rank);
  if (next === null) return readBerths(cards);
  return readBerths(cards).map((card) => (card.id === id && card.rank !== next ? { ...card, rank: next, audit: "rank" } : card));
}

/** Snooze steps a blank span to 15, 5 to 15, and 15 to 60. A span of 60 stays. */
export function snoozeBerth(cards: readonly BerthCard[], id: string): BerthCard[] {
  return readBerths(cards).map((card) => {
    if (card.id !== id || card.span === 90) return card;
    const next = card.span === 30 ? 90 : 30;
    return { ...card, span: next, audit: "span" };
  });
}

export function setBerthPin(cards: readonly BerthCard[], id: string, pinned: boolean): BerthCard[] {
  return readBerths(cards).map((card) => (card.id === id && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function pinFocusedBerth(cards: readonly BerthCard[], shownIds: readonly string[], index: number): BerthCard[] {
  const id = shownIds[index];
  if (!id) return readBerths(cards);
  const card = readBerths(cards).find((item) => item.id === id);
  if (!card) return readBerths(cards);
  return setBerthPin(cards, id, !card.pinned);
}

export function snoozeFocusedBerth(cards: readonly BerthCard[], shownIds: readonly string[], index: number): BerthCard[] {
  const id = shownIds[index];
  return id ? snoozeBerth(cards, id) : readBerths(cards);
}

export function holdFocusedBerth(cards: readonly BerthCard[], shownIds: readonly string[], index: number): BerthCard[] {
  const id = shownIds[index];
  if (!id) return readBerths(cards);
  const card = readBerths(cards).find((item) => item.id === id);
  if (!card || card.archived) return readBerths(cards);
  return setBerthHold(cards, id, !card.held);
}

export function paceFocusedBerth(cards: readonly BerthCard[], shownIds: readonly string[], index: number): BerthCard[] {
  const id = shownIds[index];
  return id ? cyclePace(cards, id) : readBerths(cards);
}

export function sealFocusedBerth(cards: readonly BerthCard[], shownIds: readonly string[], index: number): BerthCard[] {
  const id = shownIds[index];
  if (!id) return readBerths(cards);
  const card = readBerths(cards).find((item) => item.id === id);
  if (!card) return readBerths(cards);
  return setBerthSeal(cards, id, !card.seal);
}

export function setBerthHold(cards: readonly BerthCard[], id: string, held: boolean): BerthCard[] {
  return readBerths(cards).map((card) => (card.id === id && !card.archived && card.held !== held ? { ...card, held, audit: held ? "hold" : "resume" } : card));
}

export function setBerthArchive(cards: readonly BerthCard[], id: string, archived: boolean): BerthCard[] {
  return readBerths(cards).map((card) => (card.id === id && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function setBerthSeal(cards: readonly BerthCard[], id: string, seal: boolean): BerthCard[] {
  return readBerths(cards).map((card) => (card.id === id && card.seal !== seal ? { ...card, seal, audit: "seal" } : card));
}

export function bulkBerthCord(cards: readonly BerthCard[], ids: readonly string[], cord: unknown): BerthCard[] {
  const next = cordOf(cord);
  if (!next) return readBerths(cards);
  const want = new Set(ids);
  return readBerths(cards).map((card) => (want.has(card.id) && card.cord !== next ? { ...card, cord: next, audit: "cord" } : card));
}

export function bulkBerthPin(cards: readonly BerthCard[], ids: readonly string[], pinned: boolean): BerthCard[] {
  const want = new Set(ids);
  return readBerths(cards).map((card) => (want.has(card.id) && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkBerthArchive(cards: readonly BerthCard[], ids: readonly string[], archived: boolean): BerthCard[] {
  const want = new Set(ids);
  return readBerths(cards).map((card) => (want.has(card.id) && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function bulkBerthPace(cards: readonly BerthCard[], ids: readonly string[], pace: unknown): BerthCard[] {
  const next = paceName(pace);
  if (!next) return readBerths(cards);
  const want = new Set(ids);
  return readBerths(cards).map((card) => (want.has(card.id) && card.pace !== next ? { ...card, pace: next, audit: "pace" } : card));
}

export function bulkBerthTag(cards: readonly BerthCard[], ids: readonly string[], tag: unknown): BerthCard[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addBerthTag(rows, id, tag) : rows), readBerths(cards));
}

export function resetBerths(): BerthCard[] {
  return [];
}

/** An open slip whose hook sits more than two hooks behind the desk. A raised rank, a hold, or an archive is not late. */
export function lateBerth(card: BerthCard, desk: unknown): boolean {
  const gap = hookGap(card.hook, desk);
  return inTray(card, "open") && card.rank === 2 && gap !== null && gap > 3;
}

/** An open slip with a span of 5 minutes is due now. A raised rank, a hold, or an archive is not. */
export function soonBerth(card: BerthCard): boolean {
  return inTray(card, "open") && card.rank === 2 && card.span === 10;
}

/** An open resting slip on a sprint pace whose hook is 7. That quiet sprint is cooling. */
export function coolingBerth(card: BerthCard): boolean {
  return inTray(card, "open") && card.rank === 2 && card.pace === "sprint" && card.hook === 1;
}

/** Open slips that are late or due now. A raised slip stays off the reminder list. */
export function reminderBerths(cards: readonly BerthCard[], desk: unknown): BerthCard[] {
  return readBerths(cards).filter((card) => lateBerth(card, desk) || soonBerth(card));
}

export function coolingBerths(cards: readonly BerthCard[]): BerthCard[] {
  return readBerths(cards).filter((card) => coolingBerth(card));
}

/** Open slips whose hook sits within three hooks of the desk. A raised rank, a hold, or an archive stays out. */
export function windowBerths(cards: readonly BerthCard[], desk: unknown): BerthCard[] {
  return readBerths(cards).filter((card) => {
    const gap = hookGap(card.hook, desk);
    return inTray(card, "open") && card.rank === 2 && gap !== null && gap >= -2 && gap <= 2;
  });
}

export function matchedBerths(cards: readonly BerthCard[], desk: unknown): number {
  const at = hookOf(desk);
  if (at === null) return 0;
  return readBerths(cards).filter((card) => inTray(card, "open") && card.rank === 2 && card.hook === at).length;
}

function hookHit(hook: number | null, exact: number | null, pick: HookPick | null): boolean {
  if (exact !== null) return hook === exact;
  if (pick === null) return true;
  if (pick === "blank") return hook === null;
  if (pick === "peak") return peakHook(hook);
  if (pick === "quiet") return quietHook(hook);
  return hookBand(hook) === pick;
}

/** Search matches the title, the note, the clerk, and the tags. */
export function visibleBerths(
  cards: readonly BerthCard[],
  tray: BerthTray,
  query: string,
  clerk: string | null,
  cord: string | null,
  pace: string | null,
  exact: number | null,
  pick: HookPick | null,
  span: number | "blank" | null,
  rank: number | "blank" | null,
  sprintOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): BerthCard[] {
  const text = query.trim().toLowerCase();
  return readBerths(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text) {
      const hay = `${card.title} ${card.note} ${card.clerk} ${card.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (clerk !== null && card.clerk !== clerk) return false;
    if (cord === "blank" ? Boolean(card.cord) : cord && card.cord !== cord) return false;
    if (pace === "blank" ? Boolean(card.pace) : pace && card.pace !== pace) return false;
    if (!hookHit(card.hook, exact, pick)) return false;
    if (span === "blank" ? card.span !== null : span !== null && card.span !== span) return false;
    if (rank === "blank" ? card.rank !== 2 : rank !== null && card.rank !== rank) return false;
    if (sprintOnly && card.pace !== "sprint") return false;
    if (peakOnly && !peakHook(card.hook)) return false;
    if (houseOnly && !houseCord(card.cord)) return false;
    if (quietOnly && !quietHook(card.hook)) return false;
    if (restingOnly && card.rank !== 2) return false;
    return true;
  });
}

export function sortBerths(cards: readonly BerthCard[], mode: BerthSort): BerthCard[] {
  const rows = cards.slice();
  if (mode === "clerk") return rows.sort((a, b) => a.clerk.localeCompare(b.clerk) || (a.hook ?? 99) - (b.hook ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.hook ?? 99) - (b.hook ?? 99) || a.title.localeCompare(b.title));
}

export function berthIndex(cards: readonly BerthCard[], query: string): BerthCard[] {
  const text = query.trim().toLowerCase();
  return sortBerths(
    readBerths(cards).filter((card) => card.hook !== null && (!text || card.title.toLowerCase().includes(text))),
    "hook",
  );
}

/** Open slips grouped by hook, earliest hook first. A blank hook stays off the timeline. */
export function berthTimeline(cards: readonly BerthCard[]): { hook: number; titles: string[] }[] {
  const rows = readBerths(cards).filter((card) => inTray(card, "open") && card.hook !== null);
  const hooks = Array.from(new Set(rows.map((card) => card.hook as number))).sort((a, b) => a - b);
  return hooks.map((hook) => ({
    hook,
    titles: rows.filter((card) => card.hook === hook).map((card) => card.title).sort((a, b) => a.localeCompare(b)),
  }));
}

export function berthCounts(cards: readonly BerthCard[], desk: unknown): BerthCounts {
  const rows = readBerths(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    archived: rows.filter((card) => inTray(card, "archived")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => inTray(card, "open") && card.rank === 2 && peakHook(card.hook)).length,
    late: rows.filter((card) => lateBerth(card, desk)).length,
    soon: rows.filter((card) => soonBerth(card)).length,
    rank: rows.filter((card) => inTray(card, "open") && card.rank > 2).length,
    house: rows.filter((card) => inTray(card, "open") && houseCord(card.cord)).length,
    window: windowBerths(rows, desk).length,
    matched: matchedBerths(rows, desk),
    seal: rows.filter((card) => card.seal).length,
    cooling: rows.filter((card) => coolingBerth(card)).length,
  };
}

export function berthShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open slips as a share of every open slip. */
export function lateBerthShare(cards: readonly BerthCard[], desk: unknown): number {
  const rows = readBerths(cards).filter((card) => inTray(card, "open"));
  return berthShare(rows.filter((card) => lateBerth(card, desk)).length, rows.length);
}

export function usedHooks(cards: readonly BerthCard[]): number {
  return new Set(readBerths(cards).filter((card) => inTray(card, "open") && card.hook !== null).map((card) => card.hook)).size;
}

/** Open slips that share a hook. */
export function clashHookCount(cards: readonly BerthCard[]): number {
  const open = readBerths(cards).filter((card) => inTray(card, "open") && card.hook !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].hook === open[j].hook) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open slips that share a span. */
export function spanClashCount(cards: readonly BerthCard[]): number {
  const open = readBerths(cards).filter((card) => inTray(card, "open") && card.span !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].span === open[j].span) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open slips whose hooks sit exactly three hooks apart. */
export function adjacentBerthCount(cards: readonly BerthCard[]): number {
  const open = readBerths(cards).filter((card) => inTray(card, "open") && card.hook !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].hook || 0) - (open[j].hook || 0)) === 4) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The cord with the fewest open slips.
 * A tie keeps WIRE, then HEMP, then SILK.
 * An empty desk still suggests WIRE.
 */
export function suggestCord(cards: readonly BerthCard[]): "WIRE" | "HEMP" | "SILK" {
  const rows = readBerths(cards).filter((card) => inTray(card, "open"));
  const order = ["WIRE", "HEMP", "SILK"] as const;
  let best: "WIRE" | "HEMP" | "SILK" = "WIRE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cord of order) {
    const count = rows.filter((card) => card.cord === cord).length;
    if (count < bestCount) {
      best = cord;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The SLA with the fewest open slips.
 * A tie keeps 30, then 10, then 90.
 * An empty desk still suggests 30.
 */
export function suggestSpan(cards: readonly BerthCard[]): 30 | 10 | 90 {
  const rows = readBerths(cards).filter((card) => inTray(card, "open"));
  const order = [30, 10, 90] as const;
  let best: 30 | 10 | 90 = 30;
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

/** The newest clerk already written on a slip. A blank clerk is skipped. */
export function suggestClerk(cards: readonly BerthCard[]): string {
  const found = readBerths(cards).find((card) => card.clerk);
  return found ? found.clerk : "";
}

/**
 * The clerk carrying the fewest open slips.
 * A tie keeps the earlier name on the roster. A blank clerk is not a load.
 * An empty roster falls back to the newest clerk.
 */
export function fairClerk(cards: readonly BerthCard[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = berthClerk(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestClerk(cards);
  const open = readBerths(cards).filter((card) => inTray(card, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.clerk === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The clerk with the most open slips. A tie keeps the name that sorts later. */
export function busiestClerk(cards: readonly BerthCard[]): string {
  const rows = readBerths(cards).filter((card) => inTray(card, "open") && card.clerk);
  const names: string[] = [];
  for (const card of rows) if (!names.includes(card.clerk)) names.push(card.clerk);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((card) => card.clerk === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function berthClerks(cards: readonly BerthCard[]): string[] {
  const out: string[] = [];
  for (const card of readBerths(cards)) {
    if (card.clerk && !out.includes(card.clerk)) out.push(card.clerk);
  }
  return out;
}

export function berthCords(cards: readonly BerthCard[]): string[] {
  const out: string[] = [];
  for (const card of readBerths(cards)) {
    if (card.cord && !out.includes(card.cord)) out.push(card.cord);
  }
  return out;
}

/** Open slips whose clerk also berthes another open slip on a different hook. */
export function pairBerthCount(cards: readonly BerthCard[]): number {
  const open = readBerths(cards).filter((card) => inTray(card, "open") && card.clerk && card.hook !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].clerk === open[j].clerk && open[i].hook !== open[j].hook) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open slips that share a cord on different hooks. */
export function sharedCordCount(cards: readonly BerthCard[]): number {
  const open = readBerths(cards).filter((card) => inTray(card, "open") && card.cord && card.hook !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].cord === open[j].cord && open[i].hook !== open[j].hook) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The rank of open slips. The resting rank of 1 still counts. */
export function rankLoad(cards: readonly BerthCard[]): number {
  return readBerths(cards).filter((card) => inTray(card, "open")).reduce((sum, card) => sum + card.rank, 0);
}

/** Open slips that are both the quiet hook and a house cord. */
export function quietHallBerths(cards: readonly BerthCard[]): number {
  return readBerths(cards).filter((card) => inTray(card, "open") && quietHook(card.hook) && houseCord(card.cord)).length;
}

/** Open slips whose pace is sprint. */
export function sprintBerthLoad(cards: readonly BerthCard[]): number {
  return readBerths(cards).filter((card) => inTray(card, "open") && card.pace === "sprint").length;
}

export function hookWidth(cards: readonly BerthCard[]): number {
  const hooks = readBerths(cards).filter((card) => inTray(card, "open") && card.hook !== null).map((card) => card.hook as number);
  if (!hooks.length) return 0;
  return Math.max(...hooks) - Math.min(...hooks);
}

/** The next open slip whose hook sits ahead of the desk. An unset desk has no next slip. */
export function nextBerth(cards: readonly BerthCard[], desk: unknown): string {
  const at = hookOf(desk);
  if (at === null) return "";
  const rows = readBerths(cards)
    .filter((card) => inTray(card, "open") && card.rank === 2 && card.hook !== null && (card.hook as number) > at)
    .sort((a, b) => (a.hook || 0) - (b.hook || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveBerthFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function berthCopy(card: BerthCard, desk: unknown): string {
  const gap = hookGap(card.hook, desk);
  return [card.title, card.clerk, card.hook ?? "", card.cord, card.pace, card.span ?? "", card.rank, card.tags.join(" "), card.seal ? "1" : "0", card.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap and the late mark use the hook you pass. */
export function berthsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,clerk,hook,cord,pace,span,rank,tags,pinned,held,archived,seal,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readBerths(raw);
  const windowIds = new Set(windowBerths(rows, desk).map((card) => card.id));
  const at = hookOf(desk);
  for (const card of rows) {
    const gap = hookGap(card.hook, desk);
    lines.push([
      card.title,
      card.clerk,
      card.hook === null ? "" : String(card.hook),
      card.cord,
      card.pace,
      card.span === null ? "" : String(card.span),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.archived ? "1" : "0",
      card.seal ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBerth(card, desk) ? "1" : "0",
      soonBerth(card) ? "1" : "0",
      houseCord(card.cord) ? "1" : "0",
      windowIds.has(card.id) ? "1" : "0",
      at !== null && card.hook === at && card.rank === 1 && inTray(card, "open") ? "1" : "0",
      coolingBerth(card) ? "1" : "0",
      card.note,
      card.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeClerk(raw: string, clerks: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return clerks.includes(raw) ? raw : "all";
}

export function activeCord(raw: string, cords: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = cordOf(raw);
  return name && cords.map((item) => item.toUpperCase()).includes(name) ? name : cords.includes(raw) ? raw : "all";
}

export function activePace(raw: string, paces: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return paces.includes(raw) ? raw : "all";
}

export function activeHook(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return hookOf(raw) === null ? "all" : raw;
}

export function activeSpan(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return spanOf(raw) === null ? "all" : raw;
}

export function activeRank(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return rankOf(raw) === null ? "all" : raw;
}

export function clerkArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function cordArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return cordOf(filter) || null;
}

export function paceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function hookArg(filter: string): { exact: number | null; pick: HookPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: hookOf(filter), pick: null };
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

function readView(raw: unknown): BerthView | null {
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
    clerk: clip(row.clerk, 20),
    cord: clip(row.cord, 12),
    pace: clip(row.pace, 8),
    hook: clip(row.hook, 8),
    span: clip(row.span, 8),
    rank: clip(row.rank, 8),
  };
}

export function readBerthViews(raw: unknown): BerthView[] {
  if (!Array.isArray(raw)) return [];
  const out: BerthView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addBerthView(views: readonly BerthView[], view: BerthView): BerthView[] {
  const current = readBerthViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropBerthView(views: readonly BerthView[], id: string): BerthView[] {
  return readBerthViews(views).filter((view) => view.id !== id);
}

function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

function badgeParts(value: BadgeValue): { name: string; check: string; tier: string; ok: boolean } {
  if (typeof value === "string") return { name: clip(value, 48), check: "", tier: "", ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { name: "", check: "", tier: "", ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { name: "", check: "", tier: "", ok: false };
  if (!("name" in value) && !("check" in value) && !("tier" in value)) {
    return { name: "", check: "", tier: "", ok: false };
  }
  const nameRaw = "name" in value ? value.name : "";
  const checkRaw = "check" in value ? value.check : "";
  const tierRaw = "tier" in value ? value.tier : "";
  if (!textOk(nameRaw) || !textOk(checkRaw) || !textOk(tierRaw)) {
    return { name: "", check: "", tier: "", ok: false };
  }
  return {
    name: clip(nameRaw, 48),
    check: clip(checkRaw, 16).toUpperCase(),
    tier: clip(tierRaw, 16).toUpperCase(),
    ok: true,
  };
}

export function badgeState(value: BadgeValue): BadgeState {
  const found = badgeParts(value);
  if (!found.ok) return "";
  return found.name ? "set" : "clear";
}

export function badgeCopy(value: BadgeValue): string {
  const found = badgeParts(value);
  return found.ok ? found.name : "";
}

/** The badge mark is the first letter of each word, up to two. Digits are not letters. */
export function badgeSigil(value: BadgeValue): string {
  const text = badgeCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the name is a cipher. Approved is a seal. Pending is a queue.
 * Rejected is a gate. Hold is a vault. A blank status is a hall.
 * Any other status is a vault. A digit wins over the status.
 */
export function badgeLane(value: BadgeValue): BadgeLane {
  const found = badgeParts(value);
  if (!found.ok || !found.name) return "";
  if (/\d/.test(found.name)) return "cipher";
  if (!found.check) return "hall";
  if (found.check === "APPROVED") return "seal";
  if (found.check === "HOLD") return "vault";
  if (found.check === "PENDING") return "queue";
  if (found.check === "REJECTED") return "gate";
  return "vault";
}

/**
 * A blank method is haze. Wire and bank are gilt. Card is linen.
 * Crypto and wallet are pale. Any other method is ash.
 */
export function badgeTone(value: BadgeValue): BadgeTone {
  const found = badgeParts(value);
  if (!found.ok || !found.name) return "";
  if (!found.tier) return "haze";
  if (found.tier === "WIRE" || found.tier === "BANK") return "gilt";
  if (found.tier === "CARD") return "linen";
  if (found.tier === "CRYPTO" || found.tier === "WALLET") return "pale";
  return "ash";
}

export function joinedBadge(value: BadgeValue): boolean {
  return badgeCopy(value).includes("&");
}

export function joinedBadgeCount(rows: readonly BadgeRow[]): number {
  return rows.filter((row) => joinedBadge(row.note)).length;
}

export function wideBadge(value: BadgeValue): boolean {
  return badgeCopy(value).length >= 14;
}

export function wideBadgeCount(rows: readonly BadgeRow[]): number {
  return rows.filter((row) => wideBadge(row.note)).length;
}

export function giltBadgeCount(rows: readonly BadgeRow[]): number {
  return rows.filter((row) => badgeTone(row.note) === "gilt").length;
}

export function hallBadgeCount(rows: readonly BadgeRow[]): number {
  return rows.filter((row) => badgeLane(row.note) === "hall").length;
}

export function queueBadgeCount(rows: readonly BadgeRow[]): number {
  return rows.filter((row) => badgeLane(row.note) === "queue").length;
}

export function gateBadgeCount(rows: readonly BadgeRow[]): number {
  return rows.filter((row) => badgeLane(row.note) === "gate").length;
}

export function sealBadgeCount(rows: readonly BadgeRow[]): number {
  return rows.filter((row) => badgeLane(row.note) === "seal").length;
}

export function vaultBadgeCount(rows: readonly BadgeRow[]): number {
  return rows.filter((row) => badgeLane(row.note) === "vault").length;
}

export function cipherBadgeCount(rows: readonly BadgeRow[]): number {
  return rows.filter((row) => badgeLane(row.note) === "cipher").length;
}

export function sharedBadgeCount(rows: readonly BadgeRow[]): number {
  const marks = rows.map((row) => badgeSigil(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(badgeSigil(row.note))).length;
}

export function badgeLanes(rows: readonly BadgeRow[]): BadgeLaneLine[] {
  const lanes = ["hall", "seal", "queue", "gate", "vault", "cipher"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => badgeLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingBadge(rows: readonly BadgeRow[]): string {
  const lines = badgeLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingBadgeTone(rows: readonly BadgeRow[]): string {
  const tones = ["gilt", "pale", "linen", "ash", "haze"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => badgeTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function badgeShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function badgeStep(value: BadgeValue): 0 | 1 | 2 | 3 {
  const text = badgeCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words === 2) return 2;
  return 3;
}

export function presentBadgeLanes(rows: readonly BadgeRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = badgeState(row.note);
    const lane = state === "set" ? badgeLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenBadges(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "hall" || lane === "seal" || lane === "queue" || lane === "gate" || lane === "vault" || lane === "cipher" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedBadges(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleBadge(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleBadgeReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkBadgeReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleBadgeLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleBadges(
  rows: readonly BadgeRow[],
  lane: BadgeLane | "blank" | null,
  tone: BadgeTone | null,
  query: string,
  review: BadgeReview,
  reviewed: readonly string[],
  shape: BadgeShape,
): BadgeRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = badgeState(row.note);
    if (!state) return false;
    const token = state === "set" ? badgeLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && badgeTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${badgeCopy(row.note)} ${badgeSigil(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "join" && !joinedBadge(row.note)) return false;
    if (shape === "wide" && !wideBadge(row.note)) return false;
    if (shape === "hall" && badgeLane(row.note) !== "hall") return false;
    if (shape === "cipher" && badgeLane(row.note) !== "cipher") return false;
    if (shape === "seal" && badgeLane(row.note) !== "seal") return false;
    return true;
  });
}

export function activeBadgeLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeBadgeTone(raw: string): string {
  return raw === "gilt" || raw === "pale" || raw === "linen" || raw === "ash" || raw === "haze" || raw === "all" ? raw : "all";
}

export function badgeLaneArg(filter: string): BadgeLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "hall" || filter === "seal" || filter === "queue" || filter === "gate" || filter === "vault" || filter === "cipher") return filter;
  return null;
}

export function badgeToneArg(filter: string): BadgeTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "pale" || filter === "linen" || filter === "ash" || filter === "haze") return filter;
  return null;
}

export function badgesCsv(rows: readonly BadgeRow[]): string {
  const lines = ["lane,count"];
  for (const line of badgeLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function badgeRowsCsv(rows: readonly BadgeRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,tone,step,join,wide,hall,queue,gate,seal,vault,cipher,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = badgeParts(row.note);
    if (!found.ok) continue;
    const lane = badgeLane(row.note);
    lines.push([
      found.name,
      badgeSigil(row.note),
      lane,
      badgeTone(row.note),
      String(badgeStep(row.note)),
      joinedBadge(row.note) ? "1" : "0",
      wideBadge(row.note) ? "1" : "0",
      lane === "hall" ? "1" : "0",
      lane === "queue" ? "1" : "0",
      lane === "gate" ? "1" : "0",
      lane === "seal" ? "1" : "0",
      lane === "vault" ? "1" : "0",
      lane === "cipher" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
