/**
 * Handoff briefs for the shift desk, and pledge marks already stored on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_handoff_brief (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   author text not null default '',
 *   hour integer,
 *   lane text not null default '',
 *   stage text not null default '',
 *   weight integer,
 *   length integer,
 *   tags text not null default '',
 *   pause integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_pledge_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_pledge_review (
 *   customer_id text primary key
 * );
 */

export const HBF_KEY = "crmv4-handoff-brief";
export const HBF_VIEW_KEY = "crmv4-handoff-views";
export const HBF_DENSITY_KEY = "crmv4-handoff-density";
export const PLEDGE_KEY = "crmv4-pledge-hide";
export const PLEDGE_REVIEW_KEY = "crmv4-pledge-review";

export type HbfLane = "blank" | "ink" | "oak" | "gilt";

export type HbfStage = "blank" | "draft" | "sent" | "ack";

export type HbfTray = "open" | "held" | "closed";

export type HourPick = "blank" | "early" | "mid" | "late" | "peak" | "dawn";

export type HbfDensity = "roomy" | "tight";

export type HbfSort = "hour" | "title";

export type HandoffBrief = {
  id: string;
  title: string;
  note: string;
  author: string;
  hour: number | null;
  lane: string;
  stage: string;
  weight: number | null;
  length: number | null;
  tags: string[];
  pause: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type HbfView = {
  id: string;
  name: string;
  tray: HbfTray;
  query: string;
  author: string;
  lane: string;
  stage: string;
  hour: string;
  weight: string;
  length: string;
};

export type HbfCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  pause: number;
  house: number;
};

export type PledgeState = "" | "set" | "clear";

export type PledgeBand = "" | "dot" | "line" | "page";

export type PledgeTone = "" | "warm" | "cool";

export type PledgeShape = "all" | "catalog" | "page" | "warm";

export type PledgeValue =
  | { retentionNote?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type PledgeRow = { id: string; note?: PledgeValue; label?: string | null };

export type PledgeBandLine = { band: string; count: number };

const AUDITS = ["save", "edit", "stage", "pin", "unpin", "hold", "lift", "close", "reopen", "lane", "tag", "pause"] as const;

const LANES = ["ink", "oak", "gilt"] as const;

const STAGES = ["draft", "sent", "ack"] as const;

const STAGE_ORDER = ["", "draft", "sent", "ack"] as const;

const HOUR_PICKS = ["blank", "early", "mid", "late", "peak", "dawn"] as const;

const PEAK_HOURS = new Set([3, 6, 9, 12]);

const DAWN_HOURS = new Set([2, 7]);

const HOUSE = new Set(["INK", "GILT"]);

const PLEDGE_BANDS = ["dot", "line", "page"] as const;

const CATALOG = new Set(["CALL", "MAIL", "VISIT"]);

const PLEDGE_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const BRIEF_CAP = 6;

const VIEW_CAP = 3;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): HbfTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function laneName(raw: unknown): Exclude<HbfLane, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (LANES as readonly string[]).includes(text) ? (text as Exclude<HbfLane, "blank">) : "";
}

function stageName(raw: unknown): Exclude<HbfStage, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (STAGES as readonly string[]).includes(text) ? (text as Exclude<HbfStage, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function briefLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function briefNote(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank author stays blank. It is not filled in. */
export function authorLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A lane is INK, OAK, or GILT. Anything else stays blank. Letters are stored in capitals. */
export function laneOf(raw: unknown): string {
  const name = laneName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * An hour is an integer from 1 through 12.
 * A blank value stays unset. 0 and 13 are not hours.
 * A leading zero is not an hour.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 12) return null;
    return raw;
  }
  const text = clip(raw, 4);
  if (!/^[1-9]\d?$/.test(text)) return null;
  const value = Number(text);
  return value >= 1 && value <= 12 ? value : null;
}

