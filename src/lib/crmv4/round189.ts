/**
 * Gallery hooks for the document desk, and the language already on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_gallery_hook (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   reviewer text not null default '',
 *   bay integer,
 *   cloth text not null default '',
 *   seal text not null default '',
 *   tempo text not null default '',
 *   grade integer,
 *   pause integer,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   done boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_language_lane_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_language_lane_review (
 *   customer_id text primary key
 * );
 */

export const HOOK_KEY = "crmv4-gallery-hooks";
export const HOOK_VIEW_KEY = "crmv4-gallery-hook-views";
export const LANE_KEY = "crmv4-language-lane-hide";
export const LANE_REVIEW_KEY = "crmv4-language-lane-review";

export type HookCloth = "blank" | "ivory" | "graphite" | "champagne" | "ink";

export type HookTempo = "blank" | "calm" | "steady" | "swift";

export type HookTray = "open" | "held" | "done";

export type BayPick = "blank" | "first" | "mid" | "last" | "peak" | "quiet";

export type Hook = {
  id: string;
  title: string;
  note: string;
  reviewer: string;
  bay: number | null;
  cloth: string;
  seal: string;
  tempo: string;
  grade: number | null;
  pause: number | null;
  pinned: boolean;
  held: boolean;
  done: boolean;
  audit: string;
};

export type HookView = {
  id: string;
  name: string;
  tray: HookTray;
  query: string;
  reviewer: string;
  cloth: string;
  seal: string;
  tempo: string;
  bay: string;
  grade: string;
  pause: string;
};

export type HookCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type LaneState = "" | "set" | "clear";

export type LaneBand = "" | "root" | "slip" | "card" | "roll";

export type LaneParity = "" | "even" | "odd";

export type LaneShape = "all" | "catalog" | "wide" | "even";

export type LaneValue =
  | { language?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type LaneRow = { id?: string; note?: LaneValue; label?: string | null };

export type LaneBandLine = { band: string; count: number };

export type LaneParityLine = { parity: string; count: number };

const AUDITS = ["save", "edit", "tempo", "pin", "unpin", "hold", "lift", "done", "reopen", "cloth"] as const;

const CLOTHS = ["ivory", "graphite", "champagne", "ink"] as const;

const TEMPOS = ["calm", "steady", "swift"] as const;

const TEMPO_ORDER = ["", "calm", "steady", "swift"] as const;

const BAY_PICKS = ["blank", "first", "mid", "last", "peak", "quiet"] as const;

const PEAK_BAYS = new Set([3, 9]);

const QUIET_BAYS = new Set([6, 12]);

const GRADES = [1, 2, 3] as const;

const PAUSES = [2, 5, 10] as const;

const HOME = new Set(["TR1", "DE2", "AE3"]);

const LANE_BANDS = ["root", "slip", "card", "roll"] as const;

const PARITIES = ["even", "odd"] as const;

const CATALOG = new Set(["en", "tr", "de", "ru", "ar"]);

const LANE_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const HOOK_CAP = 8;

const VIEW_CAP = 6;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): HookTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<HookCloth, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<HookCloth, "blank">) : "";
}

function tempoName(raw: unknown): Exclude<HookTempo, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TEMPOS as readonly string[]).includes(text) ? (text as Exclude<HookTempo, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function hookLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function hookNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank reviewer stays blank. It is not filled in. */
export function reviewerLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A seal is two letters and one digit. Anything else stays blank. Letters are stored in capitals. */
export function hookSeal(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}[0-9]$/.test(text) ? text : "";
}

/**
 * A bay is an integer from 1 through 12.
 * A blank value stays unset. 0 and 13 are not bays.
 * A leading zero is not a bay.
 */
