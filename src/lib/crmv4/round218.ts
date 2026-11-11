/**
 * Fountain pens for the goals gallery, and mail crests already stored as email on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_fountain_pen (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   scribe text not null default '',
 *   nib integer,
 *   ink text not null default '',
 *   flow text not null default '',
 *   drops integer,
 *   weight integer not null default 0,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_mail_crest_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_mail_crest_review (
 *   customer_id text primary key
 * );
 */

export const FPN_KEY = "crmv4-fountain-pen";
export const FPN_VIEW_KEY = "crmv4-fountain-views";
export const FPN_DENSITY_KEY = "crmv4-fountain-density";
export const MCR_KEY = "crmv4-mail-crest-hide";
export const MCR_REVIEW_KEY = "crmv4-mail-crest-review";

export type InkName = "blank" | "graphite" | "ivory" | "champagne";

export type FlowName = "blank" | "dry" | "wet" | "flood";

export type PenTray = "open" | "held" | "archived";

export type NibPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type PenDensity = "airy" | "tight";

export type PenSort = "nib" | "scribe";

export type FountainPen = {
  id: string;
  title: string;
  note: string;
  scribe: string;
  nib: number | null;
  ink: string;
  flow: string;
  drops: number | null;
  weight: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  audit: string;
};

export type PenView = {
  id: string;
  name: string;
  tray: PenTray;
  query: string;
  scribe: string;
  ink: string;
  flow: string;
  nib: string;
  drops: string;
  weight: string;
};

export type PenCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  weight: number;
  house: number;
  window: number;
  matched: number;
};

const AUDITS = ["save", "edit", "flow", "pin", "unpin", "hold", "resume", "archive", "open", "ink", "tag", "weight", "drops"] as const;

const INKS = ["graphite", "ivory", "champagne"] as const;

const FLOWS = ["dry", "wet", "flood"] as const;

const FLOW_CYCLE = ["dry", "wet", "flood"] as const;

const PEAK_NIBS = new Set([2, 5]);

const QUIET_NIBS = new Set([9]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const PEN_CAP = 12;

const VIEW_CAP = 6;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): PenTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<InkName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<InkName, "blank">) : "";
}

function flowName(raw: unknown): Exclude<FlowName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (FLOWS as readonly string[]).includes(text) ? (text as Exclude<FlowName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function penLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function penNote(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank scribe stays blank. It is not filled in. */
export function scribeLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** An ink is GRAPHITE, IVORY, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
export function inkOf(raw: unknown): string {
  const name = inkName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A nib is an integer from 1 through 9.
 * A blank value stays unset. 0 is not a nib.
 * A second digit is not a nib.
 */
export function nibOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 9) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-9]$/.test(text)) return null;
  return Number(text);
}

/** Drops are 3, 6, or 9. A blank value stays unset. A leading zero is not a drop count. */
export function dropsOf(raw: unknown): 3 | 6 | 9 | null {
  if (raw === 3 || raw === "3") return 3;
  if (raw === 6 || raw === "6") return 6;
  if (raw === 9 || raw === "9") return 9;
  const text = clip(raw, 1);
  if (text === "3") return 3;
  if (text === "6") return 6;
  if (text === "9") return 9;
  return null;
}

/** Weight is 0, 3, or 6. Anything else is not a weight. 0 clears the weight. */
export function weightOf(raw: unknown): 0 | 3 | 6 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 6 || raw === "6") return 6;
  return null;
}

export function nibBand(nib: unknown): "blank" | "early" | "mid" | "late" {
  const value = nibOf(nib);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 6) return "mid";
  return "late";
}

/** Peak nibs are 2 and 5. An unset nib is not a peak nib. */
export function peakNib(nib: unknown): boolean {
  const value = nibOf(nib);
  return value !== null && PEAK_NIBS.has(value);
}

/** The quiet nib is 9. A peak nib is not quiet. An unset nib is not quiet. */
export function quietNib(nib: unknown): boolean {
  const value = nibOf(nib);
  return value !== null && QUIET_NIBS.has(value);
}

/**
 * How far a nib sits behind the desk nib.
 * A positive gap means the pen is behind. A negative gap means it is ahead.
 * A gap of zero means the same nib. An unset nib has no gap. Nibs do not wrap.
 */