/** A weight is 1, 3, or 5. A blank value stays unset. A leading zero is not a weight. */
export function weightOf(raw: unknown): 1 | 3 | 5 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 5 || raw === "5") return 5;
  return null;
}

/** A length is 20, 40, or 80. A blank value stays unset. A leading zero is not a length. */
export function lengthOf(raw: unknown): 20 | 40 | 80 | null {
  if (raw === 20 || raw === "20") return 20;
  if (raw === 40 || raw === "40") return 40;
  if (raw === 80 || raw === "80") return 80;
  return null;
}

/** A pause mark is 0, 20, or 40. Anything else stays unset. */
export function pauseOf(raw: unknown): 0 | 20 | 40 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 20 || raw === "20") return 20;
  if (raw === 40 || raw === "40") return 40;
  return null;
}

/** Early is 1 through 3. Mid is 4 through 8. Late is 9 through 12. */
export function hourBand(hour: unknown): "blank" | "early" | "mid" | "late" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 8) return "mid";
  return "late";
}

/** Peak hours are 3, 6, 9, and 12. An unset hour is not a peak. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAK_HOURS.has(value);
}

/** Dawn hours are 2 and 7. A peak hour is not dawn. An unset hour is not dawn. */
export function dawnHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && DAWN_HOURS.has(value);
}

/**
 * The shortest signed step from the saved hour to the typed hour.
 * The ring wraps at 12. A step of 6 stays. A step of -6 stays.
 */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return diff;
}

/** INK and GILT are house lanes. OAK is a guest lane. A blank lane is not a house lane. */
export function houseLane(lane: unknown): boolean {
  return HOUSE.has(laneOf(lane));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): HbfDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Hour or title. Anything else stays on the hour. */
