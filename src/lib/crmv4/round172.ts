/**
 * Local arcade bays for the circuit desk, and the failed-login count already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_arcade_bay (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   guide text not null default '',
 *   bay integer,
 *   pace text not null default '',
 *   wing text not null default '',
 *   lamp text not null default '',
 *   step integer,
 *   rest integer,
 *   pinned boolean not null default false,
 *   walked boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_strike_hide (
 *   band text primary key
 * );
 */

export const BAY_KEY = "crmv4-arcade-bays";
export const BAY_VIEW_KEY = "crmv4-arcade-views";
export const STRIKE_KEY = "crmv4-strike-hide";

export type BayLamp = "blank" | "wick" | "glow" | "flare";

export type BayPace = "blank" | "amble" | "stride" | "dash";

export type BayTray = "open" | "walked" | "filed";

export type BayPick = "blank" | "near" | "mid" | "far" | "end" | "body";

export type Bay = {
  id: string;
  title: string;
  note: string;
  guide: string;
  bay: number | null;
  pace: string;
  wing: string;
  lamp: string;
  step: number | null;
  rest: number | null;
  pinned: boolean;
  walked: boolean;
  filed: boolean;
  audit: string;
};

export type BayView = {
  id: string;
  name: string;
  tray: BayTray;
  query: string;
  guide: string;
  pace: string;
  wing: string;
  lamp: string;
  bay: string;
  step: string;
  rest: string;
};

export type BayCounts = {
  open: number;
  walked: number;
  filed: number;
  pinned: number;
  end: number;
  late: number;
};

export type StrikeState = "" | "set" | "clear";

export type StrikeBand = "" | "quiet" | "spark" | "heat" | "blaze";

export type StrikeDepth = "" | "near" | "mid" | "far";

export type StrikeValue =
  | {
      failedLoginCount?: unknown;
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
      saleStatus?: unknown;
      retentionStatus?: unknown;
      potentialStatus?: unknown;
      documentsStatus?: unknown;
      accountType?: unknown;
      validationStatus?: unknown;
      registrationDate?: unknown;
      birthDate?: unknown;
      lastContactAt?: unknown;
      lastSeenAt?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type StrikeRow = { count?: StrikeValue; label?: string | null };

export type StrikeBandLine = { band: string; count: number };

export type StrikeDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "lamp", "pin", "unpin", "walk", "pause", "file", "reopen", "move"] as const;

const PACES = ["amble", "stride", "dash"] as const;

const LAMPS = ["wick", "glow", "flare"] as const;

const LAMP_ORDER = ["", "wick", "glow", "flare"] as const;

const PICKS = ["blank", "near", "mid", "far", "end", "body"] as const;

const BANDS = ["near", "mid", "far"] as const;

const ENDS = new Set([1, 8]);

const STEPS = [1, 2, 3] as const;

const RESTS = [5, 10, 15, 20] as const;

const STRIKE_BANDS = ["quiet", "spark", "heat", "blaze"] as const;

const DEPTHS = ["near", "mid", "far"] as const;

const STATES = ["set", "clear"] as const;

const STRIKE_BLOCK = [
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
  "lastSeenAt",
] as const;

const BAY_CAP = 9;

const VIEW_CAP = 6;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BayTray {
  return raw === "walked" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function paceName(raw: unknown): Exclude<BayPace, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<BayPace, "blank">) : "";
}