export function nibGap(nib: unknown, desk: unknown): number | null {
  const from = nibOf(nib);
  const at = nibOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** IVORY and CHAMPAGNE are house inks. GRAPHITE is a guest ink. A blank ink is not a house ink. */
export function houseInk(ink: unknown): boolean {
  return HOUSE.has(inkOf(ink));
}

/** Airy or tight. Anything else stays airy. */
export function densityOf(raw: unknown): PenDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** Nib or scribe. Anything else stays on the nib. */
export function sortMode(raw: unknown): PenSort {
  return raw === "scribe" ? "scribe" : "nib";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[a-d]$/.test(text) ? text : "";
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

function readOne(raw: unknown): FountainPen | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<FountainPen>;
  const id = clip(row.id, 24);
  const title = penLine(row.title);
  if (!id || !title) return null;
  const weight = weightOf(row.weight);
  return {
    id,
    title,
    note: penNote(row.note),
    scribe: scribeLabel(row.scribe),
    nib: nibOf(row.nib),
    ink: inkOf(row.ink),
    flow: flowName(row.flow),
    drops: dropsOf(row.drops),
    weight: weight === null ? 0 : weight,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    audit: auditCode(row.audit),
  };
}

export function readPens(raw: unknown): FountainPen[] {
  if (!Array.isArray(raw)) return [];
  const out: FountainPen[] = [];
  for (const item of raw) {
    const pen = readOne(item);
    if (!pen || out.some((row) => row.id === pen.id || row.title === pen.title)) continue;
    out.push(pen);
  }
  return out.slice(0, PEN_CAP);
}

export function addPen(
  pens: readonly FountainPen[],
  pen: {
    id: string;
    title: string;
    note?: string;
    scribe?: string;
    nib?: unknown;
    ink?: string;
    flow?: string;
    drops?: unknown;
    weight?: unknown;
    tags?: unknown;
  },
): FountainPen[] {
  const current = readPens(pens);
  const id = String(pen.id || "").trim();
  const title = penLine(pen.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const weight = weightOf(pen.weight);
  const next: FountainPen = {
    id,
    title,
    note: penNote(pen.note),
    scribe: scribeLabel(pen.scribe),
    nib: nibOf(pen.nib),
    ink: inkOf(pen.ink),
    flow: flowName(pen.flow),
    drops: dropsOf(pen.drops),
    weight: weight === null ? 0 : weight,
    tags: tagsOf(pen.tags),
    pinned: false,
    held: false,
    archived: false,
    audit: "save",
  };
  return [next, ...current].slice(0, PEN_CAP);
}

/** A blank flow becomes dry, dry becomes wet, wet becomes flood, and flood returns to dry. */
export function cycleFlow(pens: readonly FountainPen[], id: string): FountainPen[] {
  return readPens(pens).map((pen) => {
    if (pen.id !== id) return pen;
    const at = FLOW_CYCLE.indexOf(pen.flow as (typeof FLOW_CYCLE)[number]);
    const next = at < 0 ? FLOW_CYCLE[0] : FLOW_CYCLE[(at + 1) % FLOW_CYCLE.length];
    if (!next || next === pen.flow) return pen;
    return { ...pen, flow: next, audit: "flow" };
  });
}

/** A blank title is left as it is. */
export function editPen(pens: readonly FountainPen[], id: string, title: unknown): FountainPen[] {
  const next = penLine(title);
  if (!next) return readPens(pens);
  const current = readPens(pens);
  if (current.some((pen) => pen.id !== id && pen.title === next)) return current;
  return current.map((pen) => (pen.id === id && pen.title !== next ? { ...pen, title: next, audit: "edit" } : pen));
}

/** A blank note is left as it is. */
export function editPenNote(pens: readonly FountainPen[], id: string, note: unknown): FountainPen[] {
  const next = penNote(note);
  if (!next) return readPens(pens);
  return readPens(pens).map((pen) => (pen.id === id && pen.note !== next ? { ...pen, note: next, audit: "edit" } : pen));
}

/** A tag that is already on the pen, or a fourth tag, is left out. A tag is one letter from a to d. */
export function addPenTag(pens: readonly FountainPen[], id: string, tag: unknown): FountainPen[] {
  const next = tagOf(tag);
  if (!next) return readPens(pens);
  return readPens(pens).map((pen) => {
    if (pen.id !== id || pen.tags.includes(next) || pen.tags.length >= TAG_CAP) return pen;
    return { ...pen, tags: [...pen.tags, next], audit: "tag" };
  });
}

/** An unknown weight is left as it is. 0 clears the weight. */
export function setPenWeight(pens: readonly FountainPen[], id: string, weight: unknown): FountainPen[] {
  const next = weightOf(weight);
  if (next === null) return readPens(pens);
  return readPens(pens).map((pen) => (pen.id === id && pen.weight !== next ? { ...pen, weight: next, audit: "weight" } : pen));
}

/** Three drops become 6, six drops become 9, and nine drops stay. An unset count becomes 3. */
export function snoozePen(pens: readonly FountainPen[], id: string): FountainPen[] {
  return readPens(pens).map((pen) => {
    if (pen.id !== id) return pen;
    const next = pen.drops === 3 ? 6 : pen.drops === 6 ? 9 : pen.drops === 9 ? 9 : 3;
    if (next === pen.drops) return pen;
    return { ...pen, drops: next, audit: "drops" };
  });
}

export function setPenPin(pens: readonly FountainPen[], id: string, pinned: boolean): FountainPen[] {
  return readPens(pens).map((pen) => (pen.id === id && pen.pinned !== pinned ? { ...pen, pinned, audit: pinned ? "pin" : "unpin" } : pen));
}

/** P toggles the pin on the focused row of the board currently shown. */
export function pinFocused(pens: readonly FountainPen[], shownIds: readonly string[], index: number): FountainPen[] {
  if (!shownIds.length) return readPens(pens);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readPens(pens).find((pen) => pen.id === id);
  if (!row) return readPens(pens);
  return setPenPin(pens, id, !row.pinned);
}

/** L lengthens the drops on the focused pen. */
export function snoozeFocused(pens: readonly FountainPen[], shownIds: readonly string[], index: number): FountainPen[] {
  if (!shownIds.length) return readPens(pens);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readPens(pens).some((pen) => pen.id === id)) return readPens(pens);
  return snoozePen(pens, id);
}

/** H toggles the hold on the focused row. */
export function holdFocused(pens: readonly FountainPen[], shownIds: readonly string[], index: number): FountainPen[] {
  if (!shownIds.length) return readPens(pens);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readPens(pens).find((pen) => pen.id === id);
  if (!row) return readPens(pens);
  return setPenHold(pens, id, !row.held);
}

/** S cycles the flow on the focused pen. */
export function flowFocused(pens: readonly FountainPen[], shownIds: readonly string[], index: number): FountainPen[] {
  if (!shownIds.length) return readPens(pens);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readPens(pens).some((pen) => pen.id === id)) return readPens(pens);
  return cycleFlow(pens, id);
}