export function sortMode(raw: unknown): HbfSort {
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

function readOne(raw: unknown): HandoffBrief | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<HandoffBrief>;
  const id = clip(row.id, 24);
  const title = briefLine(row.title);
  if (!id || !title) return null;
  const pause = pauseOf(row.pause);
  return {
    id,
    title,
    note: briefNote(row.note),
    author: authorLabel(row.author),
    hour: hourOf(row.hour),
    lane: laneOf(row.lane),
    stage: stageName(row.stage),
    weight: weightOf(row.weight),
    length: lengthOf(row.length),
    tags: tagsOf(row.tags),
    pause: pause === null ? 0 : pause,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readBriefs(raw: unknown): HandoffBrief[] {
  if (!Array.isArray(raw)) return [];
  const out: HandoffBrief[] = [];
  for (const item of raw) {
    const brief = readOne(item);
    if (!brief || out.some((row) => row.id === brief.id || row.title === brief.title)) continue;
    out.push(brief);
  }
  return out.slice(0, BRIEF_CAP);
}

export function addBrief(
  briefs: readonly HandoffBrief[],
  brief: {
    id: string;
    title: string;
    note?: string;
    author?: string;
    hour?: unknown;
    lane?: string;
    stage?: string;
    weight?: unknown;
    length?: unknown;
    tags?: unknown;
    pause?: unknown;
  },
): HandoffBrief[] {
  const current = readBriefs(briefs);
  const id = String(brief.id || "").trim();
  const title = briefLine(brief.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const pause = pauseOf(brief.pause);
  const next: HandoffBrief = {
    id,
    title,
    note: briefNote(brief.note),
    author: authorLabel(brief.author),
    hour: hourOf(brief.hour),
    lane: laneOf(brief.lane),
    stage: stageName(brief.stage),
    weight: weightOf(brief.weight),
    length: lengthOf(brief.length),
    tags: tagsOf(brief.tags),
    pause: pause === null ? 0 : pause,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, BRIEF_CAP);
}

export function cycleStage(briefs: readonly HandoffBrief[], id: string): HandoffBrief[] {
  return readBriefs(briefs).map((brief) => {
    if (brief.id !== id) return brief;
    const at = STAGE_ORDER.indexOf(brief.stage as (typeof STAGE_ORDER)[number]);
    const next = at < 0 || at >= STAGES.length ? STAGES[0] : STAGES[at % STAGES.length];
    if (!next || next === brief.stage) return brief;
    return { ...brief, stage: next, audit: "stage" };
  });
}

export function setBriefPin(briefs: readonly HandoffBrief[], id: string, pinned: boolean): HandoffBrief[] {
  return readBriefs(briefs).map((brief) => (brief.id === id ? { ...brief, pinned, audit: pinned ? "pin" : "unpin" } : brief));
}

export function setBriefHold(briefs: readonly HandoffBrief[], id: string, held: boolean): HandoffBrief[] {
  return readBriefs(briefs).map((brief) => (brief.id === id ? { ...brief, held, audit: held ? "hold" : "lift" } : brief));
}

export function setBriefClose(briefs: readonly HandoffBrief[], id: string, closed: boolean): HandoffBrief[] {
  return readBriefs(briefs).map((brief) => (brief.id === id ? { ...brief, closed, audit: closed ? "close" : "reopen" } : brief));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editBrief(briefs: readonly HandoffBrief[], id: string, title: string): HandoffBrief[] {
  const current = readBriefs(briefs);
  const next = briefLine(title);
  if (!next || current.some((brief) => brief.id !== id && brief.title === next)) return current;
  return current.map((brief) => (brief.id === id && brief.title !== next ? { ...brief, title: next, audit: "edit" } : brief));
}

/** A blank note is left out. The same note is left as it is. */
export function editBriefNote(briefs: readonly HandoffBrief[], id: string, note: string): HandoffBrief[] {
  const current = readBriefs(briefs);
  const next = briefNote(note);
  if (!next) return current;
  return current.map((brief) => (brief.id === id && brief.note !== next ? { ...brief, note: next, audit: "edit" } : brief));
}

/** A tag that is already on the brief, or a third tag, is left out. */
export function addBriefTag(briefs: readonly HandoffBrief[], id: string, tag: unknown): HandoffBrief[] {
  const next = tagOf(tag);
  if (!next) return readBriefs(briefs);
  return readBriefs(briefs).map((brief) => {
    if (brief.id !== id || brief.tags.includes(next) || brief.tags.length >= TAG_CAP) return brief;
    return { ...brief, tags: [...brief.tags, next], audit: "tag" };
  });
}

/** An unknown pause mark is left as it is. 0 clears the pause mark. */
export function setBriefPause(briefs: readonly HandoffBrief[], id: string, pause: unknown): HandoffBrief[] {
  const next = pauseOf(pause);
  if (next === null) return readBriefs(briefs);
  return readBriefs(briefs).map((brief) => (brief.id === id && brief.pause !== next ? { ...brief, pause: next, audit: "pause" } : brief));
}

export function bulkBriefLane(briefs: readonly HandoffBrief[], ids: readonly string[], lane: unknown): HandoffBrief[] {
  const next = laneOf(lane);
  if (!next) return readBriefs(briefs);
  const picked = new Set(ids);
  return readBriefs(briefs).map((brief) => (picked.has(brief.id) && brief.lane !== next ? { ...brief, lane: next, audit: "lane" } : brief));
}

export function bulkBriefPin(briefs: readonly HandoffBrief[], ids: readonly string[], pinned: boolean): HandoffBrief[] {
  const picked = new Set(ids);
  return readBriefs(briefs).map((brief) => (picked.has(brief.id) && brief.pinned !== pinned ? { ...brief, pinned, audit: pinned ? "pin" : "unpin" } : brief));
}

export function bulkBriefClose(briefs: readonly HandoffBrief[], ids: readonly string[], closed: boolean): HandoffBrief[] {
  const picked = new Set(ids);
  return readBriefs(briefs).map((brief) => (picked.has(brief.id) && brief.closed !== closed ? { ...brief, closed, audit: closed ? "close" : "reopen" } : brief));
}

export function bulkBriefTag(briefs: readonly HandoffBrief[], ids: readonly string[], tag: unknown): HandoffBrief[] {
  return ids.reduce((rows, id) => addBriefTag(rows, id, tag), readBriefs(briefs));
}

export function resetBriefs(): HandoffBrief[] {
  return [];
}

function inTray(brief: HandoffBrief, tray: HbfTray): boolean {
  if (tray === "closed") return brief.closed;
  if (tray === "held") return brief.held && !brief.closed;
  return !brief.held && !brief.closed;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "peak") return peakHour(hour);
  if (pick === "dawn") return dawnHour(hour);
  return hourBand(hour) === pick;
}

/** An open brief whose hour sits more than four steps behind the desk hour. A pause, a hold, or a close is not late. */
export function lateBrief(brief: HandoffBrief, desk: unknown): boolean {
  const gap = hourGap(brief.hour, desk);
  return inTray(brief, "open") && brief.pause === 0 && gap !== null && gap > 4;
}

/** An open brief with a length of 20 is the reminder. A pause, a hold, or a close is not. */
export function soonBrief(brief: HandoffBrief): boolean {
  return inTray(brief, "open") && brief.pause === 0 && brief.length === 20;
}

/** Open briefs that are late or soon. A paused brief stays off the reminder list. */
export function reminderBriefs(briefs: readonly HandoffBrief[], desk: unknown): HandoffBrief[] {
  return readBriefs(briefs).filter((brief) => lateBrief(brief, desk) || soonBrief(brief));
}

/** Search matches the title, the note, the author, and the tags. */
export function visibleBriefs(
  briefs: readonly HandoffBrief[],
  tray: HbfTray,
  query: string,
  author: string | null,
  lane: HbfLane | null,
  stage: HbfStage | null,
  exact: number | null,
  pick: HourPick | null,
  weight: number | "blank" | null,
  length: number | "blank" | null,
  draftingOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  dawnOnly: boolean,
  awakeOnly: boolean,
): HandoffBrief[] {
  const text = query.trim().toLowerCase();
  return readBriefs(briefs).filter((brief) => {
    if (!inTray(brief, tray)) return false;
    if (text) {
      const hay = `${brief.title} ${brief.note} ${brief.author} ${brief.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (author === "") {
      if (brief.author) return false;
    } else if (author && brief.author !== author) return false;
    if (lane === "blank") {
      if (brief.lane) return false;
    } else if (lane && brief.lane !== laneOf(lane)) return false;
    if (stage === "blank") {
      if (brief.stage) return false;
    } else if (stage && brief.stage !== stage) return false;
    if (!hourHit(brief.hour, exact, pick)) return false;
    if (weight === "blank") {
      if (brief.weight !== null) return false;
    } else if (typeof weight === "number" && brief.weight !== weight) return false;
    if (length === "blank") {
      if (brief.length !== null) return false;
    } else if (typeof length === "number" && brief.length !== length) return false;
    if (draftingOnly && brief.stage !== "draft") return false;
    if (peakOnly && !peakHour(brief.hour)) return false;
    if (houseOnly && !houseLane(brief.lane)) return false;
    if (dawnOnly && !dawnHour(brief.hour)) return false;
    if (awakeOnly && brief.pause !== 0) return false;
    return true;
  });
}

export function briefCounts(briefs: readonly HandoffBrief[], desk: unknown): HbfCounts {
  const rows = readBriefs(briefs);
  return {
    open: rows.filter((brief) => inTray(brief, "open")).length,
    held: rows.filter((brief) => inTray(brief, "held")).length,
    closed: rows.filter((brief) => inTray(brief, "closed")).length,
    pinned: rows.filter((brief) => brief.pinned).length,
    peak: rows.filter((brief) => peakHour(brief.hour) && inTray(brief, "open")).length,
    late: rows.filter((brief) => lateBrief(brief, desk)).length,
    soon: rows.filter((brief) => soonBrief(brief)).length,
    pause: rows.filter((brief) => inTray(brief, "open") && brief.pause !== 0).length,
    house: rows.filter((brief) => houseLane(brief.lane)).length,
  };
}

export function briefShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function sortBriefs(briefs: readonly HandoffBrief[], mode: HbfSort): HandoffBrief[] {
  const rows = briefs.slice();
  if (mode === "title") return rows.sort((a, b) => a.title.localeCompare(b.title) || (a.hour ?? 99) - (b.hour ?? 99));
  return rows.sort((a, b) => (a.hour ?? 99) - (b.hour ?? 99) || a.title.localeCompare(b.title));
}

export function briefTimeline(briefs: readonly HandoffBrief[], query: string): HandoffBrief[] {
  const text = query.trim().toLowerCase();
  return sortBriefs(
    readBriefs(briefs).filter((brief) => brief.hour !== null && (!text || brief.title.toLowerCase().includes(text))),
    "hour",
  );
}

/** Distinct hours on open briefs. */
export function usedHours(briefs: readonly HandoffBrief[]): number {
  const hours = new Set<number>();
  for (const brief of readBriefs(briefs)) {
    if (inTray(brief, "open") && brief.hour !== null) hours.add(brief.hour);
  }
  return hours.size;
}

/** Open briefs that share an hour and a lane. A different lane on the same hour is not a clash. */
export function clashHourCount(briefs: readonly HandoffBrief[]): number {
  const groups = new Map<string, number>();
  for (const brief of readBriefs(briefs)) {
    if (!inTray(brief, "open") || brief.hour === null || !brief.lane) continue;
    const key = `${brief.hour}:${brief.lane}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open briefs that share a weight. An unset weight is not a clash. */
export function weightClashCount(briefs: readonly HandoffBrief[]): number {
  const groups = new Map<number, number>();
  for (const brief of readBriefs(briefs)) {
    if (!inTray(brief, "open") || brief.weight === null) continue;
    groups.set(brief.weight, (groups.get(brief.weight) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * The next open brief at or after the desk hour.
 * An acknowledged stage, a pause, a hold, or a close is not next.
 * When every waiting hour is earlier, the earliest hour wraps around.
 */
export function nextBrief(briefs: readonly HandoffBrief[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readBriefs(briefs).filter((brief) => inTray(brief, "open") && brief.hour !== null && brief.stage !== "ack" && brief.pause === 0);
  if (!waiting.length) return "";
  const byHour = (a: HandoffBrief, b: HandoffBrief) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((brief) => (brief.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

/**
 * The lane with the fewest open briefs.
 * A tie keeps INK, then OAK, then GILT.
 * An empty desk still suggests INK.
 */
export function suggestLane(briefs: readonly HandoffBrief[]): "INK" | "OAK" | "GILT" {
  const rows = readBriefs(briefs).filter((brief) => inTray(brief, "open"));
  let best: "INK" | "OAK" | "GILT" = "INK";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const lane of LANES) {
    const stored = lane.toUpperCase() as "INK" | "OAK" | "GILT";
    const count = rows.filter((brief) => brief.lane === stored).length;
    if (count < bestCount) {
      best = stored;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The author carrying the fewest open briefs.
 * A tie keeps the earlier name. A blank author is not a load.
 * An empty desk stays blank.
 */
export function suggestAuthor(briefs: readonly HandoffBrief[]): string {
  const rows = readBriefs(briefs).filter((brief) => inTray(brief, "open") && brief.author);
  const names: string[] = [];
  for (const brief of rows) if (!names.includes(brief.author)) names.push(brief.author);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = rows.filter((brief) => brief.author === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The length with the fewest open briefs.
 * A tie keeps 40, then 20, then 80.
 * An empty desk suggests 40.
 */
export function suggestLength(briefs: readonly HandoffBrief[]): 20 | 40 | 80 {
  const rows = readBriefs(briefs).filter((brief) => inTray(brief, "open"));
  const order = [40, 20, 80] as const;
  let best: 20 | 40 | 80 = 40;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const length of order) {
    const count = rows.filter((brief) => brief.length === length).length;
    if (count < bestCount) {
      best = length;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The roster name carrying the fewest open briefs.
 * A tie keeps the earlier name in the roster.
 * A blank roster falls back to the suggested author.
 */
export function fairAuthor(briefs: readonly HandoffBrief[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = authorLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestAuthor(briefs);
  const open = readBriefs(briefs).filter((brief) => inTray(brief, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((brief) => brief.author === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The author on the most open briefs. A tie keeps the earlier name. */
export function busiestAuthor(briefs: readonly HandoffBrief[]): string {
  const rows = readBriefs(briefs).filter((brief) => inTray(brief, "open") && brief.author);
  const names: string[] = [];
  for (const brief of rows) if (!names.includes(brief.author)) names.push(brief.author);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((brief) => brief.author === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function briefAuthors(briefs: readonly HandoffBrief[]): string[] {
  const out: string[] = [];
  for (const brief of readBriefs(briefs)) if (brief.author && !out.includes(brief.author)) out.push(brief.author);
  return out;
}

export function briefLanes(briefs: readonly HandoffBrief[]): string[] {
  const out: string[] = [];
  for (const brief of readBriefs(briefs)) if (brief.lane && !out.includes(brief.lane)) out.push(brief.lane);
  return out;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function briefCopy(brief: HandoffBrief, desk: unknown): string {
  const gap = hourGap(brief.hour, desk);
  return [brief.title, brief.author, brief.hour ?? "", brief.lane, brief.stage, brief.weight ?? "", brief.length ?? "", brief.tags.join(" "), brief.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the briefs saved in this browser. The gap and the late mark use the hour you pass. */
export function briefsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,author,hour,lane,stage,weight,length,tags,pause,pinned,held,closed,gap,late,soon,house,note,audit"];
  for (const brief of readBriefs(raw)) {
    const gap = hourGap(brief.hour, desk);
    lines.push([
      csvCell(brief.title),
      csvCell(brief.author),
      brief.hour === null ? "" : String(brief.hour),
      brief.lane,
      brief.stage,
      brief.weight === null ? "" : String(brief.weight),
      brief.length === null ? "" : String(brief.length),
      csvCell(brief.tags.join(" ")),
      String(brief.pause),
      brief.pinned ? "1" : "0",
      brief.held ? "1" : "0",
      brief.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBrief(brief, desk) ? "1" : "0",
      soonBrief(brief) ? "1" : "0",
      houseLane(brief.lane) ? "1" : "0",
      csvCell(brief.note),
      brief.audit,
    ].join(","));
  }
  return lines.join("\n");
}

function authorSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return authorLabel(raw) || "all";
}

function laneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return laneOf(raw) || "all";
}

function stageSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stageName(raw) || "all";
}

function hourSlot(raw: unknown): string {
  if (raw === "all") return "all";
  return (HOUR_PICKS as readonly string[]).includes(String(raw)) ? String(raw) : "all";
}

function weightSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return raw === "1" || raw === "3" || raw === "5" ? raw : "all";
}

function lengthSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return raw === "20" || raw === "40" || raw === "80" ? raw : "all";
}

export function activeAuthor(filter: string, authors: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const name = authorLabel(filter);
  return name && authors.includes(name) ? name : "all";
}

export function activeLane(filter: string, lanes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const lane = laneOf(filter);
  return lane && lanes.includes(lane) ? lane : "all";
}

export function activeStage(filter: string, stages: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const stage = stageName(filter);
  return stage && stages.includes(stage) ? stage : "all";
}

export function activeHour(filter: string): string {
  return hourSlot(filter);
}

export function activeWeight(filter: string): string {
  return weightSlot(filter);
}

export function activeLength(filter: string): string {
  return lengthSlot(filter);
}

export function authorArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return authorLabel(filter) || null;
}

export function laneArg(filter: string): HbfLane | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const lane = laneName(filter);
  return lane || null;
}

export function stageArg(filter: string): HbfStage | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const stage = stageName(filter);
  return stage || null;
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

export function lengthArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return lengthOf(filter);
}

function readView(raw: unknown): HbfView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<HbfView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 40),
    author: authorSlot(row.author),
    lane: laneSlot(row.lane),
    stage: stageSlot(row.stage),
    hour: hourSlot(row.hour),
    weight: weightSlot(row.weight),
    length: lengthSlot(row.length),
  };
}

export function readBriefViews(raw: unknown): HbfView[] {
  if (!Array.isArray(raw)) return [];
  const out: HbfView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addBriefView(views: readonly HbfView[], view: HbfView): HbfView[] {
  const current = readBriefViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropBriefView(views: readonly HbfView[], id: string): HbfView[] {
  return readBriefViews(views).filter((view) => view.id !== id);
}

function pledgeBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function pledgeBlocked(value: object): boolean {
  return PLEDGE_BLOCK.some((key) => key in value);
}

function pledgeText(value: PledgeValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: pledgeBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (pledgeBlocked(value)) return { text: null, explicit: false };
  if (!("retentionNote" in value)) return { text: null, explicit: false };
  const inner = value.retentionNote;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: pledgeBody(inner), explicit: true };
}

/** Letters only, spaces and hyphens ignored, stored in capitals. */
export function pledgeToken(raw: unknown): string {
  return pledgeBody(raw).replace(/[\s-]+/g, "").toUpperCase();
}

export function pledgeState(value: PledgeValue): PledgeState {
  const found = pledgeText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function pledgeCopy(value: PledgeValue): string {
  const found = pledgeText(value);
  if (!found.text) return "";
  return found.text.slice(0, 48);
}

/** Four letters or fewer are a dot, ten or fewer are a line, and the rest are a page. */
export function pledgeBand(value: PledgeValue): PledgeBand {
  const text = pledgeCopy(value);
  if (!text) return "";
  if (text.length <= 4) return "dot";
  if (text.length <= 10) return "line";
  return "page";
}

/** A warm pledge starts with a vowel. A consonant start is cool. */
export function pledgeTone(value: PledgeValue): PledgeTone {
  const text = pledgeCopy(value);
  const match = text.match(/[A-Za-z]/);
  if (!match) return "";
  return /[aeiou]/i.test(match[0]) ? "warm" : "cool";
}

export function catalogPledge(value: PledgeValue): boolean {
  const found = pledgeText(value);
  if (!found.text) return false;
  return CATALOG.has(pledgeToken(found.text));
}

export function catalogPledgeCount(rows: readonly PledgeRow[]): number {
  return rows.filter((row) => catalogPledge(row.note)).length;
}

export function pagePledgeCount(rows: readonly PledgeRow[]): number {
  return rows.filter((row) => pledgeBand(row.note) === "page").length;
}

export function warmPledgeCount(rows: readonly PledgeRow[]): number {
  return rows.filter((row) => pledgeTone(row.note) === "warm").length;
}

export function sharedPledgeCount(rows: readonly PledgeRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const token = pledgeToken(pledgeCopy(row.note));
    if (!token) continue;
    groups.set(token, (groups.get(token) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function pledgeBands(rows: readonly PledgeRow[]): PledgeBandLine[] {
  return PLEDGE_BANDS.map((band) => ({ band, count: rows.filter((row) => pledgeBand(row.note) === band).length }));
}

/** The band with the most set notes. A tie keeps dot, then line, then page. */
export function leadingPledge(rows: readonly PledgeRow[]): string {
  const lines = pledgeBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || PLEDGE_BANDS.indexOf(a.band as (typeof PLEDGE_BANDS)[number]) - PLEDGE_BANDS.indexOf(b.band as (typeof PLEDGE_BANDS)[number]))[0].band;
}

/** The tone with the most set notes. A tie keeps warm. */
export function leadingPledgeTone(rows: readonly PledgeRow[]): string {
  const warm = warmPledgeCount(rows);
  const cool = rows.filter((row) => pledgeTone(row.note) === "cool").length;
  if (!warm && !cool) return "";
  return warm >= cool ? "warm" : "cool";
}

export function pledgeShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentPledges(rows: readonly PledgeRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = pledgeState(row.note);
    const band = state === "set" ? pledgeBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenPledges(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const band = clip(item, 12);
    if (present.includes(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function togglePledge(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  if (!present.includes(band)) return readHiddenPledges(hidden, present);
  const current = readHiddenPledges(hidden, present);
  return current.includes(band) ? current.filter((item) => item !== band) : [...current, band];
}

export function visiblePledgeBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const folded = new Set(hidden);
  return present.filter((band) => !folded.has(band));
}

export function readReviewedPledges(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function togglePledgeReview(reviewed: readonly string[], id: string, ids: readonly string[]): string[] {
  const current = readReviewedPledges(reviewed, ids);
  if (!ids.includes(id)) return current;
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

export function bulkPledgeReview(reviewed: readonly string[], picked: readonly string[], ids: readonly string[], on: boolean): string[] {
  const current = new Set(readReviewedPledges(reviewed, ids));
  for (const id of picked) {
    if (!ids.includes(id)) continue;
    if (on) current.add(id);
    else current.delete(id);
  }
  const next: string[] = [];
  current.forEach((id) => next.push(id));
  return readReviewedPledges(next, ids);
}

export function activePledgeBand(filter: string, present: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (PLEDGE_BANDS as readonly string[]).includes(filter) && present.includes(filter) ? filter : "all";
}

export function activePledgeTone(filter: string): string {
  return filter === "warm" || filter === "cool" || filter === "all" ? filter : "all";
}

export function pledgeBandArg(filter: string): PledgeBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return filter === "dot" || filter === "line" || filter === "page" ? filter : null;
}

export function pledgeToneArg(filter: string): PledgeTone | null {
  if (filter === "all") return null;
  return filter === "warm" || filter === "cool" ? filter : null;
}

export function visiblePledgeCustomers(
  rows: readonly PledgeRow[],
  band: PledgeBand | "blank" | null,
  tone: PledgeTone | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: PledgeShape,
): PledgeRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = pledgeState(row.note);
    const mark = state === "set" ? pledgeBand(row.note) : state === "clear" ? "blank" : "";
    if (!mark) return false;
    if (band === "blank" && mark !== "blank") return false;
    if (band && band !== "blank" && mark !== band) return false;
    if (tone && pledgeTone(row.note) !== tone) return false;
    if (shape === "catalog" && !catalogPledge(row.note)) return false;
    if (shape === "page" && pledgeBand(row.note) !== "page") return false;
    if (shape === "warm" && pledgeTone(row.note) !== "warm") return false;
    if (review === "reviewed" && !seen.has(row.id || "")) return false;
    if (review === "open" && seen.has(row.id || "")) return false;
    if (!text) return true;
    const hay = `${row.label || ""} ${pledgeCopy(row.note)}`.toLowerCase();
    return hay.includes(text);
  });
}

export function pledgesCsv(rows: readonly PledgeRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of pledgeBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`tone,warm,${warmPledgeCount(rows)}`);
  lines.push(`tone,cool,${rows.filter((row) => pledgeTone(row.note) === "cool").length}`);
  lines.push(`catalog,house,${catalogPledgeCount(rows)}`);
  lines.push(`shared,note,${sharedPledgeCount(rows)}`);
  return lines.join("\n");
}

export function pledgeRowsCsv(rows: readonly PledgeRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,note,band,tone,catalog,reviewed"];
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(pledgeCopy(row.note)),
      pledgeBand(row.note) || (pledgeState(row.note) === "clear" ? "blank" : ""),
      pledgeTone(row.note),
      catalogPledge(row.note) ? "1" : "0",
      seen.has(row.id || "") ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
