/**
 * Refectory slips for shift handoffs, and dialect marks already stored as name, language, and country.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_refectory_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   steward text not null default '',
 *   bench integer,
 *   grain text not null default '',
 *   temper text not null default '',
 *   bell integer,
 *   rank integer not null default 0,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   wax boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_dialect_mark_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_dialect_mark_review (
 *   trader_id text primary key
 * );
 */

export const RSL_KEY = "crmv4-refectory-slip";
export const RSL_VIEW_KEY = "crmv4-refectory-views";
export const RSL_DENSITY_KEY = "crmv4-refectory-density";
export const DLG_KEY = "crmv4-dialect-hide";
export const DLG_REVIEW_KEY = "crmv4-dialect-review";

export type GrainName = "blank" | "barley" | "rye" | "wheat";

export type TemperName = "blank" | "cool" | "even" | "hot";

export type SlipTray = "open" | "held" | "archived";

export type BenchPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type SlipDensity = "airy" | "tight";

export type SlipSort = "bench" | "steward";

export type SlipCard = {
  id: string;
  title: string;
  note: string;
  steward: string;
  bench: number | null;
  grain: string;
  temper: string;
  bell: number | null;
  rank: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  wax: boolean;
  audit: string;
};

export type SlipView = {
  id: string;
  name: string;
  tray: SlipTray;
  query: string;
  steward: string;
  grain: string;
  temper: string;
  bench: string;
  bell: string;
  rank: string;
};

export type SlipCounts = {
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
  wax: number;
  cooling: number;
};

export type DialectLane = "" | "hall" | "house" | "desk" | "guest" | "scroll" | "glyph";

export type DialectTone = "" | "gilt" | "pale" | "linen" | "ash" | "haze";

export type DialectState = "" | "clear" | "set";

export type DialectShape = "all" | "join" | "wide" | "hall" | "glyph" | "house";

export type DialectReview = "all" | "reviewed" | "fresh";

export type DialectValue = string | { name?: unknown; tongue?: unknown; land?: unknown; [key: string]: unknown } | null | undefined;

export type DialectRow = { id: string; label: string; note: DialectValue };

export type DialectLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "temper", "pin", "unpin", "hold", "resume", "archive", "open", "grain", "tag", "rank", "bell", "wax"] as const;

const GRAINS = ["barley", "rye", "wheat"] as const;

const TEMPERS = ["cool", "even", "hot"] as const;

const TEMPER_CYCLE = ["cool", "even", "hot"] as const;

const PEAK_BENCHES = new Set([1, 4]);

const QUIET_BENCHES = new Set([5]);

const HOUSE = new Set(["RYE", "WHEAT"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const RSL_CAP = 8;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SlipTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function grainName(raw: unknown): Exclude<GrainName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (GRAINS as readonly string[]).includes(text) ? (text as Exclude<GrainName, "blank">) : "";
}

function temperName(raw: unknown): Exclude<TemperName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TEMPERS as readonly string[]).includes(text) ? (text as Exclude<TemperName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[abcd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: SlipCard, tray: SlipTray): boolean {
  if (tray === "held") return card.held && !card.archived;
  if (tray === "archived") return card.archived;
  return !card.held && !card.archived;
}

/** A blank title is left out. The saved title stays short. */
export function slipLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function slipNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank steward stays blank. It is not filled in. */
export function slipSteward(raw: unknown): string {
  return clip(raw, 18);
}

/** A grain is BARLEY, ASH, or WHEAT. Anything else stays blank. Letters are stored in capitals. */
export function grainOf(raw: unknown): string {
  const name = grainName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bench is an integer from 1 through 6.
 * A blank value stays unset. 0 is not a bench.
 * A second digit is not a bench.
 */
export function benchOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-6]$/.test(text)) return null;
  return Number(text);
}

/** A bell length is 10, 20, or 40 minutes. A blank value stays unset. */
export function bellOf(raw: unknown): 10 | 20 | 40 | null {
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  if (raw === 40 || raw === "40") return 40;
  return null;
}

/** Rank is 0, 2, or 5. Anything else is not a rank. 0 is the resting rank. */
export function rankOf(raw: unknown): 0 | 2 | 5 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 2 || raw === "2") return 2;
  if (raw === 5 || raw === "5") return 5;
  return null;
}