export function setPenHold(pens: readonly FountainPen[], id: string, held: boolean): FountainPen[] {
  return readPens(pens).map((pen) => (pen.id === id && pen.held !== held ? { ...pen, held, audit: held ? "hold" : "resume" } : pen));
}

export function setPenArchive(pens: readonly FountainPen[], id: string, archived: boolean): FountainPen[] {
  return readPens(pens).map((pen) => (pen.id === id && pen.archived !== archived ? { ...pen, archived, audit: archived ? "archive" : "open" } : pen));
}

export function bulkPenInk(pens: readonly FountainPen[], ids: readonly string[], ink: unknown): FountainPen[] {
  const next = inkOf(ink);
  if (!next) return readPens(pens);
  const picked = new Set(ids);
  return readPens(pens).map((pen) => (picked.has(pen.id) && pen.ink !== next ? { ...pen, ink: next, audit: "ink" } : pen));
}

export function bulkPenPin(pens: readonly FountainPen[], ids: readonly string[], pinned: boolean): FountainPen[] {
  const picked = new Set(ids);
  return readPens(pens).map((pen) => (picked.has(pen.id) && pen.pinned !== pinned ? { ...pen, pinned, audit: pinned ? "pin" : "unpin" } : pen));
}

export function bulkPenArchive(pens: readonly FountainPen[], ids: readonly string[], archived: boolean): FountainPen[] {
  const picked = new Set(ids);
  return readPens(pens).map((pen) => (picked.has(pen.id) && pen.archived !== archived ? { ...pen, archived, audit: archived ? "archive" : "open" } : pen));
}

export function bulkPenFlow(pens: readonly FountainPen[], ids: readonly string[], flow: unknown): FountainPen[] {
  const next = flowName(flow);
  if (!next) return readPens(pens);
  const picked = new Set(ids);
  return readPens(pens).map((pen) => (picked.has(pen.id) && pen.flow !== next ? { ...pen, flow: next, audit: "flow" } : pen));
}

export function bulkPenTag(pens: readonly FountainPen[], ids: readonly string[], tag: unknown): FountainPen[] {
  return ids.reduce((rows, id) => addPenTag(rows, id, tag), readPens(pens));
}

export function resetPens(): FountainPen[] {
  return [];
}

function inTray(pen: FountainPen, tray: PenTray): boolean {
  if (tray === "archived") return pen.archived;
  if (tray === "held") return pen.held && !pen.archived;
  return !pen.held && !pen.archived;
}

function nibHit(nib: number | null, exact: number | null, pick: NibPick | null): boolean {
  if (exact !== null) return nib === exact;
  if (pick === null) return true;
  if (pick === "blank") return nib === null;
  if (pick === "peak") return peakNib(nib);
  if (pick === "quiet") return quietNib(nib);
  return nibBand(nib) === pick;
}