export function bayOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 12) return raw;
  if (typeof raw === "string" && /^(?:[1-9]|1[0-2])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A grade is 1, 2, or 3.
 * A blank value stays unset. 0 and 4 are not grades.
 * A leading zero is not a grade.
 */
export function gradeOf(raw: unknown): number | null {
  if (typeof raw === "number" && (GRADES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:1|2|3)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A pause is 2, 5, or 10 days. A blank value stays unset. A leading zero is not a pause. */
export function pauseDays(raw: unknown): number | null {
  if (typeof raw === "number" && (PAUSES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:2|5|10)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Ivory, graphite, champagne, ink, or blank. Anything else is blank. */
export function clothOf(raw: unknown): HookCloth {
  return clothName(raw) || "blank";
}

/** Calm, steady, swift, or blank. Anything else is blank. */
export function tempoOf(raw: unknown): HookTempo {
  return tempoName(raw) || "blank";
}

/** First is 1–4. Mid is 5–8. Last is 9–12. An unset bay is blank. */
export function bayBand(bay: unknown): "blank" | "first" | "mid" | "last" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 4) return "first";
  if (value <= 8) return "mid";
  return "last";
}

/** Peak bays are 3 and 9. An unset bay is not a peak. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAK_BAYS.has(value);
}

/** Quiet bays are 6 and 12. 3 and 9 are not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * The shortest signed step from the saved bay to the typed bay.
 * The ring wraps at 12. A step of 6 stays. A step of -6 stays.
 * A positive step means the typed bay is ahead of the hook.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return diff;
}

/** TR1, DE2, and AE3 are home seals. A blank seal is not. */
export function homeSeal(seal: unknown): boolean {
  return HOME.has(hookSeal(seal));
}

export function readHooks(raw: unknown): Hook[] {
  if (!Array.isArray(raw)) return [];
  const out: Hook[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Hook>;
    const id = String(row.id || "").trim();
    const title = hookLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: hookNote(row.note),
      reviewer: reviewerLabel(row.reviewer),
      bay: bayOf(row.bay),
      cloth: clothName(row.cloth),
      seal: hookSeal(row.seal),
      tempo: tempoName(row.tempo),
      grade: gradeOf(row.grade),
      pause: pauseDays(row.pause),
      pinned: row.pinned === true,
      held: row.held === true,
      done: row.done === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, HOOK_CAP);
}

export function addHook(
  cards: readonly Hook[],
  card: {
    id: string;
    title: string;
    note?: string;
    reviewer?: string;
    bay?: unknown;
    cloth?: string;
    seal?: string;
    tempo?: string;
    grade?: unknown;
    pause?: unknown;
  },
): Hook[] {
  const current = readHooks(cards);
  const id = String(card.id || "").trim();
  const title = hookLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Hook = {
    id,
    title,
    note: hookNote(card.note),
    reviewer: reviewerLabel(card.reviewer),
    bay: bayOf(card.bay),
    cloth: clothName(card.cloth),
    seal: hookSeal(card.seal),
    tempo: tempoName(card.tempo),
    grade: gradeOf(card.grade),
    pause: pauseDays(card.pause),
    pinned: false,
    held: false,
    done: false,
    audit: "save",
  };
  return [next, ...current].slice(0, HOOK_CAP);
}

/** Blank becomes calm. Calm becomes steady, steady becomes swift, and swift returns to calm. */
export function cycleTempo(cards: readonly Hook[], id: string): Hook[] {
  return readHooks(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TEMPO_ORDER.indexOf(card.tempo as (typeof TEMPO_ORDER)[number]);
    const next = at < 0 || at >= TEMPOS.length ? TEMPOS[0] : TEMPOS[at % TEMPOS.length];
    if (!next || next === card.tempo) return card;
    return { ...card, tempo: next, audit: "tempo" };
  });
}

export function setHookPin(cards: readonly Hook[], id: string, pinned: boolean): Hook[] {
  return readHooks(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setHookHold(cards: readonly Hook[], id: string, held: boolean): Hook[] {
  return readHooks(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "lift" } : card));
}

export function setHookDone(cards: readonly Hook[], id: string, done: boolean): Hook[] {
  return readHooks(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editHook(cards: readonly Hook[], id: string, title: string): Hook[] {
  const current = readHooks(cards);
  const next = hookLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editHookNote(cards: readonly Hook[], id: string, note: string): Hook[] {
  const current = readHooks(cards);
  const next = hookNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkHookPin(cards: readonly Hook[], ids: readonly string[], pinned: boolean): Hook[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readHooks(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkHookCloth(cards: readonly Hook[], ids: readonly string[], cloth: unknown): Hook[] {
  const next = clothName(cloth);
  if (!next) return readHooks(cards);
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readHooks(cards).map((card) => (want.has(card.id) ? { ...card, cloth: next, audit: "cloth" } : card));
}

export function bulkHookDone(cards: readonly Hook[], ids: readonly string[], done: boolean): Hook[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readHooks(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

export function resetHooks(): Hook[] {
  return [];
}

function inTray(card: Hook, tray: HookTray): boolean {
  if (tray === "done") return card.done;
  if (tray === "held") return card.held && !card.done;
  return !card.held && !card.done;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

function tempoScore(tempo: string): number {
  if (tempo === "swift") return 3;
  if (tempo === "steady") return 2;
  if (tempo === "calm") return 1;
  return 0;
}

/** An open hook whose bay sits more than three steps behind the desk bay. A held or done hook is not late. */
export function lateHook(card: Hook, desk: unknown): boolean {
  const gap = bayGap(card.bay, desk);
  return inTray(card, "open") && gap !== null && gap > 3;
}

/** An open hook with a 2 day pause is the reminder. A held or done hook is not. */
export function soonHook(card: Hook): boolean {
  return inTray(card, "open") && card.pause === 2;
}

/** Search matches the title, the note, and the reviewer. The bay and the cloth are not part of the query. */
export function visibleHooks(
  cards: readonly Hook[],
  tray: HookTray,
  query: string,
  reviewer: string | null,
  cloth: HookCloth | null,
  seal: string | null,
  tempo: HookTempo | null,
  exact: number | null,
  pick: BayPick | null,
  grade: number | "blank" | null,
  pause: number | "blank" | null,
  calmOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): Hook[] {
  const text = query.trim().toLowerCase();
  const wantReviewer = reviewer === null ? null : reviewerLabel(reviewer);
  const wantSeal = seal === null ? null : hookSeal(seal);
  return readHooks(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (wantReviewer !== null && card.reviewer !== wantReviewer) return false;
      if (cloth !== null && clothOf(card.cloth) !== cloth) return false;
      if (wantSeal !== null && card.seal !== wantSeal) return false;
      if (tempo !== null && tempoOf(card.tempo) !== tempo) return false;
      if (!bayHit(card.bay, exact, pick)) return false;
      if (grade === "blank" && card.grade !== null) return false;
      if (typeof grade === "number" && card.grade !== grade) return false;
      if (pause === "blank" && card.pause !== null) return false;
      if (typeof pause === "number" && card.pause !== pause) return false;
      if (calmOnly && card.tempo !== "calm") return false;
      if (peakOnly && !peakBay(card.bay)) return false;
      if (homeOnly && !homeSeal(card.seal)) return false;
      if (!text) return true;
      return card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.reviewer.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (tempoScore(a.tempo) !== tempoScore(b.tempo)) return tempoScore(b.tempo) - tempoScore(a.tempo);
      return a.title.localeCompare(b.title);
    });
}

export function hookTimeline(cards: readonly Hook[], query: string): Hook[] {
  const text = query.trim().toLowerCase();
  return readHooks(cards)
    .filter((card) => card.bay !== null)
    .filter((card) => !text || card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.reviewer.toLowerCase().includes(text))
    .sort((a, b) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title));
}

export function hookCounts(cards: readonly Hook[], desk: unknown): HookCounts {
  const rows = readHooks(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => peakBay(card.bay) && inTray(card, "open")).length,
    late: rows.filter((card) => lateHook(card, desk)).length,
    soon: rows.filter((card) => soonHook(card)).length,
    home: rows.filter((card) => homeSeal(card.seal)).length,
  };
}

export function hookShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function hookReviewers(cards: readonly Hook[]): string[] {
  const seen = new Set<string>();
  for (const card of readHooks(cards)) if (card.reviewer) seen.add(card.reviewer);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function hookSeals(cards: readonly Hook[]): string[] {
  const seen = new Set<string>();
  for (const card of readHooks(cards)) if (card.seal) seen.add(card.seal);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function hookTempos(cards: readonly Hook[]): Exclude<HookTempo, "blank">[] {
  const seen = new Set<string>();
  for (const card of readHooks(cards)) if (card.tempo) seen.add(card.tempo);
  return TEMPOS.filter((tempo) => seen.has(tempo));
}

export function clothCounts(cards: readonly Hook[]): { cloth: Exclude<HookCloth, "blank">; count: number }[] {
  const rows = readHooks(cards);
  return CLOTHS.map((cloth) => ({ cloth, count: rows.filter((card) => card.cloth === cloth).length })).filter((row) => row.count > 0);
}

export function usedBays(cards: readonly Hook[]): number {
  return new Set(readHooks(cards).map((card) => card.bay).filter((bay): bay is number => bay !== null)).size;
}

export function clashBayIds(cards: readonly Hook[]): string[] {
  const open = readHooks(cards).filter((card) => inTray(card, "open") && card.bay !== null && card.cloth);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.cloth === card.cloth && other.bay === card.bay)).map((card) => card.id);
}

export function clashBayCount(cards: readonly Hook[]): number {
  return clashBayIds(cards).length;
}

export function gradeClashIds(cards: readonly Hook[]): string[] {
  const open = readHooks(cards).filter((card) => inTray(card, "open") && card.grade !== null && card.cloth);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.cloth === card.cloth && other.grade === card.grade)).map((card) => card.id);
}

export function gradeClashCount(cards: readonly Hook[]): number {
  return gradeClashIds(cards).length;
}

/** The next open hook at or after the desk bay. Swift tempos wait. A blank desk bay stays blank. */
export function nextHook(cards: readonly Hook[], desk: unknown): string {
  const now = bayOf(desk);
  if (now === null) return "";
  const waiting = readHooks(cards).filter((card) => inTray(card, "open") && card.bay !== null && card.tempo !== "swift");
  if (!waiting.length) return "";
  const byBay = (a: Hook, b: Hook) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.bay ?? 0) >= now).sort(byBay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBay)[0].id;
}

/**
 * The cloth with the fewest open hooks.
 * A tie keeps champagne, then ivory, then graphite, then ink.
 * Hooks with no cloth are not a load. An empty desk still suggests champagne.
 */
export function suggestCloth(cards: readonly Hook[]): Exclude<HookCloth, "blank"> {
  const rows = readHooks(cards).filter((card) => inTray(card, "open"));
  const order = ["champagne", "ivory", "graphite", "ink"] as const;
  let best: Exclude<HookCloth, "blank"> = "champagne";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cloth of order) {
    const count = rows.filter((card) => card.cloth === cloth).length;
    if (count < bestCount) {
      best = cloth;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The reviewer carrying the fewest open hooks.
 * A tie keeps the earlier name. A blank reviewer is not a load.
 * An empty desk stays blank.
 */
export function suggestReviewer(cards: readonly Hook[]): string {
  const rows = readHooks(cards).filter((card) => inTray(card, "open") && card.reviewer);
  let best = "";
  let bestCount = Number.POSITIVE_INFINITY;
  const names = Array.from(new Set(rows.map((card) => card.reviewer))).sort((a, b) => a.localeCompare(b));
  for (const reviewer of names) {
    const count = rows.filter((card) => card.reviewer === reviewer).length;
    if (count < bestCount) {
      best = reviewer;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The pause with the fewest open hooks.
 * A tie keeps 5, then 2, then 10.
 * An empty desk still suggests 5.
 */
export function suggestPause(cards: readonly Hook[]): (typeof PAUSES)[number] {
  const rows = readHooks(cards).filter((card) => inTray(card, "open"));
  const order = [5, 2, 10] as const;
  let best: (typeof PAUSES)[number] = 5;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const pause of order) {
    const count = rows.filter((card) => card.pause === pause).length;
    if (count < bestCount) {
      best = pause;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The roster name with the fewest open hooks.
 * A blank roster falls back to the least-loaded reviewer already on the desk.
 * A tie keeps the earlier name.
 */
export function fairReviewer(cards: readonly Hook[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = reviewerLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestReviewer(cards);
  const open = readHooks(cards).filter((card) => inTray(card, "open"));
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  let best = sorted[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of sorted) {
    const count = open.filter((card) => card.reviewer === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the hooks saved in this browser. The gap and the late mark use the bay you pass. */
export function hooksCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,reviewer,bay,cloth,seal,tempo,grade,pause,band,pinned,held,done,gap,late,soon,home,note,audit"];
  for (const card of readHooks(raw)) {
    const gap = bayGap(card.bay, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.reviewer),
      card.bay === null ? "" : String(card.bay),
      card.cloth,
      csvCell(card.seal),
      card.tempo,
      card.grade === null ? "" : String(card.grade),
      card.pause === null ? "" : String(card.pause),
      bayBand(card.bay),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.done ? "1" : "0",
      gap === null ? "" : String(gap),
      lateHook(card, desk) ? "1" : "0",
      soonHook(card) ? "1" : "0",
      homeSeal(card.seal) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

export function hookCopy(card: Hook): string {
  return [card.title, card.reviewer, card.bay ?? "", card.cloth, card.seal, card.tempo, card.grade ?? "", card.pause ?? "", card.note].filter((part) => part !== "").join(" · ");
}

function reviewerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return reviewerLabel(raw) || "all";
}

function clothSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return clothName(raw) || "all";
}

function sealSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return hookSeal(raw) || "all";
}

function tempoSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tempoName(raw) || "all";
}

/** "all" and a bay pick stay. A bay from 1 through 12 stays. Anything else is all. */
export function activeBay(filter: string): string {
  if (filter === "all") return "all";
  if ((BAY_PICKS as readonly string[]).includes(filter)) return filter;
  const bay = bayOf(filter);
  return bay === null ? "all" : String(bay);
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } {
  if ((BAY_PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as BayPick };
  const bay = bayOf(filter);
  return bay === null ? { exact: null, pick: null } : { exact: bay, pick: null };
}

/** All, blank, and the grades 1, 2, and 3 stay. Anything else is all. */
export function activeGrade(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const grade = gradeOf(filter);
  return grade === null ? "all" : String(grade);
}

export function gradeArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return gradeOf(filter);
}

/** All, blank, and the pauses 2, 5, and 10 stay. Anything else is all. */
export function activePause(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const pause = pauseDays(filter);
  return pause === null ? "all" : String(pause);
}

export function pauseArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return pauseDays(filter);
}

export function activeReviewer(filter: string, reviewers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const reviewer = reviewerLabel(filter);
  return reviewer && reviewers.includes(reviewer) ? reviewer : "all";
}

export function reviewerArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return reviewerLabel(filter) || null;
}

export function activeCloth(filter: string, cloths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cloth = clothName(filter);
  return cloth && cloths.includes(cloth) ? cloth : "all";
}

export function clothArg(filter: string): HookCloth | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return clothName(filter) || null;
}

export function activeSeal(filter: string, seals: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const seal = hookSeal(filter);
  return seal && seals.includes(seal) ? seal : "all";
}

export function sealArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return hookSeal(filter) || null;
}

export function activeTempo(filter: string, tempos: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tempo = tempoName(filter);
  return tempo && tempos.includes(tempo) ? tempo : "all";
}

export function tempoArg(filter: string): HookTempo | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return tempoName(filter) || null;
}

export function readHookViews(raw: unknown): HookView[] {
  if (!Array.isArray(raw)) return [];
  const out: HookView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<HookView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      reviewer: reviewerSlot(row.reviewer),
      cloth: clothSlot(row.cloth),
      seal: sealSlot(row.seal),
      tempo: tempoSlot(row.tempo),
      bay: activeBay(String(row.bay || "all")),
      grade: activeGrade(String(row.grade || "all")),
      pause: activePause(String(row.pause || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addHookView(views: readonly HookView[], view: HookView): HookView[] {
  const current = readHookViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    reviewer: reviewerSlot(view.reviewer),
    cloth: clothSlot(view.cloth),
    seal: sealSlot(view.seal),
    tempo: tempoSlot(view.tempo),
    bay: activeBay(view.bay),
    grade: activeGrade(view.grade),
    pause: activePause(view.pause),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropHookView(views: readonly HookView[], id: string): HookView[] {
  return readHookViews(views).filter((view) => view.id !== id);
}

/**
 * A language lane is a short code.
 * It is two letters, or two letters, a hyphen, and a region of two to four letters.
 * Lengths that stay are 2, 5, 6, and 7. A blank value stays unset.
 */
export function tongueToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim().toLowerCase();
  if (!/^[a-z]{2}(?:-[a-z]{2,4})?$/.test(text)) return null;
  const size = text.length;
  if (size !== 2 && size !== 5 && size !== 6 && size !== 7) return null;
  return text;
}

function tongueBody(value: LaneValue): { text: string | null; explicit: boolean } | null {
  if (typeof value === "number") return { text: null, explicit: false };
  if (typeof value === "string") {
    if (value.trim() === "") return { text: null, explicit: true };
    const text = tongueToken(value);
    return { text, explicit: text !== null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (LANE_BLOCK.some((key) => key in value)) return null;
  if (!("language" in value)) return { text: null, explicit: false };
  const inner = value.language;
  if (inner === null || inner === "") return { text: null, explicit: true };
  const text = tongueToken(inner);
  if (text === null) return { text: null, explicit: false };
  return { text, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set lane is a language code. A clear lane is an explicit blank.
 * A missing field stays unmarked. A blocked field is not this lane.
 */
export function tongueState(value: LaneValue): LaneState {
  const body = tongueBody(value);
  if (!body) return "";
  if (body.text !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The language code, or a blank string when the lane is clear or unmarked. */
export function tongueCopy(value: LaneValue): string {
  return tongueBody(value)?.text || "";
}

/**
 * Root is 2. Slip is 5. Card is 6. Roll is 7.
 * A blank code has no band.
 */
export function tongueBand(value: LaneValue): LaneBand {
  const text = tongueBody(value)?.text;
  if (!text) return "";
  const n = text.length;
  if (n === 2) return "root";
  if (n === 5) return "slip";
  if (n === 6) return "card";
  return "roll";
}

/** Even or odd length. A blank code has no parity. */
export function tongueParity(value: LaneValue): LaneParity {
  const text = tongueBody(value)?.text;
  if (!text) return "";
  return text.length % 2 === 0 ? "even" : "odd";
}

/** en, tr, de, ru, and ar are the house catalog. A regional code is not catalog. */
export function catalogTongue(value: LaneValue): boolean {
  const text = tongueBody(value)?.text;
  if (!text) return false;
  return CATALOG.has(text);
}

/** A code of 6 or 7. A clear code is not wide. */
export function wideTongue(value: LaneValue): boolean {
  const band = tongueBand(value);
  return band === "card" || band === "roll";
}

/** An even length. A clear code is not even. */
export function evenTongue(value: LaneValue): boolean {
  return tongueParity(value) === "even";
}

export function catalogTongueCount(rows: readonly LaneRow[]): number {
  return rows.filter((row) => tongueState(row.note) === "set" && catalogTongue(row.note)).length;
}

export function wideTongueCount(rows: readonly LaneRow[]): number {
  return rows.filter((row) => tongueState(row.note) === "set" && wideTongue(row.note)).length;
}

export function evenTongueCount(rows: readonly LaneRow[]): number {
  return rows.filter((row) => tongueState(row.note) === "set" && evenTongue(row.note)).length;
}

/** How many distinct language codes are shared by two or more customers. */
export function sharedTongueCount(rows: readonly LaneRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (tongueState(row.note) !== "set") continue;
    const text = tongueCopy(row.note);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function tongueBands(rows: readonly LaneRow[]): LaneBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = tongueState(row.note);
    if (state === "") continue;
    const band = state === "set" ? tongueBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: LaneBandLine[] = [];
  for (const band of ["", ...LANE_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function tongueParities(rows: readonly LaneRow[]): LaneParityLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const parity = tongueParity(row.note);
    map.set(parity, (map.get(parity) || 0) + 1);
  }
  const out: LaneParityLine[] = [];
  for (const parity of ["", ...PARITIES]) {
    const count = map.get(parity);
    if (count) out.push({ parity, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps root, then slip, card, and roll. An unmarked field is not a lead. */
export function leadingTongue(rows: readonly LaneRow[]): string {
  const named = tongueBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => LANE_BANDS.indexOf(band as (typeof LANE_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The parity with the most loaded rows. A tie keeps even, then odd. A blank code is not a lead. */
export function leadingTongueParity(rows: readonly LaneRow[]): string {
  const named = tongueParities(rows).filter((line) => line.parity);
  if (!named.length) return "";
  const order = (parity: string) => PARITIES.indexOf(parity as (typeof PARITIES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.parity) - order(b.parity))[0].parity;
}

export function tongueShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((LANE_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentTongues(rows: readonly LaneRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = tongueState(row.note);
    const token = state === "set" ? tongueBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenTongues(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandOwner(item);
    if (!band || !known.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleTongue(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandOwner(band);
  if (!token || !present.includes(token)) return readHiddenTongues(hidden, present);
  const current = readHiddenTongues(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleTongueBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenTongues(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

export function tongueBandArg(filter: string): LaneBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandOwner(filter);
  return band && band !== "blank" ? (band as LaneBand) : null;
}

export function activeTongueBand(filter: string, present: readonly string[]): string {
  if (filter === "all") return "all";
  const band = filter === "blank" ? "blank" : bandOwner(filter);
  return band && present.includes(band) ? band : "all";
}

function parityOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (PARITIES as readonly string[]).includes(text) ? text : "";
}

export function tongueParityArg(filter: string): LaneParity | null {
  if (filter === "all") return null;
  const parity = parityOwner(filter);
  return parity ? (parity as LaneParity) : null;
}

export function activeTongueParity(filter: string): string {
  if (filter === "all") return "all";
  return parityOwner(filter) || "all";
}

function rowId(row: LaneRow): string {
  return String(row.id || "").trim();
}

export function readReviewedTongues(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present.map((id) => String(id || "").trim()).filter(Boolean));
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (!id || !known.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out.slice(0, 32);
}

export function toggleTongueReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedTongues(reviewed, present);
  const current = readReviewedTongues(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkTongueReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedTongues(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the parity, and the code are not part of the query. */
export function visibleTongueCustomers<T extends LaneRow>(
  rows: readonly T[],
  band: LaneBand | "blank" | null,
  parity: LaneParity | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: LaneShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = tongueState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && tongueBand(row.note) !== band) return false;
    if (parity !== null && tongueParity(row.note) !== parity) return false;
    if (shape === "catalog" && !catalogTongue(row.note)) return false;
    if (shape === "wide" && (state !== "set" || !wideTongue(row.note))) return false;
    if (shape === "even" && !evenTongue(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and parities on this page. */
export function tonguesCsv(rows: readonly LaneRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = tongueState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", "set", "clear"]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of tongueBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of tongueParities(rows)) lines.push(["parity", csvCell(line.parity), String(line.count)].join(","));
  lines.push(["shape", "catalog", String(catalogTongueCount(rows))].join(","));
  lines.push(["shape", "wide", String(wideTongueCount(rows))].join(","));
  lines.push(["shape", "even", String(evenTongueCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedTongueCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function tongueRowsCsv(rows: readonly LaneRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,parity,tongue,catalog,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(tongueBand(row.note)),
      csvCell(tongueParity(row.note)),
      csvCell(tongueCopy(row.note)),
      catalogTongue(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