export function benchBand(bench: unknown): "blank" | "early" | "mid" | "late" {
  const value = benchOf(bench);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
}

/** Peak benches are 1 and 4. An unset bench is not a peak bench. */
export function peakBench(bench: unknown): boolean {
  const value = benchOf(bench);
  return value !== null && PEAK_BENCHES.has(value);
}

/** The quiet bench is 5. A peak bench is not quiet. An unset bench is not quiet. */
export function quietBench(bench: unknown): boolean {
  const value = benchOf(bench);
  return value !== null && QUIET_BENCHES.has(value);
}

/**
 * How far a bench sits behind the desk bench.
 * A positive gap means the slip is behind. A negative gap means it is ahead.
 * A gap of zero means the same bench. An unset bench has no gap. Benches do not wrap.
 */
export function benchGap(bench: unknown, desk: unknown): number | null {
  const from = benchOf(bench);
  const at = benchOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** BARLEY and WHEAT are house grains. ASH is a guest grain. A blank grain is not a house grain. */
export function houseGrain(grain: unknown): boolean {
  return HOUSE.has(grainOf(grain));
}

export function slipDensity(raw: unknown): SlipDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function slipSort(raw: unknown): SlipSort {
  return raw === "steward" ? "steward" : "bench";
}

function readOne(raw: unknown): SlipCard | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = slipLine(row.title);
  if (!id || !title) return null;
  const rank = rankOf(row.rank);
  return {
    id,
    title,
    note: slipNote(row.note),
    steward: slipSteward(row.steward),
    bench: benchOf(row.bench),
    grain: grainOf(row.grain),
    temper: temperName(row.temper),
    bell: bellOf(row.bell),
    rank: rank === null ? 0 : rank,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    wax: row.wax === true,
    audit: auditCode(row.audit),
  };
}

export function readSlips(raw: unknown): SlipCard[] {
  if (!Array.isArray(raw)) return [];
  const out: SlipCard[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, RSL_CAP);
}

export function addSlip(
  cards: readonly SlipCard[],
  card: {
    id: string;
    title: string;
    note?: string;
    steward?: string;
    bench?: unknown;
    grain?: string;
    temper?: string;
    bell?: unknown;
    rank?: unknown;
    tags?: unknown;
  },
): SlipCard[] {
  const current = readSlips(cards);
  const id = String(card.id || "").trim();
  const title = slipLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rank = rankOf(card.rank);
  const next: SlipCard = {
    id,
    title,
    note: slipNote(card.note),
    steward: slipSteward(card.steward),
    bench: benchOf(card.bench),
    grain: grainOf(card.grain),
    temper: temperName(card.temper),
    bell: bellOf(card.bell),
    rank: rank === null ? 0 : rank,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    archived: false,
    wax: false,
    audit: "save",
  };
  return [next, ...current].slice(0, RSL_CAP);
}

/** A blank temper becomes cool, cool becomes even, even becomes hot, and hot returns to cool. */
export function cycleTemper(cards: readonly SlipCard[], id: string): SlipCard[] {
  return readSlips(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TEMPER_CYCLE.indexOf(card.temper as (typeof TEMPER_CYCLE)[number]);
    const next = at < 0 ? TEMPER_CYCLE[0] : TEMPER_CYCLE[(at + 1) % TEMPER_CYCLE.length];
    if (!next || next === card.temper) return card;
    return { ...card, temper: next, audit: "temper" };
  });
}

/** A blank title is left as it is. */
export function editSlip(cards: readonly SlipCard[], id: string, title: unknown): SlipCard[] {
  const next = slipLine(title);
  if (!next) return readSlips(cards);
  const current = readSlips(cards);
  if (current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

export function editSlipNote(cards: readonly SlipCard[], id: string, note: unknown): SlipCard[] {
  const next = slipNote(note);
  return readSlips(cards).map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "note" } : card));
}

export function addSlipTag(cards: readonly SlipCard[], id: string, tag: unknown): SlipCard[] {
  const next = tagsOf(tag);
  if (!next.length) return readSlips(cards);
  return readSlips(cards).map((card) => {
    if (card.id !== id) return card;
    const tags = tagsOf([...card.tags, ...next]);
    if (tags.join() === card.tags.join()) return card;
    return { ...card, tags, audit: "tag" };
  });
}