/** An open pen whose nib sits more than one nib behind the desk. Weight, a hold, or an archive is not late. */
export function latePen(pen: FountainPen, desk: unknown): boolean {
  const gap = nibGap(pen.nib, desk);
  return inTray(pen, "open") && pen.weight === 0 && gap !== null && gap > 1;
}

/** An open pen with 3 drops is due now. Weight, a hold, or an archive is not. */
export function soonPen(pen: FountainPen): boolean {
  return inTray(pen, "open") && pen.weight === 0 && pen.drops === 3;
}

/** Open pens that are late or due now. A weighted pen stays off the reminder list. */
export function reminderPens(pens: readonly FountainPen[], desk: unknown): FountainPen[] {
  return readPens(pens).filter((pen) => latePen(pen, desk) || soonPen(pen));
}

/** Open pens whose nib sits within one nib of the desk. Weight, a hold, or an archive stays out. */
export function windowPens(pens: readonly FountainPen[], desk: unknown): FountainPen[] {
  return readPens(pens).filter((pen) => {
    const gap = nibGap(pen.nib, desk);
    return inTray(pen, "open") && pen.weight === 0 && gap !== null && Math.abs(gap) <= 1;
  });
}

/** Open light pens whose nib is the desk nib. */
export function matchedPens(pens: readonly FountainPen[], desk: unknown): number {
  const at = nibOf(desk);
  if (at === null) return 0;
  return readPens(pens).filter((pen) => inTray(pen, "open") && pen.weight === 0 && pen.nib === at).length;
}