function lampName(raw: unknown): Exclude<BayLamp, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (LAMPS as readonly string[]).includes(text) ? (text as Exclude<BayLamp, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function bayLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function bayNote(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank guide stays blank. It is not filled in. */
export function guideLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank wing stays blank. It is not filled in. */
export function bayWing(raw: unknown): string {
  return clip(raw, 4);
}

/**
 * A bay is an integer from 1 through 8.
 * A blank value stays unset. 0 and 9 are not bays.
 * A leading zero is the same bay: 01 is 1, and 08 is 8.
 */
export function bayOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 8) return raw;
  if (typeof raw === "string" && /^(?:[1-8]|0[1-8])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A step is an integer from 1 through 3.
 * A blank value stays unset. 0 and 4 are not steps.
 * A leading zero is the same step: 01 is 1.
 */
export function stepOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && (STEPS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:[1-3]|0[1-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A rest is 5, 10, 15, or 20 minutes. A blank value stays unset. A leading zero is not a rest. */
export function restOf(raw: unknown): number | null {
  if (typeof raw === "number" && (RESTS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:5|10|15|20)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Amble, stride, dash, or blank. Anything else is blank. */
export function paceOf(raw: unknown): BayPace {
  return paceName(raw) || "blank";
}

/** Wick, glow, flare, or blank. Anything else is blank. */
export function lampOf(raw: unknown): BayLamp {
  return lampName(raw) || "blank";
}

/** Near is 1–3. Mid is 4–6. Far is 7–8. An unset bay is blank. */
export function bayBand(bay: unknown): "blank" | "near" | "mid" | "far" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 3) return "near";
  if (value <= 6) return "mid";
  return "far";
}

/** End bays are 1 and 8. An unset bay is not an end. */
export function endBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && ENDS.has(value);
}

/** Body bays are 2 through 7. An unset bay is not body. */
export function bodyBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && !ENDS.has(value);
}

/**
 * The shortest signed step from the saved bay to the typed bay.
 * The arcade wraps at 8. A step of 4 stays positive. A step of -4 becomes 4.
 * A positive step means the typed bay is ahead of the walk.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 4) diff -= 8;
  if (diff < -3) diff += 8;
  return diff;
}

export function readBays(raw: unknown): Bay[] {
  if (!Array.isArray(raw)) return [];
  const out: Bay[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Bay>;
    const id = String(row.id || "").trim();
    const title = bayLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: bayNote(row.note),
      guide: guideLabel(row.guide),
      bay: bayOf(row.bay),
      pace: paceName(row.pace),
      wing: bayWing(row.wing),
      lamp: lampName(row.lamp),
      step: stepOf(row.step),
      rest: restOf(row.rest),
      pinned: row.pinned === true,
      walked: row.walked === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, BAY_CAP);
}

export function addBay(
  cards: readonly Bay[],
  card: {
    id: string;
    title: string;
    note?: string;
    guide?: string;
    bay?: unknown;
    pace?: string;
    wing?: string;
    lamp?: string;
    step?: unknown;
    rest?: unknown;
  },
): Bay[] {
  const current = readBays(cards);
  const id = String(card.id || "").trim();
  const title = bayLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Bay = {
    id,
    title,
    note: bayNote(card.note),
    guide: guideLabel(card.guide),
    bay: bayOf(card.bay),
    pace: paceName(card.pace),
    wing: bayWing(card.wing),
    lamp: lampName(card.lamp),
    step: stepOf(card.step),
    rest: restOf(card.rest),
    pinned: false,
    walked: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, BAY_CAP);
}

/** Blank becomes wick. Wick becomes glow, glow becomes flare, and flare returns to wick. */
export function cycleLamp(cards: readonly Bay[], id: string): Bay[] {
  return readBays(cards).map((card) => {
    if (card.id !== id) return card;
    const at = LAMP_ORDER.indexOf(card.lamp as (typeof LAMP_ORDER)[number]);
    const next = at < 0 || at >= LAMPS.length ? LAMPS[0] : LAMPS[at % LAMPS.length];
    if (!next || next === card.lamp) return card;
    return { ...card, lamp: next, audit: "lamp" };
  });
}

export function setBayPin(cards: readonly Bay[], id: string, pinned: boolean): Bay[] {
  return readBays(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setBayWalk(cards: readonly Bay[], id: string, walked: boolean): Bay[] {
  return readBays(cards).map((card) => (card.id === id ? { ...card, walked, audit: walked ? "walk" : "pause" } : card));
}

export function setBayFiled(cards: readonly Bay[], id: string, filed: boolean): Bay[] {
  return readBays(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editBay(cards: readonly Bay[], id: string, title: string): Bay[] {
  const current = readBays(cards);
  const next = bayLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editBayNote(cards: readonly Bay[], id: string, note: string): Bay[] {
  const current = readBays(cards);
  const next = bayNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkBayPin(cards: readonly Bay[], ids: readonly string[], pinned: boolean): Bay[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readBays(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkBayFile(cards: readonly Bay[], ids: readonly string[], filed: boolean): Bay[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readBays(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank or unknown pace is left out. A walk already at that pace is left as it is. */
export function bulkBayPace(cards: readonly Bay[], ids: readonly string[], pace: string): Bay[] {
  const name = paceName(pace);
  const current = readBays(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.pace !== name ? { ...card, pace: name, audit: "move" } : card));
}

export function resetBays(): Bay[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function bayCopy(raw: unknown): string {
  return bayLine(raw);
}

function inTray(card: Bay, tray: BayTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "walked") return card.walked && !card.filed;
  return !card.walked && !card.filed;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "end") return endBay(bay);
  if (pick === "body") return bodyBay(bay);
  return bayBand(bay) === pick;
}

function lampScore(lamp: string): number {
  if (lamp === "flare") return 3;
  if (lamp === "glow") return 2;
  if (lamp === "wick") return 1;
  return 0;
}

function waitingEnd(card: Bay): boolean {
  return endBay(card.bay) && inTray(card, "open");
}

function haystack(card: Bay): string {
  return `${card.title}\n${card.note}\n${card.wing}`.toLowerCase();
}

/** An open walk is late when the desk bay is more than two bays ahead. */
export function lateBay(card: Bay, desk: unknown): boolean {
  const gap = bayGap(card.bay, desk);
  return inTray(card, "open") && gap !== null && gap > 2;
}

/** Search matches the title, the note, and the wing. The guide, the bay, and the pace are not part of the query. */
export function visibleBays(
  cards: readonly Bay[],
  tray: BayTray,
  query: string,
  guide: string | null,
  pace: BayPace | null,
  wing: string | null,
  lamp: BayLamp | null,
  exact: number | null,
  pick: BayPick | null,
  step: number | "blank" | null,
  rest: number | "blank" | null,
  flareOnly: boolean,
  endOnly: boolean,
): Bay[] {
  const text = query.trim().toLowerCase();
  const wantGuide = guide === null ? null : guideLabel(guide);
  const wantWing = wing === null ? null : bayWing(wing);
  return readBays(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (flareOnly && card.lamp !== "flare") return false;
      if (wantGuide !== null && guideLabel(card.guide) !== wantGuide) return false;
      if (pace !== null && paceOf(card.pace) !== pace) return false;
      if (wantWing !== null && bayWing(card.wing) !== wantWing) return false;
      if (lamp !== null && lampOf(card.lamp) !== lamp) return false;
      if (!bayHit(card.bay, exact, pick)) return false;
      if (step === "blank" && card.step !== null) return false;
      if (typeof step === "number" && card.step !== step) return false;
      if (rest === "blank" && card.rest !== null) return false;
      if (typeof rest === "number" && card.rest !== rest) return false;
      if (endOnly && !waitingEnd(card)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (lampScore(a.lamp) !== lampScore(b.lamp)) return lampScore(b.lamp) - lampScore(a.lamp);
      return a.title.localeCompare(b.title);
    });
}

/** The bay orders the arcade. An unset bay stays at the end. Search matches the title, the note, and the wing. */
export function bayTimeline(cards: readonly Bay[], query: string): Bay[] {
  const text = query.trim().toLowerCase();
  return readBays(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.bay === null && b.bay !== null) return 1;
      if (a.bay !== null && b.bay === null) return -1;
      if (a.bay !== null && b.bay !== null && a.bay !== b.bay) return a.bay - b.bay;
      return a.title.localeCompare(b.title);
    });
}

export function bayCounts(cards: readonly Bay[], desk: unknown): BayCounts {
  const rows = readBays(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    walked: rows.filter((card) => inTray(card, "walked")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    end: rows.filter((card) => waitingEnd(card)).length,
    late: rows.filter((card) => lateBay(card, desk)).length,
  };
}

/** Share of the saved walks. A zero total stays at zero. */
export function bayShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function bayGuides(cards: readonly Bay[]): string[] {
  const out: string[] = [];
  for (const card of readBays(cards)) {
    if (card.guide && !out.includes(card.guide)) out.push(card.guide);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function bayWings(cards: readonly Bay[]): string[] {
  const out: string[] = [];
  for (const card of readBays(cards)) {
    if (card.wing && !out.includes(card.wing)) out.push(card.wing);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function bayPaces(cards: readonly Bay[]): Exclude<BayPace, "blank">[] {
  const seen = new Set<string>();
  for (const card of readBays(cards)) if (card.pace) seen.add(card.pace);
  return PACES.filter((pace) => seen.has(pace));
}

export function bayLamps(cards: readonly Bay[]): Exclude<BayLamp, "blank">[] {
  const seen = new Set<string>();
  for (const card of readBays(cards)) if (card.lamp) seen.add(card.lamp);
  return LAMPS.filter((lamp) => seen.has(lamp));
}

/** How many open walks a guide still holds. A blank guide is not a load. */
export function guideLoad(cards: readonly Bay[], guide: string): number {
  const name = guideLabel(guide);
  if (!name) return 0;
  return readBays(cards).filter((card) => card.guide === name && inTray(card, "open")).length;
}

/** Three paces. Index 0 is amble. Index 2 is dash. */
export function paceCounts(cards: readonly Bay[]): number[] {
  const rows = readBays(cards);
  return PACES.map((pace) => rows.filter((card) => paceOf(card.pace) === pace).length);
}

/** "all" and "blank" stay. A guide that is no longer on a walk falls back to all. */
export function activeGuide(filter: string, guides: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const guide = guideLabel(filter);
  return guide && guides.includes(guide) ? guide : "all";
}

export function guideArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return guideLabel(filter);
}

/** "all" and "blank" stay. A pace that is no longer on a walk falls back to all. */
export function activePace(filter: string, paces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pace = paceName(filter);
  return pace && paces.includes(pace) ? pace : "all";
}

export function paceArg(filter: string): BayPace | null {
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

/** "all" and "blank" stay. A wing that is no longer on a walk falls back to all. */
export function activeWing(filter: string, wings: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const wing = bayWing(filter);
  return wing && wings.includes(wing) ? wing : "all";
}

export function wingArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return bayWing(filter);
}

/** "all" and "blank" stay. A lamp that is no longer on a walk falls back to all. */
export function activeLamp(filter: string, lamps: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const lamp = lampName(filter);
  return lamp && lamps.includes(lamp) ? lamp : "all";
}

export function lampArg(filter: string): BayLamp | null {
  if (filter === "blank") return "blank";
  return lampName(filter) || null;
}

/** All, blank, the bands, end, body, and the bays 1 through 8 stay. Anything else is all. */
export function activeBay(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const bay = bayOf(filter);
  return bay === null ? "all" : String(bay);
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as BayPick };
  const bay = bayOf(filter);
  return bay === null ? { exact: null, pick: null } : { exact: bay, pick: null };
}

/** All, blank, and the steps 1 through 3 stay. Anything else is all. */
export function activeStep(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const step = stepOf(filter);
  return step === null ? "all" : String(step);
}

export function stepArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return stepOf(filter);
}

/** All, blank, and the rests 5, 10, 15, and 20 stay. Anything else is all. */
export function activeRest(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const rest = restOf(filter);
  return rest === null ? "all" : String(rest);
}

export function restArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return restOf(filter);
}

/** Other walks with the same pace and the same bay. A blank pace or a blank bay clashes with nothing. */
export function bayClashIds(cards: readonly Bay[], id: string): string[] {
  const rows = readBays(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.pace || card.bay === null) return [];
  return rows
    .filter((item) => item.id !== id && item.pace === card.pace && item.bay === card.bay)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved walks share a pace and a bay with another walk. */
export function clashBayCount(cards: readonly Bay[]): number {
  const rows = readBays(cards);
  return rows.filter((card) => bayClashIds(rows, card.id).length > 0).length;
}

/** Other walks with the same pace and the same step. A blank pace or a blank step clashes with nothing. */
export function stepClashIds(cards: readonly Bay[], id: string): string[] {
  const rows = readBays(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.pace || card.step === null) return [];
  return rows
    .filter((item) => item.id !== id && item.pace === card.pace && item.step === card.step)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved walks share a pace and a step with another walk. */
export function stepClashCount(cards: readonly Bay[]): number {
  const rows = readBays(cards);
  return rows.filter((card) => stepClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open walk at or after the bay you type, skipping flare.
 * After 8, the arcade wraps to the earliest open walk that is not flare.
 */
export function nextBay(cards: readonly Bay[], desk: unknown): string {
  const now = bayOf(desk);
  if (now === null) return "";
  const waiting = readBays(cards).filter((card) => inTray(card, "open") && card.bay !== null && card.lamp !== "flare");
  if (!waiting.length) return "";
  const byBay = (a: Bay, b: Bay) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.bay ?? 0) >= now).sort(byBay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBay)[0].id;
}

/**
 * The pace with the fewest open walks.
 * A tie keeps the earlier pace: amble, then stride, then dash.
 * Walks with no pace are not a load. An empty desk still suggests amble.
 */
export function suggestPace(cards: readonly Bay[]): Exclude<BayPace, "blank"> {
  const rows = readBays(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<BayPace, "blank"> = "amble";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const pace of PACES) {
    const count = rows.filter((card) => card.pace === pace).length;
    if (count < bestCount) {
      best = pace;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The guide with the fewest open walks.
 * A tie keeps the earlier name. A blank guide is not a candidate.
 * A desk with no named guide suggests nothing.
 */
export function suggestGuide(cards: readonly Bay[]): string {
  const rows = readBays(cards).filter((card) => inTray(card, "open") && card.guide);
  const guides: string[] = [];
  for (const card of rows) {
    if (!guides.includes(card.guide)) guides.push(card.guide);
  }
  guides.sort((a, b) => a.localeCompare(b));
  if (!guides.length) return "";
  let best = guides[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const guide of guides) {
    const count = rows.filter((card) => card.guide === guide).length;
    if (count < bestCount) {
      best = guide;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the walks saved in this browser. The gap and the late mark use the bay you pass. */
export function baysCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,guide,bay,pace,wing,lamp,step,rest,band,pinned,walked,filed,gap,late,note,audit"];
  for (const card of readBays(raw)) {
    const gap = bayGap(card.bay, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.guide),
      card.bay === null ? "" : String(card.bay),
      card.pace,
      csvCell(card.wing),
      card.lamp,
      card.step === null ? "" : String(card.step),
      card.rest === null ? "" : String(card.rest),
      bayBand(card.bay),
      card.pinned ? "1" : "0",
      card.walked ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBay(card, desk) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function guideSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return guideLabel(raw) || "all";
}

function paceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return paceName(raw) || "all";
}

function wingSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return bayWing(raw) || "all";
}

function lampSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return lampName(raw) || "all";
}

export function readBayViews(raw: unknown): BayView[] {
  if (!Array.isArray(raw)) return [];
  const out: BayView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BayView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      guide: guideSlot(row.guide),
      pace: paceSlot(row.pace),
      wing: wingSlot(row.wing),
      lamp: lampSlot(row.lamp),
      bay: activeBay(String(row.bay ?? "")),
      step: activeStep(String(row.step ?? "")),
      rest: activeRest(String(row.rest ?? "")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBayView(
  views: readonly BayView[],
  view: {
    id: string;
    name: string;
    tray: BayTray;
    query: string;
    guide: string;
    pace: string;
    wing: string;
    lamp: string;
    bay: string;
    step: string;
    rest: string;
  },
): BayView[] {
  const current = readBayViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    guide: guideSlot(view.guide),
    pace: paceSlot(view.pace),
    wing: wingSlot(view.wing),
    lamp: lampSlot(view.lamp),
    bay: activeBay(view.bay),
    step: activeStep(view.step),
    rest: activeRest(view.rest),
  }].slice(0, VIEW_CAP);
}

export function dropBayView(views: readonly BayView[], id: string): BayView[] {
  return readBayViews(views).filter((view) => view.id !== id);
}

function countOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 99) return raw;
  if (typeof raw === "string" && /^(?:[0-9]|[1-9][0-9]|0[0-9])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

function strikeBody(value: StrikeValue): { count: number | null; explicit: boolean } | null {
  if (typeof value === "number") {
    const count = countOf(value);
    return count === null ? { count: null, explicit: false } : { count, explicit: true };
  }
  if (typeof value === "string") {
    const text = clip(value, 8);
    if (!text) return { count: null, explicit: true };
    const count = countOf(text);
    return count === null ? { count: null, explicit: false } : { count, explicit: true };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { count: null, explicit: false };
  if (STRIKE_BLOCK.some((key) => key in value)) return null;
  if (!("failedLoginCount" in value)) return { count: null, explicit: false };
  const inner = value.failedLoginCount;
  if (inner === null) return { count: null, explicit: true };
  if (typeof inner === "number") {
    const count = countOf(inner);
    return count === null ? { count: null, explicit: false } : { count, explicit: true };
  }
  if (typeof inner !== "string") return { count: null, explicit: false };
  const text = clip(inner, 8);
  if (!text) return { count: null, explicit: true };
  const count = countOf(text);
  return count === null ? { count: null, explicit: false } : { count, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set count is an integer from 0 through 99. A clear count is an explicit blank. A missing field stays unmarked.
 * A name, a last-seen time, and the other blocked fields are not a failed-login count.
 */
export function strikeState(value: StrikeValue): StrikeState {
  const body = strikeBody(value);
  if (!body) return "";
  if (body.count !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The integer on a set count. A clear or unmarked value stays unset. */
export function strikeCount(value: StrikeValue): number | null {
  const body = strikeBody(value);
  if (!body || body.count === null) return null;
  return body.count;
}

/**
 * Quiet is 0. Spark is 1 through 3. Heat is 4 through 8. Nine and above is blaze.
 * A blank count has no band.
 */
export function strikeBand(value: StrikeValue): StrikeBand {
  const count = strikeCount(value);
  if (count === null) return "";
  if (count === 0) return "quiet";
  if (count <= 3) return "spark";
  if (count <= 8) return "heat";
  return "blaze";
}

/**
 * Near, mid, or far inside the band.
 * Spark cuts at 1, 2, and 3. Heat cuts at 4–5, 6–7, and 8.
 * Blaze cuts at 9–14, 15–29, and 30 and above. Quiet has no depth.
 */
export function strikeDepth(value: StrikeValue): StrikeDepth {
  const band = strikeBand(value);
  const count = strikeCount(value);
  if (!band || band === "quiet" || count === null) return "";
  if (band === "spark") return count === 1 ? "near" : count === 2 ? "mid" : "far";
  if (band === "heat") return count <= 5 ? "near" : count <= 7 ? "mid" : "far";
  if (count <= 14) return "near";
  if (count <= 29) return "mid";
  return "far";
}

export function strikeBands(rows: readonly StrikeRow[]): StrikeBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = strikeState(row.count);
    if (state === "") continue;
    const band = state === "set" ? strikeBand(row.count) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: StrikeBandLine[] = [];
  for (const band of ["", ...STRIKE_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function strikeDepths(rows: readonly StrikeRow[]): StrikeDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = strikeDepth(row.count);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: StrikeDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps spark, then heat, blaze, and quiet. An unmarked field is not a lead. */
export function leadingStrike(rows: readonly StrikeRow[]): string {
  const named = strikeBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const tie = ["spark", "heat", "blaze", "quiet"];
  const order = (band: string) => tie.indexOf(band);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps near, then mid, then far. A blank count is not a lead. */
export function leadingStrikeDepth(rows: readonly StrikeRow[]): string {
  const named = strikeDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function strikeShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((STRIKE_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentStrikes(rows: readonly StrikeRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = strikeState(row.count);
    const token = state === "set" ? strikeBand(row.count) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenStrikes(raw: unknown, present: readonly string[]): string[] {
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

export function toggleStrike(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandToken(band);
  if (!token || !present.includes(token)) return readHiddenStrikes(hidden, present);
  const current = readHiddenStrikes(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleStrikeBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenStrikes(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeStrike(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (STRIKE_BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function strikeArg(filter: string): StrikeBand | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (STRIKE_BANDS as readonly string[]).includes(filter) ? (filter as StrikeBand) : null;
}

/** "all" and "blank" stay. A depth that is no longer loaded falls back to all. */
export function activeStrikeDepth(filter: string, depths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (DEPTHS as readonly string[]).includes(filter) && depths.includes(filter) ? filter : "all";
}

export function strikeDepthArg(filter: string): StrikeDepth | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (DEPTHS as readonly string[]).includes(filter) ? (filter as StrikeDepth) : null;
}

/** Search stays on the name. The band and the depth are not part of the query. */
export function visibleStrikeCustomers<T extends StrikeRow>(
  rows: readonly T[],
  band: StrikeBand | "blank" | null,
  depth: StrikeDepth | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = strikeState(row.count);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && strikeBand(row.count) !== band) return false;
    if (depth !== null && strikeDepth(row.count) !== depth) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function strikesCsv(rows: readonly StrikeRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = strikeState(row.count);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of strikeBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of strikeDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  return lines.join("\n");
}

export const ARCADE_PACES = PACES;
export const ARCADE_BANDS = BANDS;