export function setSlipRank(cards: readonly SlipCard[], id: string, rank: unknown): SlipCard[] {
  const next = rankOf(rank);
  if (next === null) return readSlips(cards);
  return readSlips(cards).map((card) => (card.id === id && card.rank !== next ? { ...card, rank: next, audit: "rank" } : card));
}

/** Snooze steps a blank bell to 20, 10 to 20, and 20 to 40. A bell of 40 stays. */
export function snoozeSlip(cards: readonly SlipCard[], id: string): SlipCard[] {
  return readSlips(cards).map((card) => {
    if (card.id !== id || card.bell === 40) return card;
    const next = card.bell === 20 ? 40 : 20;
    return { ...card, bell: next, audit: "bell" };
  });
}

export function setSlipPin(cards: readonly SlipCard[], id: string, pinned: boolean): SlipCard[] {
  return readSlips(cards).map((card) => (card.id === id && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function pinFocusedSlip(cards: readonly SlipCard[], shownIds: readonly string[], index: number): SlipCard[] {
  const id = shownIds[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  if (!card) return readSlips(cards);
  return setSlipPin(cards, id, !card.pinned);
}

export function snoozeFocusedSlip(cards: readonly SlipCard[], shownIds: readonly string[], index: number): SlipCard[] {
  const id = shownIds[index];
  return id ? snoozeSlip(cards, id) : readSlips(cards);
}

export function holdFocusedSlip(cards: readonly SlipCard[], shownIds: readonly string[], index: number): SlipCard[] {
  const id = shownIds[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  if (!card || card.archived) return readSlips(cards);
  return setSlipHold(cards, id, !card.held);
}

export function temperFocusedSlip(cards: readonly SlipCard[], shownIds: readonly string[], index: number): SlipCard[] {
  const id = shownIds[index];
  return id ? cycleTemper(cards, id) : readSlips(cards);
}

export function waxFocusedSlip(cards: readonly SlipCard[], shownIds: readonly string[], index: number): SlipCard[] {
  const id = shownIds[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  if (!card) return readSlips(cards);
  return setSlipWax(cards, id, !card.wax);
}

export function setSlipHold(cards: readonly SlipCard[], id: string, held: boolean): SlipCard[] {
  return readSlips(cards).map((card) => (card.id === id && !card.archived && card.held !== held ? { ...card, held, audit: held ? "hold" : "resume" } : card));
}

export function setSlipArchive(cards: readonly SlipCard[], id: string, archived: boolean): SlipCard[] {
  return readSlips(cards).map((card) => (card.id === id && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function setSlipWax(cards: readonly SlipCard[], id: string, wax: boolean): SlipCard[] {
  return readSlips(cards).map((card) => (card.id === id && card.wax !== wax ? { ...card, wax, audit: "wax" } : card));
}

export function bulkSlipGrain(cards: readonly SlipCard[], ids: readonly string[], grain: unknown): SlipCard[] {
  const next = grainOf(grain);
  if (!next) return readSlips(cards);
  const want = new Set(ids);
  return readSlips(cards).map((card) => (want.has(card.id) && card.grain !== next ? { ...card, grain: next, audit: "grain" } : card));
}

export function bulkSlipPin(cards: readonly SlipCard[], ids: readonly string[], pinned: boolean): SlipCard[] {
  const want = new Set(ids);
  return readSlips(cards).map((card) => (want.has(card.id) && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkSlipArchive(cards: readonly SlipCard[], ids: readonly string[], archived: boolean): SlipCard[] {
  const want = new Set(ids);
  return readSlips(cards).map((card) => (want.has(card.id) && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function bulkSlipTemper(cards: readonly SlipCard[], ids: readonly string[], temper: unknown): SlipCard[] {
  const next = temperName(temper);
  if (!next) return readSlips(cards);
  const want = new Set(ids);
  return readSlips(cards).map((card) => (want.has(card.id) && card.temper !== next ? { ...card, temper: next, audit: "temper" } : card));
}

export function bulkSlipTag(cards: readonly SlipCard[], ids: readonly string[], tag: unknown): SlipCard[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addSlipTag(rows, id, tag) : rows), readSlips(cards));
}

export function resetSlips(): SlipCard[] {
  return [];
}

/** An open slip whose bench sits more than two benches behind the desk. A raised rank, a hold, or an archive is not late. */
export function lateSlip(card: SlipCard, desk: unknown): boolean {
  const gap = benchGap(card.bench, desk);
  return inTray(card, "open") && card.rank === 0 && gap !== null && gap > 1;
}

/** An open slip with a bell of 4 minutes is due now. A raised rank, a hold, or an archive is not. */
export function soonSlip(card: SlipCard): boolean {
  return inTray(card, "open") && card.rank === 0 && card.bell === 10;
}

/** An open resting slip on a hot temper whose bench is 6. That quiet hot is cooling. */
export function coolingSlip(card: SlipCard): boolean {
  return inTray(card, "open") && card.rank === 0 && card.temper === "hot" && card.bench === 5;
}

/** Open slips that are late or due now. A raised slip stays off the reminder list. */
export function reminderSlips(cards: readonly SlipCard[], desk: unknown): SlipCard[] {
  return readSlips(cards).filter((card) => lateSlip(card, desk) || soonSlip(card));
}

export function coolingSlips(cards: readonly SlipCard[]): SlipCard[] {
  return readSlips(cards).filter((card) => coolingSlip(card));
}

/** Open slips whose bench sits within two benches of the desk. A raised rank, a hold, or an archive stays out. */
export function windowSlips(cards: readonly SlipCard[], desk: unknown): SlipCard[] {
  return readSlips(cards).filter((card) => {
    const gap = benchGap(card.bench, desk);
    return inTray(card, "open") && card.rank === 0 && gap !== null && gap >= -2 && gap <= 2;
  });
}

export function matchedSlips(cards: readonly SlipCard[], desk: unknown): number {
  const at = benchOf(desk);
  if (at === null) return 0;
  return readSlips(cards).filter((card) => inTray(card, "open") && card.rank === 0 && card.bench === at).length;
}

function benchHit(bench: number | null, exact: number | null, pick: BenchPick | null): boolean {
  if (exact !== null) return bench === exact;
  if (pick === null) return true;
  if (pick === "blank") return bench === null;
  if (pick === "peak") return peakBench(bench);
  if (pick === "quiet") return quietBench(bench);
  return benchBand(bench) === pick;
}

/** Search matches the title, the note, the steward, and the tags. */
export function visibleSlips(
  cards: readonly SlipCard[],
  tray: SlipTray,
  query: string,
  steward: string | null,
  grain: string | null,
  temper: string | null,
  exact: number | null,
  pick: BenchPick | null,
  bell: number | "blank" | null,
  rank: number | "blank" | null,
  hotOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): SlipCard[] {
  const text = query.trim().toLowerCase();
  return readSlips(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text) {
      const hay = `${card.title} ${card.note} ${card.steward} ${card.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (steward !== null && card.steward !== steward) return false;
    if (grain === "blank" ? Boolean(card.grain) : grain && card.grain !== grain) return false;
    if (temper === "blank" ? Boolean(card.temper) : temper && card.temper !== temper) return false;
    if (!benchHit(card.bench, exact, pick)) return false;
    if (bell === "blank" ? card.bell !== null : bell !== null && card.bell !== bell) return false;
    if (rank === "blank" ? card.rank !== 1 : rank !== null && card.rank !== rank) return false;
    if (hotOnly && card.temper !== "hot") return false;
    if (peakOnly && !peakBench(card.bench)) return false;
    if (houseOnly && !houseGrain(card.grain)) return false;
    if (quietOnly && !quietBench(card.bench)) return false;
    if (restingOnly && card.rank !== 1) return false;
    return true;
  });
}

export function sortSlips(cards: readonly SlipCard[], mode: SlipSort): SlipCard[] {
  const rows = cards.slice();
  if (mode === "steward") return rows.sort((a, b) => a.steward.localeCompare(b.steward) || (a.bench ?? 99) - (b.bench ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bench ?? 99) - (b.bench ?? 99) || a.title.localeCompare(b.title));
}

export function slipIndex(cards: readonly SlipCard[], query: string): SlipCard[] {
  const text = query.trim().toLowerCase();
  return sortSlips(
    readSlips(cards).filter((card) => card.bench !== null && (!text || card.title.toLowerCase().includes(text))),
    "bench",
  );
}

export function slipCounts(cards: readonly SlipCard[], desk: unknown): SlipCounts {
  const rows = readSlips(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    archived: rows.filter((card) => inTray(card, "archived")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => inTray(card, "open") && card.rank === 0 && peakBench(card.bench)).length,
    late: rows.filter((card) => lateSlip(card, desk)).length,
    soon: rows.filter((card) => soonSlip(card)).length,
    rank: rows.filter((card) => inTray(card, "open") && card.rank > 1).length,
    house: rows.filter((card) => inTray(card, "open") && houseGrain(card.grain)).length,
    window: windowSlips(rows, desk).length,
    matched: matchedSlips(rows, desk),
    wax: rows.filter((card) => card.wax).length,
    cooling: rows.filter((card) => coolingSlip(card)).length,
  };
}

export function slipShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open slips as a share of every open slip. */
export function lateSlipShare(cards: readonly SlipCard[], desk: unknown): number {
  const rows = readSlips(cards).filter((card) => inTray(card, "open"));
  return slipShare(rows.filter((card) => lateSlip(card, desk)).length, rows.length);
}

export function usedBenches(cards: readonly SlipCard[]): number {
  return new Set(readSlips(cards).filter((card) => inTray(card, "open") && card.bench !== null).map((card) => card.bench)).size;
}

/** Open slips that share a bench. */
export function clashBenchCount(cards: readonly SlipCard[]): number {
  const open = readSlips(cards).filter((card) => inTray(card, "open") && card.bench !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].bench === open[j].bench) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open slips that share a bell length. */
export function bellClashCount(cards: readonly SlipCard[]): number {
  const open = readSlips(cards).filter((card) => inTray(card, "open") && card.bell !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].bell === open[j].bell) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open slips whose benches sit exactly two benches apart. */
export function adjacentSlipCount(cards: readonly SlipCard[]): number {
  const open = readSlips(cards).filter((card) => inTray(card, "open") && card.bench !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].bench || 0) - (open[j].bench || 0)) === 2) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The grain with the fewest open slips.
 * A tie keeps WHEAT, then ASH, then BARLEY.
 * An empty desk still suggests WHEAT.
 */
export function suggestGrain(cards: readonly SlipCard[]): "RYE" | "WHEAT" | "BARLEY" {
  const rows = readSlips(cards).filter((card) => inTray(card, "open"));
  const order = ["RYE", "WHEAT", "BARLEY"] as const;
  let best: "RYE" | "WHEAT" | "BARLEY" = "RYE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const grain of order) {
    const count = rows.filter((card) => card.grain === grain).length;
    if (count < bestCount) {
      best = grain;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The bell length with the fewest open slips.
 * A tie keeps 12, then 4, then 36.
 * An empty desk still suggests 12.
 */
export function suggestBell(cards: readonly SlipCard[]): 10 | 20 | 40 {
  const rows = readSlips(cards).filter((card) => inTray(card, "open"));
  const order = [20, 10, 40] as const;
  let best: 10 | 20 | 40 = 20;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const bell of order) {
    const count = rows.filter((card) => card.bell === bell).length;
    if (count < bestCount) {
      best = bell;
      bestCount = count;
    }
  }
  return best;
}

/** The newest steward already written on a slip. A blank steward is skipped. */
export function suggestSlipSteward(cards: readonly SlipCard[]): string {
  const found = readSlips(cards).find((card) => card.steward);
  return found ? found.steward : "";
}

/**
 * The steward carrying the fewest open slips.
 * A tie keeps the earlier name on the roster. A blank steward is not a load.
 * An empty roster falls back to the newest steward.
 */
export function fairSlipSteward(cards: readonly SlipCard[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = slipSteward(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestSlipSteward(cards);
  const open = readSlips(cards).filter((card) => inTray(card, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.steward === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The steward with the most open slips. A tie keeps the name that sorts later. */
export function busiestSlipSteward(cards: readonly SlipCard[]): string {
  const rows = readSlips(cards).filter((card) => inTray(card, "open") && card.steward);
  const names: string[] = [];
  for (const card of rows) if (!names.includes(card.steward)) names.push(card.steward);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((card) => card.steward === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function slipStewards(cards: readonly SlipCard[]): string[] {
  const out: string[] = [];
  for (const card of readSlips(cards)) {
    if (card.steward && !out.includes(card.steward)) out.push(card.steward);
  }
  return out;
}

export function slipGrains(cards: readonly SlipCard[]): string[] {
  const out: string[] = [];
  for (const card of readSlips(cards)) {
    if (card.grain && !out.includes(card.grain)) out.push(card.grain);
  }
  return out;
}

/** Open slips whose steward also watches another open slip on a different bench. */
export function pairSlipCount(cards: readonly SlipCard[]): number {
  const open = readSlips(cards).filter((card) => inTray(card, "open") && card.steward && card.bench !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].steward === open[j].steward && open[i].bench !== open[j].bench) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open slips that share a grain on different benches. */
export function sharedGrainCount(cards: readonly SlipCard[]): number {
  const open = readSlips(cards).filter((card) => inTray(card, "open") && card.grain && card.bench !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].grain === open[j].grain && open[i].bench !== open[j].bench) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The rank of open slips. The resting rank of 1 still counts. */
export function rankLoad(cards: readonly SlipCard[]): number {
  return readSlips(cards).filter((card) => inTray(card, "open")).reduce((sum, card) => sum + card.rank, 0);
}

/** Open slips that are both the quiet bench and a house grain. */
export function quietHallSlips(cards: readonly SlipCard[]): number {
  return readSlips(cards).filter((card) => inTray(card, "open") && quietBench(card.bench) && houseGrain(card.grain)).length;
}

/** Open slips whose temper is hot. */
export function hotSlipLoad(cards: readonly SlipCard[]): number {
  return readSlips(cards).filter((card) => inTray(card, "open") && card.temper === "hot").length;
}

export function benchWidth(cards: readonly SlipCard[]): number {
  const benches = readSlips(cards).filter((card) => inTray(card, "open") && card.bench !== null).map((card) => card.bench as number);
  if (!benches.length) return 0;
  return Math.max(...benches) - Math.min(...benches);
}

/** The next open slip whose bench sits ahead of the desk. An unset desk has no next slip. */
export function nextSlip(cards: readonly SlipCard[], desk: unknown): string {
  const at = benchOf(desk);
  if (at === null) return "";
  const rows = readSlips(cards)
    .filter((card) => inTray(card, "open") && card.rank === 0 && card.bench !== null && (card.bench as number) > at)
    .sort((a, b) => (a.bench || 0) - (b.bench || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveSlipFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function slipCopy(card: SlipCard, desk: unknown): string {
  const gap = benchGap(card.bench, desk);
  return [card.title, card.steward, card.bench ?? "", card.grain, card.temper, card.bell ?? "", card.rank, card.tags.join(" "), card.wax ? "1" : "0", card.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap and the late mark use the bench you pass. */
export function slipsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,steward,bench,grain,temper,bell,rank,tags,pinned,held,archived,wax,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readSlips(raw);
  const windowIds = new Set(windowSlips(rows, desk).map((card) => card.id));
  const at = benchOf(desk);
  for (const card of rows) {
    const gap = benchGap(card.bench, desk);
    lines.push([
      card.title,
      card.steward,
      card.bench === null ? "" : String(card.bench),
      card.grain,
      card.temper,
      card.bell === null ? "" : String(card.bell),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.archived ? "1" : "0",
      card.wax ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(card, desk) ? "1" : "0",
      soonSlip(card) ? "1" : "0",
      houseGrain(card.grain) ? "1" : "0",
      windowIds.has(card.id) ? "1" : "0",
      at !== null && card.bench === at && card.rank === 0 && inTray(card, "open") ? "1" : "0",
      coolingSlip(card) ? "1" : "0",
      card.note,
      card.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeSlipSteward(raw: string, stewards: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return stewards.includes(raw) ? raw : "all";
}

export function activeGrain(raw: string, grains: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = grainOf(raw);
  return name && grains.map((item) => item.toUpperCase()).includes(name) ? name : grains.includes(raw) ? raw : "all";
}

export function activeTemper(raw: string, tempers: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return tempers.includes(raw) ? raw : "all";
}

export function activeBench(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return benchOf(raw) === null ? "all" : raw;
}

export function activeBell(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return bellOf(raw) === null ? "all" : raw;
}

export function activeRank(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return rankOf(raw) === null ? "all" : raw;
}

export function slipStewardArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function grainArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return grainOf(filter) || null;
}

export function temperArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return temperName(filter) || null;
}

export function benchArg(filter: string): { exact: number | null; pick: BenchPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: benchOf(filter), pick: null };
}

export function bellArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return bellOf(filter);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

function readView(raw: unknown): SlipView | null {
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
    steward: clip(row.steward, 18),
    grain: clip(row.grain, 12),
    temper: clip(row.temper, 8),
    bench: clip(row.bench, 8),
    bell: clip(row.bell, 8),
    rank: clip(row.rank, 8),
  };
}

export function readSlipViews(raw: unknown): SlipView[] {
  if (!Array.isArray(raw)) return [];
  const out: SlipView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlipView(views: readonly SlipView[], view: SlipView): SlipView[] {
  const current = readSlipViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropSlipView(views: readonly SlipView[], id: string): SlipView[] {
  return readSlipViews(views).filter((view) => view.id !== id);
}

function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

function dialectParts(value: DialectValue): { name: string; tongue: string; land: string; ok: boolean } {
  if (typeof value === "string") return { name: clip(value, 48), tongue: "", land: "", ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { name: "", tongue: "", land: "", ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { name: "", tongue: "", land: "", ok: false };
  if (!("name" in value) && !("tongue" in value) && !("land" in value)) {
    return { name: "", tongue: "", land: "", ok: false };
  }
  const nameRaw = "name" in value ? value.name : "";
  const tongueRaw = "tongue" in value ? value.tongue : "";
  const landRaw = "land" in value ? value.land : "";
  if (!textOk(nameRaw) || !textOk(tongueRaw) || !textOk(landRaw)) {
    return { name: "", tongue: "", land: "", ok: false };
  }
  return {
    name: clip(nameRaw, 48),
    tongue: clip(tongueRaw, 24).toUpperCase(),
    land: clip(landRaw, 24),
    ok: true,
  };
}

export function dialectState(value: DialectValue): DialectState {
  const found = dialectParts(value);
  if (!found.ok) return "";
  return found.name ? "set" : "clear";
}

export function dialectCopy(value: DialectValue): string {
  const found = dialectParts(value);
  return found.ok ? found.name : "";
}

/** The dialect is the first letter of each word, up to two. Digits are not letters. */
export function dialectSigil(value: DialectValue): string {
  const text = dialectCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the name is a glyph. English and Turkish are house.
 * German, Russian, and Arabic are desk. Any other two-letter language is a guest.
 * A longer language code is a scroll. A blank language is a hall. A digit wins.
 */
export function dialectLane(value: DialectValue): DialectLane {
  const found = dialectParts(value);
  if (!found.ok || !found.name) return "";
  if (/\d/.test(found.name)) return "glyph";
  const tongue = found.tongue;
  if (!tongue) return "hall";
  if (tongue === "EN" || tongue === "TR") return "house";
  if (tongue === "DE" || tongue === "RU" || tongue === "AR") return "desk";
  if (tongue.length > 2) return "scroll";
  return "guest";
}

/**
 * XX and NONE are ash. English is gilt.
 * A country of six letters or more is linen. A shorter country is pale.
 * A blank country, with none of those tongues, is haze.
 */
export function dialectTone(value: DialectValue): DialectTone {
  const found = dialectParts(value);
  if (!found.ok || !found.name) return "";
  if (found.tongue === "XX" || found.tongue === "NONE") return "ash";
  if (found.tongue === "EN") return "gilt";
  if (found.land.length >= 6) return "linen";
  if (found.land.length > 0) return "pale";
  return "haze";
}

export function joinedDialect(value: DialectValue): boolean {
  return dialectCopy(value).includes("&");
}

export function joinedDialectCount(rows: readonly DialectRow[]): number {
  return rows.filter((row) => joinedDialect(row.note)).length;
}

export function wideDialect(value: DialectValue): boolean {
  return dialectCopy(value).length >= 10;
}

export function wideDialectCount(rows: readonly DialectRow[]): number {
  return rows.filter((row) => wideDialect(row.note)).length;
}

export function giltDialectCount(rows: readonly DialectRow[]): number {
  return rows.filter((row) => dialectTone(row.note) === "gilt").length;
}

export function hallDialectCount(rows: readonly DialectRow[]): number {
  return rows.filter((row) => dialectLane(row.note) === "hall").length;
}

export function guestDialectCount(rows: readonly DialectRow[]): number {
  return rows.filter((row) => dialectLane(row.note) === "guest").length;
}

export function deskDialectCount(rows: readonly DialectRow[]): number {
  return rows.filter((row) => dialectLane(row.note) === "desk").length;
}

export function houseDialectCount(rows: readonly DialectRow[]): number {
  return rows.filter((row) => dialectLane(row.note) === "house").length;
}

export function scrollDialectCount(rows: readonly DialectRow[]): number {
  return rows.filter((row) => dialectLane(row.note) === "scroll").length;
}

export function glyphDialectCount(rows: readonly DialectRow[]): number {
  return rows.filter((row) => dialectLane(row.note) === "glyph").length;
}

export function sharedDialectCount(rows: readonly DialectRow[]): number {
  const dialects = rows.map((row) => dialectSigil(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const dialect of dialects) {
    if (dialects.filter((item) => item === dialect).length > 1) hit.add(dialect);
  }
  return rows.filter((row) => hit.has(dialectSigil(row.note))).length;
}

export function dialectLanes(rows: readonly DialectRow[]): DialectLaneLine[] {
  const lanes = ["hall", "house", "desk", "guest", "scroll", "glyph"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => dialectLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingDialect(rows: readonly DialectRow[]): string {
  const lines = dialectLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingDialectTone(rows: readonly DialectRow[]): string {
  const tones = ["gilt", "pale", "linen", "ash", "haze"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => dialectTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function dialectShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function dialectStep(value: DialectValue): 0 | 1 | 2 | 3 {
  const text = dialectCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words === 2) return 2;
  return 3;
}

export function presentDialectLanes(rows: readonly DialectRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = dialectState(row.note);
    const lane = state === "set" ? dialectLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenDialects(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "hall" || lane === "house" || lane === "desk" || lane === "guest" || lane === "scroll" || lane === "glyph" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedDialects(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleDialect(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleDialectReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkDialectReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleDialectLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleDialects(
  rows: readonly DialectRow[],
  lane: DialectLane | "blank" | null,
  tone: DialectTone | null,
  query: string,
  review: DialectReview,
  reviewed: readonly string[],
  shape: DialectShape,
): DialectRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = dialectState(row.note);
    if (!state) return false;
    const token = state === "set" ? dialectLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && dialectTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${dialectCopy(row.note)} ${dialectSigil(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "join" && !joinedDialect(row.note)) return false;
    if (shape === "wide" && !wideDialect(row.note)) return false;
    if (shape === "hall" && dialectLane(row.note) !== "hall") return false;
    if (shape === "glyph" && dialectLane(row.note) !== "glyph") return false;
    if (shape === "house" && dialectLane(row.note) !== "house") return false;
    return true;
  });
}

export function activeDialectLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeDialectTone(raw: string): string {
  return raw === "gilt" || raw === "pale" || raw === "linen" || raw === "ash" || raw === "haze" || raw === "all" ? raw : "all";
}

export function dialectLaneArg(filter: string): DialectLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "hall" || filter === "house" || filter === "desk" || filter === "guest" || filter === "scroll" || filter === "glyph") return filter;
  return null;
}

export function dialectToneArg(filter: string): DialectTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "pale" || filter === "linen" || filter === "ash" || filter === "haze") return filter;
  return null;
}

export function dialectsCsv(rows: readonly DialectRow[]): string {
  const lines = ["lane,count"];
  for (const line of dialectLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function dialectRowsCsv(rows: readonly DialectRow[], reviewed: readonly string[]): string {
  const lines = ["name,dialect,lane,tone,step,join,wide,hall,guest,desk,house,scroll,glyph,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = dialectParts(row.note);
    if (!found.ok) continue;
    const lane = dialectLane(row.note);
    lines.push([
      found.name,
      dialectSigil(row.note),
      lane,
      dialectTone(row.note),
      String(dialectStep(row.note)),
      joinedDialect(row.note) ? "1" : "0",
      wideDialect(row.note) ? "1" : "0",
      lane === "hall" ? "1" : "0",
      lane === "guest" ? "1" : "0",
      lane === "desk" ? "1" : "0",
      lane === "house" ? "1" : "0",
      lane === "scroll" ? "1" : "0",
      lane === "glyph" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