/** Search matches the title, the note, the scribe, and the tags. */
export function visiblePens(
  pens: readonly FountainPen[],
  tray: PenTray,
  query: string,
  scribe: string | null,
  ink: string | null,
  flow: string | null,
  exact: number | null,
  pick: NibPick | null,
  drops: number | "blank" | null,
  weight: number | "blank" | null,
  floodOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  lightOnly: boolean,
): FountainPen[] {
  const text = query.trim().toLowerCase();
  return readPens(pens).filter((pen) => {
    if (!inTray(pen, tray)) return false;
    if (text) {
      const hay = `${pen.title} ${pen.note} ${pen.scribe} ${pen.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (scribe !== null && pen.scribe !== scribe) return false;
    if (ink === "blank" ? Boolean(pen.ink) : ink && pen.ink !== ink) return false;
    if (flow === "blank" ? Boolean(pen.flow) : flow && pen.flow !== flow) return false;
    if (!nibHit(pen.nib, exact, pick)) return false;
    if (drops === "blank" ? pen.drops !== null : drops !== null && pen.drops !== drops) return false;
    if (weight === "blank" ? pen.weight !== 0 : weight !== null && pen.weight !== weight) return false;
    if (floodOnly && pen.flow !== "flood") return false;
    if (peakOnly && !peakNib(pen.nib)) return false;
    if (houseOnly && !houseInk(pen.ink)) return false;
    if (quietOnly && !quietNib(pen.nib)) return false;
    if (lightOnly && pen.weight !== 0) return false;
    return true;
  });
}

export function sortPens(pens: readonly FountainPen[], mode: PenSort): FountainPen[] {
  const rows = pens.slice();
  if (mode === "scribe") return rows.sort((a, b) => a.scribe.localeCompare(b.scribe) || (a.nib ?? 99) - (b.nib ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.nib ?? 99) - (b.nib ?? 99) || a.title.localeCompare(b.title));
}

export function penLedger(pens: readonly FountainPen[], query: string): FountainPen[] {
  const text = query.trim().toLowerCase();
  return sortPens(
    readPens(pens).filter((pen) => pen.nib !== null && (!text || pen.title.toLowerCase().includes(text))),
    "nib",
  );
}

export function penCounts(pens: readonly FountainPen[], desk: unknown): PenCounts {
  const rows = readPens(pens);
  return {
    open: rows.filter((pen) => inTray(pen, "open")).length,
    held: rows.filter((pen) => inTray(pen, "held")).length,
    archived: rows.filter((pen) => inTray(pen, "archived")).length,
    pinned: rows.filter((pen) => pen.pinned).length,
    peak: rows.filter((pen) => inTray(pen, "open") && pen.weight === 0 && peakNib(pen.nib)).length,
    late: rows.filter((pen) => latePen(pen, desk)).length,
    soon: rows.filter((pen) => soonPen(pen)).length,
    weight: rows.filter((pen) => inTray(pen, "open") && pen.weight > 0).length,
    house: rows.filter((pen) => inTray(pen, "open") && houseInk(pen.ink)).length,
    window: windowPens(rows, desk).length,
    matched: matchedPens(rows, desk),
  };
}

export function penShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open pens as a share of every open pen. */
export function lateShare(pens: readonly FountainPen[], desk: unknown): number {
  const rows = readPens(pens);
  const open = rows.filter((pen) => inTray(pen, "open")).length;
  const late = rows.filter((pen) => latePen(pen, desk)).length;
  return penShare(late, open);
}

/** Distinct nibs on open pens. */
export function usedNibs(pens: readonly FountainPen[]): number {
  const nibs = new Set<number>();
  for (const pen of readPens(pens)) {
    if (inTray(pen, "open") && pen.nib !== null) nibs.add(pen.nib);
  }
  return nibs.size;
}

/** Open pens that share a nib and an ink. A different ink on the same nib is not a clash. */
export function clashNibCount(pens: readonly FountainPen[]): number {
  const groups = new Map<string, number>();
  for (const pen of readPens(pens)) {
    if (!inTray(pen, "open") || pen.nib === null || !pen.ink) continue;
    const key = `${pen.nib}:${pen.ink}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open pens that share a drop count. An unset count is not a clash. */
export function dropsClashCount(pens: readonly FountainPen[]): number {
  const groups = new Map<number, number>();
  for (const pen of readPens(pens)) {
    if (!inTray(pen, "open") || pen.drops === null) continue;
    groups.set(pen.drops, (groups.get(pen.drops) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open pens in the same ink whose nibs differ by four.
 * The count is the pens that have at least one neighbor.
 */
export function adjacentPenCount(pens: readonly FountainPen[]): number {
  const open = readPens(pens).filter((pen) => inTray(pen, "open") && pen.nib !== null && pen.ink);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.ink === right.ink && Math.abs((left.nib ?? 0) - (right.nib ?? 0)) === 4) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The ink with the fewest open pens.
 * A tie keeps IVORY, then CHAMPAGNE, then GRAPHITE.
 * An empty desk still suggests IVORY.
 */
export function suggestInk(pens: readonly FountainPen[]): "IVORY" | "CHAMPAGNE" | "GRAPHITE" {
  const rows = readPens(pens).filter((pen) => inTray(pen, "open"));
  const order = ["IVORY", "CHAMPAGNE", "GRAPHITE"] as const;
  let best: "IVORY" | "CHAMPAGNE" | "GRAPHITE" = "IVORY";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const ink of order) {
    const count = rows.filter((pen) => pen.ink === ink).length;
    if (count < bestCount) {
      best = ink;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The drop count with the fewest open pens.
 * A tie keeps 6, then 3, then 9.
 * An empty desk still suggests 6.
 */
export function suggestDrops(pens: readonly FountainPen[]): 3 | 6 | 9 {
  const rows = readPens(pens).filter((pen) => inTray(pen, "open"));
  const order = [6, 3, 9] as const;
  let best: 3 | 6 | 9 = 6;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const drops of order) {
    const count = rows.filter((pen) => pen.drops === drops).length;
    if (count < bestCount) {
      best = drops;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open scribe. A blank scribe is skipped. An empty desk stays blank. */
export function suggestScribe(pens: readonly FountainPen[]): string {
  const found = readPens(pens).find((pen) => inTray(pen, "open") && pen.scribe);
  return found ? found.scribe : "";
}

/**
 * The scribe carrying the fewest open pens.
 * A tie keeps the earlier name. A blank scribe is not a load.
 * An empty roster falls back to the newest scribe.
 */
export function fairScribe(pens: readonly FountainPen[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = scribeLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestScribe(pens);
  const open = readPens(pens).filter((pen) => inTray(pen, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((pen) => pen.scribe === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The scribe with the most open pens. A tie keeps the newer name on the desk. */
export function busiestScribe(pens: readonly FountainPen[]): string {
  const rows = readPens(pens).filter((pen) => inTray(pen, "open") && pen.scribe);
  const names: string[] = [];
  for (const pen of rows) if (!names.includes(pen.scribe)) names.push(pen.scribe);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((pen) => pen.scribe === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function penScribes(pens: readonly FountainPen[]): string[] {
  const out: string[] = [];
  for (const pen of readPens(pens)) {
    if (pen.scribe && !out.includes(pen.scribe)) out.push(pen.scribe);
  }
  return out;
}

export function penInks(pens: readonly FountainPen[]): string[] {
  const out: string[] = [];
  for (const pen of readPens(pens)) {
    if (pen.ink && !out.includes(pen.ink)) out.push(pen.ink);
  }
  return out;
}

/** Open pens whose scribe also keeps another open pen on a different nib. */
export function pairScribeCount(pens: readonly FountainPen[]): number {
  const open = readPens(pens).filter((pen) => inTray(pen, "open") && pen.scribe && pen.nib !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].scribe === open[j].scribe && open[i].nib !== open[j].nib) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open pens that share an ink on different nibs. */
export function sharedInkCount(pens: readonly FountainPen[]): number {
  const open = readPens(pens).filter((pen) => inTray(pen, "open") && pen.ink && pen.nib !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].ink === open[j].ink && open[i].nib !== open[j].nib) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The weight of open pens. A clear weight adds nothing. */
export function weightLoad(pens: readonly FountainPen[]): number {
  return readPens(pens).filter((pen) => inTray(pen, "open")).reduce((sum, pen) => sum + pen.weight, 0);
}

/** Open pens that are both the quiet nib and a house ink. */
export function quietLoftCount(pens: readonly FountainPen[]): number {
  return readPens(pens).filter((pen) => inTray(pen, "open") && quietNib(pen.nib) && houseInk(pen.ink)).length;
}

/** Open pens whose flow is flood. */
export function floodLoad(pens: readonly FountainPen[]): number {
  return readPens(pens).filter((pen) => inTray(pen, "open") && pen.flow === "flood").length;
}

/** The span from the lowest open nib to the highest. Fewer than two nibs span nothing. */
export function nibSpan(pens: readonly FountainPen[]): number {
  const nibs = readPens(pens).filter((pen) => inTray(pen, "open") && pen.nib !== null).map((pen) => pen.nib as number);
  if (nibs.length < 2) return 0;
  return Math.max(...nibs) - Math.min(...nibs);
}

/**
 * The next open pen at or after the desk nib.
 * A flood flow, weight, a hold, and an archive stay off the list.
 * When every open nib is behind, the earliest nib is next.
 */
export function nextPen(pens: readonly FountainPen[], desk: unknown): string {
  const now = nibOf(desk);
  if (now === null) return "";
  const waiting = readPens(pens).filter((pen) => inTray(pen, "open") && pen.nib !== null && pen.flow !== "flood" && pen.weight === 0);
  if (!waiting.length) return "";
  const byNib = (a: FountainPen, b: FountainPen) => (a.nib ?? 0) - (b.nib ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((pen) => (pen.nib ?? 0) >= now).sort(byNib);
  const upcoming = later[0];
  if (upcoming) return upcoming.id;
  const earliest = waiting.slice().sort(byNib)[0];
  return earliest ? earliest.id : "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function penCopy(pen: FountainPen, desk: unknown): string {
  const gap = nibGap(pen.nib, desk);
  return [pen.title, pen.scribe, pen.nib ?? "", pen.ink, pen.flow, pen.drops ?? "", pen.weight, pen.tags.join(" "), pen.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the pens saved in this browser. The gap and the late mark use the nib you pass. */
export function pensCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,scribe,nib,ink,flow,drops,weight,tags,pinned,held,archived,gap,late,soon,house,window,matched,note,audit"];
  const rows = readPens(raw);
  const windowIds = new Set(windowPens(rows, desk).map((pen) => pen.id));
  const at = nibOf(desk);
  for (const pen of rows) {
    const gap = nibGap(pen.nib, desk);
    lines.push([
      pen.title,
      pen.scribe,
      pen.nib === null ? "" : String(pen.nib),
      pen.ink,
      pen.flow,
      pen.drops === null ? "" : String(pen.drops),
      String(pen.weight),
      pen.tags.join(" "),
      pen.pinned ? "1" : "0",
      pen.held ? "1" : "0",
      pen.archived ? "1" : "0",
      gap === null ? "" : String(gap),
      latePen(pen, desk) ? "1" : "0",
      soonPen(pen) ? "1" : "0",
      houseInk(pen.ink) ? "1" : "0",
      windowIds.has(pen.id) ? "1" : "0",
      at !== null && pen.nib === at && pen.weight === 0 && inTray(pen, "open") ? "1" : "0",
      pen.note,
      pen.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeScribe(raw: string, scribes: readonly string[]): string {
  if (raw === "blank") return "blank";
  return scribes.includes(raw) ? raw : "all";
}

export function activeInk(raw: string, inks: readonly string[]): string {
  if (raw === "blank") return "blank";
  return inkOf(raw) && inks.includes(inkOf(raw)) ? inkOf(raw) : "all";
}

export function activeFlow(raw: string, flows: readonly string[]): string {
  if (raw === "blank") return "blank";
  const flow = flowName(raw);
  return flow && flows.includes(flow) ? flow : "all";
}

export function activeNib(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const nib = nibOf(raw);
  return nib === null ? "all" : String(nib);
}

export function activeDrops(raw: string): string {
  if (raw === "blank") return "blank";
  const drops = dropsOf(raw);
  return drops === null ? "all" : String(drops);
}

export function activeWeight(raw: string): string {
  if (raw === "blank") return "blank";
  const weight = weightOf(raw);
  return weight === null ? "all" : String(weight);
}

export function scribeArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function inkArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return inkOf(filter) || null;
}

export function flowArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return flowName(filter) || null;
}

export function nibArg(filter: string): { exact: number | null; pick: NibPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: nibOf(filter), pick: null };
}

export function dropsArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return dropsOf(filter);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

function readView(raw: unknown): PenView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<PenView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    scribe: row.scribe === "blank" ? "blank" : clip(row.scribe, 16) || "all",
    ink: row.ink === "blank" || row.ink === "all" ? (row.ink === "blank" ? "blank" : "all") : inkOf(row.ink) || "all",
    flow: row.flow === "blank" || row.flow === "all" ? (row.flow === "blank" ? "blank" : "all") : flowName(row.flow) || "all",
    nib: activeNib(String(row.nib || "all")),
    drops: activeDrops(String(row.drops || "all")),
    weight: activeWeight(String(row.weight || "all")),
  };
}

export function readPenViews(raw: unknown): PenView[] {
  if (!Array.isArray(raw)) return [];
  const out: PenView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addPenView(views: readonly PenView[], view: PenView): PenView[] {
  const current = readPenViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropPenView(views: readonly PenView[], id: string): PenView[] {
  return readPenViews(views).filter((view) => view.id !== id);
}

export type CrestState = "" | "set" | "clear";

export type CrestLane = "" | "hearth" | "court" | "porch";

export type CrestTone = "" | "gilt" | "ink" | "ivory" | "mist";

export type CrestShape = "all" | "catalog" | "wide" | "gilt";

export type CrestValue =
  | string
  | { email?: unknown; phone?: unknown; affiliateA?: unknown; affiliateB?: unknown; affiliateC?: unknown; language?: unknown; address?: unknown; country?: unknown; city?: unknown; desk?: unknown; name?: unknown; username?: unknown; accountType?: unknown; lastBrowser?: unknown; isResident?: unknown; documentsStatus?: unknown }
  | null
  | undefined;

export type CrestRow = { id: string; label?: string; note: CrestValue };

export type CrestLaneLine = { lane: string; count: number };

const CREST_LANES = ["hearth", "court", "porch"] as const;

const CREST_TONES = ["gilt", "ink", "ivory", "mist"] as const;

const CREST_BLOCK = ["phone", "affiliateA", "affiliateB", "affiliateC", "language", "address", "country", "city", "desk", "name", "username", "accountType", "lastBrowser", "isResident", "documentsStatus"] as const;

const CATALOG = new Set(["a@b.c", "desk@7fx.com", "gold@house.co", "ivory@desk.tr", "pen@loft.io"]);

const HEARTH_LOCALS = new Set(["desk", "gold", "ivory"]);

function crestBody(raw: unknown): string {
  return clip(raw, 40).toLowerCase().replace(/[^a-z0-9@+._-]/g, "");
}

function crestText(value: CrestValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string" || value == null) {
    if (value == null) return { text: "", explicit: true };
    return { text: crestBody(value), explicit: true };
  }
  if (typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (CREST_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("email" in value)) return { text: null, explicit: false };
  const inner = value.email;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: crestBody(inner), explicit: true };
}

function mailParts(text: string): { local: string; domain: string } {
  const at = text.indexOf("@");
  if (at < 0) return { local: text, domain: "" };
  return { local: text.slice(0, at), domain: text.slice(at + 1) };
}

export function crestState(value: CrestValue): CrestState {
  const found = crestText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function crestCopy(value: CrestValue): string {
  const found = crestText(value);
  return found.explicit && found.text ? found.text : "";
}

/** The stem is the first four characters of the domain. A mail without a domain uses the address itself. */
export function crestOf(value: CrestValue): string {
  const text = crestCopy(value);
  if (!text) return "";
  const domain = mailParts(text).domain;
  return (domain || text).slice(0, 4).toUpperCase();
}

/**
 * desk, gold, and ivory, a .tr domain, or a domain that contains 7fx, is the hearth when a dot is present.
 * Any other address with a dotted domain is the court.
 * Text without a dotted domain is the porch.
 */
export function crestLane(value: CrestValue): CrestLane {
  const text = crestCopy(value);
  if (!text) return "";
  const { local, domain } = mailParts(text);
  if (!domain.includes(".")) return "porch";
  if (HEARTH_LOCALS.has(local) || domain.endsWith(".tr") || domain.includes("7fx")) return "hearth";
  return "court";
}

/** A .com domain is gilt. A .tr or .de domain is ivory. An address with no digit is mist. Anything else is ink. */
export function crestTone(value: CrestValue): CrestTone {
  const text = crestCopy(value);
  if (!text) return "";
  const domain = mailParts(text).domain;
  if (domain.endsWith(".com")) return "gilt";
  if (domain.endsWith(".tr") || domain.endsWith(".de")) return "ivory";
  if (!/[0-9]/.test(text)) return "mist";
  return "ink";
}

/** a@b.c, desk@7fx.com, gold@house.co, ivory@desk.tr, and pen@loft.io belong to the house book. */
export function catalogCrest(value: CrestValue): boolean {
  return CATALOG.has(crestCopy(value));
}

export function catalogCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => catalogCrest(row.note)).length;
}

/** A local part longer than eight characters is wide. An address without @ uses the whole text. */
export function wideCrest(value: CrestValue): boolean {
  const text = crestCopy(value);
  if (!text) return false;
  return mailParts(text).local.length > 8;
}

export function wideCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => wideCrest(row.note)).length;
}

export function giltCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestTone(row.note) === "gilt").length;
}

/** Customers whose mail stem is shared with at least one other customer. */
export function sharedCrestCount(rows: readonly CrestRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = crestOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function crestLanes(rows: readonly CrestRow[]): CrestLaneLine[] {
  return CREST_LANES.map((lane) => ({ lane, count: rows.filter((row) => crestLane(row.note) === lane).length }));
}

/** The lane with the most set crests. A tie keeps hearth, then court, then porch. */
export function leadingCrest(rows: readonly CrestRow[]): string {
  const lines = crestLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || CREST_LANES.indexOf(a.lane as (typeof CREST_LANES)[number]) - CREST_LANES.indexOf(b.lane as (typeof CREST_LANES)[number]))[0];
  return lead ? lead.lane : "";
}

/** The tone with the most set crests. A tie keeps gilt, then ink, then ivory, then mist. */
export function leadingCrestTone(rows: readonly CrestRow[]): string {
  const counts = CREST_TONES.map((tone) => ({ tone, count: rows.filter((row) => crestTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || CREST_TONES.indexOf(a.tone) - CREST_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function crestShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Step on the mail timeline. A clear address is 0. A plain mail is 1, a plus alias is 2, and two dots in the domain are 3. */
export function crestStep(value: CrestValue): 0 | 1 | 2 | 3 {
  const text = crestCopy(value);
  if (!text) return 0;
  if (text.includes("+")) return 2;
  const dots = mailParts(text).domain.split(".").length - 1;
  if (dots >= 2) return 3;
  return 1;
}

export function presentCrests(rows: readonly CrestRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = crestState(row.note);
    const lane = state === "set" ? crestLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenCrests(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = String(item);
    if (allow.has(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedCrests(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleCrest(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleCrestReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCrestReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCrestLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function visibleCrestCustomers(
  rows: readonly CrestRow[],
  lane: CrestLane | "blank" | null,
  tone: CrestTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: CrestShape,
): CrestRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = crestState(row.note);
    const mark = state === "set" ? crestLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && mark !== lane) return false;
    if (tone && crestTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogCrest(row.note)) return false;
    if (shape === "wide" && !wideCrest(row.note)) return false;
    if (shape === "gilt" && crestTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${crestCopy(row.note)} ${crestOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeCrestLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeCrestTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "mist" ? raw : "all";
}

export function crestLaneArg(filter: string): CrestLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "hearth" || filter === "court" || filter === "porch") return filter;
  return null;
}

export function crestToneArg(filter: string): CrestTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "mist") return filter;
  return null;
}

export function crestsCsv(rows: readonly CrestRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of crestLanes(rows)) lines.push(`lane,${line.lane},${line.count}`);
  lines.push(`catalog,catalog,${catalogCrestCount(rows)}`);
  lines.push(`wide,wide,${wideCrestCount(rows)}`);
  lines.push(`tone,gilt,${giltCrestCount(rows)}`);
  lines.push(`tone,mist,${rows.filter((row) => crestTone(row.note) === "mist").length}`);
  lines.push(`shared,shared,${sharedCrestCount(rows)}`);
  return lines.join("\n");
}

export function crestRowsCsv(rows: readonly CrestRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,crest,lane,tone,step,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = crestState(row.note);
    const lane = state === "set" ? crestLane(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      crestOf(row.note),
      lane,
      state === "set" ? crestTone(row.note) : "",
      String(crestStep(row.note)),
      catalogCrest(row.note) ? "1" : "0",
      wideCrest(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
