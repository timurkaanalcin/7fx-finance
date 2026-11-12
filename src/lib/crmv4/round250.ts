/**
 * Beacon slips for a night-watch follow-up, and validation glyphs already stored on a trader.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_beacon_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   circuit text not null default '',
 *   glass text not null default '',
 *   fog text not null default '',
 *   span_min integer,
 *   step integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   flagged boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_validation_glyph_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_validation_glyph_review (
 *   trader_id text primary key
 * );
 */

export const BCN_KEY = "crmv4-beacon-slip";
export const BCN_VIEW_KEY = "crmv4-beacon-views";
export const BCN_DENSITY_KEY = "crmv4-beacon-density";
export const VGL_KEY = "crmv4-glyph-hide";
export const VGL_REVIEW_KEY = "crmv4-glyph-review";

export const BEACON_CIRCUITS = ["lamp", "reef", "bar", "cove", "spit", "head"] as const;

export type BeaconCircuit = (typeof BEACON_CIRCUITS)[number];

export type GlassName = "blank" | "clear" | "amber" | "ruby";

export type FogName = "blank" | "still" | "haze" | "squall";

export type SlipTray = "open" | "held" | "archived";

export type SlipDensity = "airy" | "tight";

export type SlipSort = "circuit" | "keeper";

export type BeaconSlip = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  circuit: string;
  span: number | null;
  glass: string;
  fog: string;
  step: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  flagged: boolean;
  audit: string;
};

export type BeaconView = {
  id: string;
  name: string;
  tray: SlipTray;
  query: string;
  keeper: string;
  glass: string;
  fog: string;
  circuit: string;
  span: string;
  step: string;
};

export type SlipCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  step: number;
  house: number;
  span: number;
  matched: number;
  flagged: number;
  idle: number;
  rush: number;
  resting: number;
  overdue: number;
};

export type GlyphLane = "" | "digit" | "brief" | "vowel" | "twin" | "split" | "long" | "plain";

export type GlyphHue = "" | "gilt" | "slate" | "sand" | "clay" | "soot" | "pearl" | "mist";

export type GlyphState = "" | "clear" | "set";

export type GlyphShape = "all" | "twin" | "wide" | "bound" | "notch" | "digit" | "vowel" | "brief";

export type GlyphReview = "all" | "reviewed" | "fresh";

export type GlyphValue = string | { validationStatus?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type GlyphRow = { id: string; label: string; note: GlyphValue };

export type GlyphLaneLine = { lane: string; count: number };

export const ROUND250_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "hold",
  "archive",
  "flag",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "sort",
  "kpis",
  "chart",
  "timeline",
  "bulk",
  "csv",
  "keys",
  "audit",
  "fair-keeper",
  "viewer",
  "suggest",
  "glyphs",
  "glyph-review",
  "glyph-csv",
] as const;

const AUDITS = ["save", "edit", "note", "fog", "pin", "unpin", "hold", "resume", "archive", "open", "glass", "tag", "step", "span", "short", "flag"] as const;

const GLASSES = ["clear", "amber", "ruby"] as const;

const FOGS = ["still", "haze", "squall"] as const;

const FOG_CYCLE = ["still", "haze", "squall"] as const;

const STEP_CYCLE = [2, 4, 6, 8] as const;

const SPANS = [15, 30, 45] as const;

const PEAK = new Set(["lamp", "head"]);

const QUIET = new Set(["reef", "spit"]);

const HOUSE = new Set(["CLEAR", "AMBER"]);

const EARLY = new Set(["lamp", "reef"]);

const MID = new Set(["bar", "cove"]);

const LATE = new Set(["spit", "head"]);

const LANE_ORDER = ["digit", "brief", "vowel", "twin", "split", "long", "plain"] as const;

const HUE_ORDER = ["gilt", "slate", "sand", "clay", "soot", "pearl", "mist"] as const;

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const SLIP_CAP = 8;

const VIEW_CAP = 4;

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

function glassName(raw: unknown): Exclude<GlassName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GLASSES as readonly string[]).includes(text) ? (text as Exclude<GlassName, "blank">) : "";
}

function fogName(raw: unknown): Exclude<FogName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (FOGS as readonly string[]).includes(text) ? (text as Exclude<FogName, "blank">) : "";
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

function inTray(slip: BeaconSlip, tray: SlipTray): boolean {
  if (tray === "held") return slip.held && !slip.archived;
  if (tray === "archived") return slip.archived;
  return !slip.held && !slip.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function circuitIndex(circuit: string): number {
  return BEACON_CIRCUITS.indexOf(circuit as BeaconCircuit);
}

function stepIndex(step: number): number {
  return STEP_CYCLE.indexOf(step as (typeof STEP_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function slipLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function slipNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A circuit outside the six lights is left blank. */
export function circuitOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (BEACON_CIRCUITS as readonly string[]).includes(text) ? text : "";
}

/** The SLA timer is 15, 30, or 45 minutes. Anything else stays blank. */
export function spanOf(raw: unknown): 15 | 30 | 45 | null {
  const value = Number(clip(raw, 2));
  return (SPANS as readonly number[]).includes(value) ? (value as 15 | 30 | 45) : null;
}

/** Step is 2, 4, 6, or 8. Anything else stays blank. */
export function stepOf(raw: unknown): 2 | 4 | 6 | 8 | null {
  const value = Number(clip(raw, 1));
  return (STEP_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 6 | 8) : null;
}

/** Glass is clear, amber, or ruby. The saved glass is CLEAR, AMBER, or RUBY. */
export function glassOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "clear") return "CLEAR";
  if (text === "amber") return "AMBER";
  if (text === "ruby") return "RUBY";
  return "";
}

/** Fog is still, haze, or squall. A blank fog stays blank. */
export function fogOf(raw: unknown): string {
  return fogName(raw);
}

export function peakCircuit(circuit: unknown): boolean {
  return PEAK.has(circuitOf(circuit));
}

export function quietCircuit(circuit: unknown): boolean {
  return QUIET.has(circuitOf(circuit));
}

/** Early is lamp and reef. Mid is bar and cove. Late is spit and head. */
export function circuitBand(circuit: unknown): "early" | "mid" | "late" | "" {
  const name = circuitOf(circuit);
  if (EARLY.has(name)) return "early";
  if (MID.has(name)) return "mid";
  if (LATE.has(name)) return "late";
  return "";
}

/** Steps from the slip circuit to the desk circuit. A blank circuit has no gap. */
export function circuitGap(slipCircuit: unknown, deskCircuit: unknown): number | null {
  const from = circuitIndex(circuitOf(slipCircuit));
  const to = circuitIndex(circuitOf(deskCircuit));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseGlass(glass: unknown): boolean {
  return HOUSE.has(glassOf(glass));
}

export function activeCircuit(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return circuitOf(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const value = spanOf(raw);
  return value === null ? "all" : String(value);
}

export function activeFog(raw: unknown, fogs: readonly string[]): string {
  const fog = fogOf(raw);
  return fog && fogs.includes(fog) ? fog : "all";
}

export function activeStep(raw: unknown): string {
  const value = stepOf(raw);
  return value === null ? "all" : String(value);
}

export function activeGlass(raw: unknown): string {
  const name = glassName(raw);
  return name || "all";
}

export function moveBeaconFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestGlass(slips: readonly BeaconSlip[]): string {
  const counts = new Map<string, number>();
  for (const slip of slips) {
    if (!slip.glass) continue;
    counts.set(slip.glass, (counts.get(slip.glass) || 0) + 1);
  }
  let best = "CLEAR";
  let score = 0;
  for (const glass of ["CLEAR", "AMBER", "RUBY"]) {
    const count = counts.get(glass) || 0;
    if (count > score) {
      best = glass;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short SLA. An evening desk asks for a long one. A tie among saved slips keeps 30. */
export function suggestSpan(slips: readonly BeaconSlip[], hour: number): 15 | 30 | 45 {
  const counts = new Map<number, number>();
  for (const slip of slips) {
    if (slip.span === null) continue;
    counts.set(slip.span, (counts.get(slip.span) || 0) + 1);
  }
  let best: 15 | 30 | 45 | null = null;
  let score = 0;
  for (const span of SPANS) {
    const count = counts.get(span) || 0;
    if (count > score) {
      best = span;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 15;
  if (hour >= 18) return 45;
  return 30;
}

/** The keeper with the fewest open slips. A tie keeps the roster order. */
export function fairKeeper(slips: readonly BeaconSlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = slips.filter((slip) => inTray(slip, "open"));
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((slip) => slip.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readBeaconSlips(raw: unknown): BeaconSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: BeaconSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BeaconSlip>;
    const id = clip(row.id, 40);
    const title = slipLine(row.title);
    if (!id || !title || out.some((slip) => slip.id === id || slip.title === title)) continue;
    out.push({
      id,
      title,
      note: slipNote(row.note),
      keeper: clip(row.keeper, 24),
      circuit: circuitOf(row.circuit),
      span: spanOf(row.span),
      glass: glassOf(row.glass),
      fog: fogOf(row.fog),
      step: stepOf(row.step) ?? 2,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      archived: row.archived === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, SLIP_CAP);
}

export function addBeaconSlip(
  slips: readonly BeaconSlip[],
  slip: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    circuit?: unknown;
    glass?: string;
    fog?: string;
    span?: unknown;
    step?: unknown;
    tags?: unknown;
  },
): BeaconSlip[] {
  const current = readBeaconSlips(slips);
  const id = clip(slip.id, 40);
  const title = slipLine(slip.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: BeaconSlip = {
    id,
    title,
    note: slipNote(slip.note),
    keeper: clip(slip.keeper, 24),
    circuit: circuitOf(slip.circuit),
    span: spanOf(slip.span),
    glass: glassOf(slip.glass),
    fog: fogOf(slip.fog),
    step: stepOf(slip.step) ?? 2,
    tags: tagsOf(slip.tags),
    pinned: false,
    held: false,
    archived: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLIP_CAP);
}

function mapSlip(slips: readonly BeaconSlip[], id: string, change: (slip: BeaconSlip) => BeaconSlip): BeaconSlip[] {
  return readBeaconSlips(slips).map((slip) => (slip.id === id ? change(slip) : slip));
}

function touchIds(slips: readonly BeaconSlip[], ids: readonly string[], change: (slip: BeaconSlip) => BeaconSlip): BeaconSlip[] {
  const picked = new Set(ids);
  return readBeaconSlips(slips).map((slip) => (picked.has(slip.id) ? change(slip) : slip));
}

export function editBeacon(slips: readonly BeaconSlip[], id: string, title: string): BeaconSlip[] {
  const next = slipLine(title);
  if (!next) return readBeaconSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.title === next ? slip : { ...slip, title: next, audit: "edit" }));
}

export function editBeaconNote(slips: readonly BeaconSlip[], id: string, note: string): BeaconSlip[] {
  const next = slipNote(note);
  return mapSlip(slips, id, (slip) => (slip.note === next ? slip : { ...slip, note: next, audit: "note" }));
}

export function setSlipPin(slips: readonly BeaconSlip[], id: string, pinned: boolean): BeaconSlip[] {
  return mapSlip(slips, id, (slip) => (slip.pinned === pinned ? slip : { ...slip, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setSlipHold(slips: readonly BeaconSlip[], id: string, held: boolean): BeaconSlip[] {
  return mapSlip(slips, id, (slip) => (slip.held === held || slip.archived ? slip : { ...slip, held, audit: held ? "hold" : "resume" }));
}

export function setSlipArchive(slips: readonly BeaconSlip[], id: string, archived: boolean): BeaconSlip[] {
  return mapSlip(slips, id, (slip) => (slip.archived === archived ? slip : { ...slip, archived, held: archived ? false : slip.held, audit: archived ? "archive" : "open" }));
}

export function setSlipFlag(slips: readonly BeaconSlip[], id: string, flagged: boolean): BeaconSlip[] {
  return mapSlip(slips, id, (slip) => (slip.flagged === flagged ? slip : { ...slip, flagged, audit: "flag" }));
}

export function setSlipStep(slips: readonly BeaconSlip[], id: string, step: unknown): BeaconSlip[] {
  const next = stepOf(step);
  if (next === null) return readBeaconSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.step === next ? slip : { ...slip, step: next, audit: "step" }));
}

export function setSlipGlass(slips: readonly BeaconSlip[], id: string, glass: unknown): BeaconSlip[] {
  const next = glassOf(glass);
  if (!next) return readBeaconSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.glass === next ? slip : { ...slip, glass: next, audit: "glass" }));
}

/** Fog steps still, haze, squall, then still again. A blank fog starts at still. */
export function cycleFog(slips: readonly BeaconSlip[], id: string): BeaconSlip[] {
  return mapSlip(slips, id, (slip) => {
    const at = FOG_CYCLE.indexOf(slip.fog as (typeof FOG_CYCLE)[number]);
    const next = at < 0 ? FOG_CYCLE[0] : FOG_CYCLE[(at + 1) % FOG_CYCLE.length];
    return next === slip.fog ? slip : { ...slip, fog: next, audit: "fog" };
  });
}

export function addBeaconTag(slips: readonly BeaconSlip[], id: string, tag: string): BeaconSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBeaconSlips(slips);
  return mapSlip(slips, id, (slip) => {
    if (slip.tags.includes(next) || slip.tags.length >= TAG_CAP) return slip;
    return { ...slip, tags: [...slip.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 15, 15 becomes 30, and 30 becomes 45. A span of 45 stays. */
export function lengthenSpan(slips: readonly BeaconSlip[], id: string): BeaconSlip[] {
  return mapSlip(slips, id, (slip) => {
    if (slip.span === 45) return slip;
    const next = slip.span === 30 ? 45 : slip.span === 15 ? 30 : 15;
    return { ...slip, span: next, audit: "span" };
  });
}

/** A blank span becomes 45, 45 becomes 30, and 30 becomes 15. A span of 15 stays. */
export function shortenSpan(slips: readonly BeaconSlip[], id: string): BeaconSlip[] {
  return mapSlip(slips, id, (slip) => {
    if (slip.span === 15) return slip;
    const next = slip.span === 30 ? 15 : slip.span === 45 ? 30 : 45;
    return { ...slip, span: next, audit: "short" };
  });
}

export function raiseStep(slips: readonly BeaconSlip[], id: string): BeaconSlip[] {
  return mapSlip(slips, id, (slip) => {
    const at = stepIndex(slip.step);
    const next = at < 0 ? STEP_CYCLE[0] : STEP_CYCLE[(at + 1) % STEP_CYCLE.length];
    return next === slip.step ? slip : { ...slip, step: next, audit: "step" };
  });
}

export function lowerStep(slips: readonly BeaconSlip[], id: string): BeaconSlip[] {
  return mapSlip(slips, id, (slip) => {
    const at = stepIndex(slip.step);
    const next = at < 0 ? STEP_CYCLE[0] : STEP_CYCLE[(at + STEP_CYCLE.length - 1) % STEP_CYCLE.length];
    return next === slip.step ? slip : { ...slip, step: next, audit: "step" };
  });
}

function focusedSlip(slips: readonly BeaconSlip[], shownIds: readonly string[], index: number): BeaconSlip | undefined {
  const id = shownIds[index];
  return id ? readBeaconSlips(slips).find((item) => item.id === id) : undefined;
}

export function pinFocusedSlip(slips: readonly BeaconSlip[], shownIds: readonly string[], index: number): BeaconSlip[] {
  const slip = focusedSlip(slips, shownIds, index);
  if (!slip) return readBeaconSlips(slips);
  return setSlipPin(slips, slip.id, !slip.pinned);
}

export function holdFocusedSlip(slips: readonly BeaconSlip[], shownIds: readonly string[], index: number): BeaconSlip[] {
  const slip = focusedSlip(slips, shownIds, index);
  if (!slip) return readBeaconSlips(slips);
  return setSlipHold(slips, slip.id, !slip.held);
}

export function fogFocusedSlip(slips: readonly BeaconSlip[], shownIds: readonly string[], index: number): BeaconSlip[] {
  const id = shownIds[index];
  return id ? cycleFog(slips, id) : readBeaconSlips(slips);
}

export function flagFocusedSlip(slips: readonly BeaconSlip[], shownIds: readonly string[], index: number): BeaconSlip[] {
  const slip = focusedSlip(slips, shownIds, index);
  if (!slip) return readBeaconSlips(slips);
  return setSlipFlag(slips, slip.id, !slip.flagged);
}

export function tagFocusedSlip(slips: readonly BeaconSlip[], shownIds: readonly string[], index: number, tag: string): BeaconSlip[] {
  const id = shownIds[index];
  return id ? addBeaconTag(slips, id, tag) : readBeaconSlips(slips);
}

export function raiseFocusedSlip(slips: readonly BeaconSlip[], shownIds: readonly string[], index: number): BeaconSlip[] {
  const id = shownIds[index];
  return id ? raiseStep(slips, id) : readBeaconSlips(slips);
}

export function lowerFocusedSlip(slips: readonly BeaconSlip[], shownIds: readonly string[], index: number): BeaconSlip[] {
  const id = shownIds[index];
  return id ? lowerStep(slips, id) : readBeaconSlips(slips);
}

export function lengthenFocusedSlip(slips: readonly BeaconSlip[], shownIds: readonly string[], index: number): BeaconSlip[] {
  const id = shownIds[index];
  return id ? lengthenSpan(slips, id) : readBeaconSlips(slips);
}

export function shortenFocusedSlip(slips: readonly BeaconSlip[], shownIds: readonly string[], index: number): BeaconSlip[] {
  const id = shownIds[index];
  return id ? shortenSpan(slips, id) : readBeaconSlips(slips);
}

export function bulkBeaconPin(slips: readonly BeaconSlip[], ids: readonly string[]): BeaconSlip[] {
  return touchIds(slips, ids, (slip) => (slip.pinned ? slip : { ...slip, pinned: true, audit: "pin" }));
}

export function bulkBeaconArchive(slips: readonly BeaconSlip[], ids: readonly string[]): BeaconSlip[] {
  return touchIds(slips, ids, (slip) => (slip.archived ? slip : { ...slip, archived: true, held: false, audit: "archive" }));
}

export function bulkBeaconSquall(slips: readonly BeaconSlip[], ids: readonly string[]): BeaconSlip[] {
  return touchIds(slips, ids, (slip) => (slip.fog === "squall" ? slip : { ...slip, fog: "squall", audit: "fog" }));
}

export function bulkBeaconTag(slips: readonly BeaconSlip[], ids: readonly string[], tag: string): BeaconSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBeaconSlips(slips);
  return touchIds(slips, ids, (slip) => {
    if (slip.tags.includes(next) || slip.tags.length >= TAG_CAP) return slip;
    return { ...slip, tags: [...slip.tags, next], audit: "tag" };
  });
}

export function bulkBeaconRuby(slips: readonly BeaconSlip[], ids: readonly string[], glass: unknown): BeaconSlip[] {
  const next = glassOf(glass);
  if (!next) return readBeaconSlips(slips);
  return touchIds(slips, ids, (slip) => (slip.glass === next ? slip : { ...slip, glass: next, audit: "glass" }));
}

export function readBeaconViews(raw: unknown): BeaconView[] {
  if (!Array.isArray(raw)) return [];
  const out: BeaconView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BeaconView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      glass: activeGlass(row.glass),
      fog: activeFog(row.fog, FOGS),
      circuit: activeCircuit(row.circuit),
      span: activeSpan(row.span),
      step: activeStep(row.step),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBeaconView(
  views: readonly BeaconView[],
  view: {
    id: string;
    name: string;
    tray?: unknown;
    query?: string;
    keeper?: string;
    glass?: string;
    fog?: string;
    circuit?: string;
    span?: string;
    step?: string;
  },
): BeaconView[] {
  const current = readBeaconViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: BeaconView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    glass: activeGlass(view.glass),
    fog: activeFog(view.fog, FOGS),
    circuit: activeCircuit(view.circuit),
    span: activeSpan(view.span),
    step: activeStep(view.step),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropBeaconView(views: readonly BeaconView[], id: string): BeaconView[] {
  return readBeaconViews(views).filter((view) => view.id !== id);
}

export function beaconDensity(raw: unknown): SlipDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function beaconSort(raw: unknown): SlipSort {
  return raw === "keeper" ? "keeper" : "circuit";
}

export function lateSlip(slip: BeaconSlip, deskCircuit: unknown): boolean {
  const gap = circuitGap(slip.circuit, deskCircuit);
  return gap !== null && gap > 0;
}

export function idleSlip(slip: BeaconSlip): boolean {
  return slip.fog === "still" && quietCircuit(slip.circuit) && slip.step === 2;
}

export function rushSlip(slip: BeaconSlip): boolean {
  return slip.step === 6 && slip.fog === "squall" && peakCircuit(slip.circuit);
}

export function restingSlip(slip: BeaconSlip): boolean {
  return slip.span === 45 && slip.fog === "haze" && !slip.flagged;
}

/** A fifteen-minute span on a peak circuit is overdue unless the slip is pinned. */
export function overdueSlip(slip: BeaconSlip): boolean {
  return slip.span === 15 && peakCircuit(slip.circuit) && !slip.pinned;
}

export function visibleBeacon(
  slips: readonly BeaconSlip[],
  tray: SlipTray,
  query: string,
  keeper: string,
  glass: string,
  fog: string,
  circuit: string,
  span: string,
  step: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): BeaconSlip[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const glassOn = glass === "all" ? "" : glassOf(glass);
  const fogOn = fog === "all" ? "" : fogOf(fog);
  const circuitOn = circuit === "all" ? "" : activeCircuit(circuit);
  const spanOn = span === "all" ? "" : activeSpan(span);
  const stepOn = step === "all" ? "" : activeStep(step);
  return readBeaconSlips(slips).filter((slip) => {
    if (!inTray(slip, tray)) return false;
    if (text && !`${slip.title} ${slip.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && slip.keeper.toLowerCase() !== keeperOn) return false;
    if (glassOn && slip.glass !== glassOn) return false;
    if (fogOn && slip.fog !== fogOn) return false;
    if (circuitOn === "peak" && !peakCircuit(slip.circuit)) return false;
    if (circuitOn === "quiet" && !quietCircuit(slip.circuit)) return false;
    if (circuitOn && circuitOn !== "peak" && circuitOn !== "quiet" && slip.circuit !== circuitOn) return false;
    if (spanOn && String(slip.span ?? "") !== spanOn) return false;
    if (stepOn && String(slip.step) !== stepOn) return false;
    if (houseOnly && !houseGlass(slip.glass)) return false;
    if (peakOnly && !peakCircuit(slip.circuit)) return false;
    if (quietOnly && !quietCircuit(slip.circuit)) return false;
    return true;
  });
}

export function sortBeacon(slips: readonly BeaconSlip[], sort: SlipSort): BeaconSlip[] {
  return slips.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    }
    const circuit = (circuitIndex(a.circuit) < 0 ? 99 : circuitIndex(a.circuit)) - (circuitIndex(b.circuit) < 0 ? 99 : circuitIndex(b.circuit));
    if (circuit) return circuit;
    return a.title.localeCompare(b.title);
  });
}

export function beaconCounts(slips: readonly BeaconSlip[], shown: readonly BeaconSlip[], deskCircuit: unknown): SlipCounts {
  const open = slips.filter((slip) => inTray(slip, "open"));
  void shown;
  return {
    open: open.length,
    held: slips.filter((slip) => inTray(slip, "held")).length,
    archived: slips.filter((slip) => inTray(slip, "archived")).length,
    pinned: open.filter((slip) => slip.pinned).length,
    peak: open.filter((slip) => peakCircuit(slip.circuit)).length,
    quiet: open.filter((slip) => quietCircuit(slip.circuit)).length,
    soon: open.filter((slip) => slip.span === 15).length,
    step: open.reduce((sum, slip) => sum + slip.step, 0),
    house: open.filter((slip) => houseGlass(slip.glass)).length,
    span: open.filter((slip) => slip.span !== null).length,
    matched: open.filter((slip) => slip.circuit && slip.circuit === circuitOf(deskCircuit)).length,
    flagged: open.filter((slip) => slip.flagged).length,
    idle: open.filter((slip) => idleSlip(slip)).length,
    rush: open.filter((slip) => rushSlip(slip)).length,
    resting: open.filter((slip) => restingSlip(slip)).length,
    overdue: open.filter((slip) => overdueSlip(slip)).length,
  };
}

export function beaconShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function clashCircuitCount(slips: readonly BeaconSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.circuit);
  return open.filter((slip) => open.some((other) => other.id !== slip.id && other.circuit === slip.circuit && other.step === slip.step)).length;
}

export function neighborSlipCount(slips: readonly BeaconSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && stepIndex(slip.step) >= 0);
  return open.filter((slip) => open.some((other) => {
    if (other.id === slip.id) return false;
    const gap = Math.abs(stepIndex(other.step) - stepIndex(slip.step));
    const ring = Math.min(gap, STEP_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(slips: readonly BeaconSlip[]): string {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.keeper);
  let best = "";
  let score = 0;
  for (const slip of open) {
    const count = open.filter((item) => item.keeper.toLowerCase() === slip.keeper.toLowerCase()).length;
    if (count > score) {
      best = slip.keeper;
      score = count;
    }
  }
  return best;
}

export function reminderSlips(slips: readonly BeaconSlip[]): BeaconSlip[] {
  return slips.filter((slip) => inTray(slip, "open") && overdueSlip(slip));
}

export function idleSlips(slips: readonly BeaconSlip[]): BeaconSlip[] {
  return slips.filter((slip) => inTray(slip, "open") && idleSlip(slip));
}

export function beaconTimeline(slips: readonly BeaconSlip[]): { step: number; titles: string[] }[] {
  const open = slips.filter((slip) => inTray(slip, "open"));
  return STEP_CYCLE.map((step) => ({ step, titles: open.filter((slip) => slip.step === step).map((slip) => slip.title) })).filter((lane) => lane.titles.length);
}

export function beaconBars(slips: readonly BeaconSlip[]): { circuit: string; count: number }[] {
  const open = slips.filter((slip) => inTray(slip, "open"));
  return BEACON_CIRCUITS.map((circuit) => ({ circuit, count: open.filter((slip) => slip.circuit === circuit).length }));
}

export function beaconKeepers(slips: readonly BeaconSlip[]): string[] {
  const out: string[] = [];
  for (const slip of slips) {
    if (!slip.keeper || out.some((item) => item.toLowerCase() === slip.keeper.toLowerCase())) continue;
    out.push(slip.keeper);
  }
  return out;
}

export function beaconCopy(slip: BeaconSlip): string {
  return [slip.title, slip.keeper, slip.circuit, slip.glass, slip.fog, slip.span ?? "", slip.step, slip.note].filter((item) => item !== "").join(" · ");
}

export function beaconCsv(slips: readonly BeaconSlip[], deskCircuit: unknown): string {
  const lines = ["title,keeper,circuit,glass,fog,span,step,tags,pinned,held,archived,flagged,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const slip of readBeaconSlips(slips)) {
    const gap = circuitGap(slip.circuit, deskCircuit);
    lines.push([
      csvCell(slip.title),
      csvCell(slip.keeper),
      slip.circuit,
      slip.glass,
      slip.fog,
      slip.span === null ? "" : String(slip.span),
      String(slip.step),
      slip.tags.join(" "),
      slip.pinned ? "1" : "0",
      slip.held ? "1" : "0",
      slip.archived ? "1" : "0",
      slip.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(slip, deskCircuit) ? "1" : "0",
      idleSlip(slip) ? "1" : "0",
      peakCircuit(slip.circuit) ? "1" : "0",
      quietCircuit(slip.circuit) ? "1" : "0",
      houseGlass(slip.glass) ? "1" : "0",
      circuitBand(slip.circuit),
      rushSlip(slip) ? "1" : "0",
      restingSlip(slip) ? "1" : "0",
      overdueSlip(slip) ? "1" : "0",
      slip.audit,
      csvCell(slip.note),
    ].join(","));
  }
  return lines.join("\n");
}

function glyphRecord(raw: GlyphValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function glyphText(raw: GlyphValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = glyphRecord(raw);
  if (!row || !("validationStatus" in row)) return "";
  return clip(row.validationStatus, 24);
}

function hasMoney(raw: GlyphValue): boolean {
  const row = glyphRecord(raw);
  if (!row) return false;
  return MONEY_KEYS.some((key) => row[key] != null && row[key] !== "");
}

function glyphCode(raw: GlyphValue): string {
  if (hasMoney(raw)) return "";
  const text = glyphText(raw).toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9][A-Z0-9_-]{1,15}$/.test(text)) return "";
  return text;
}

/** A money field clears the glyph. A status of two to sixteen marks is set. A short status is clear. */
export function glyphState(raw: GlyphValue): GlyphState {
  if (hasMoney(raw)) return "";
  const row = glyphRecord(raw);
  if (row && !("validationStatus" in row)) return "";
  return glyphCode(raw) ? "set" : "clear";
}

/** The last mark, the first mark, and the length. PENDING is GP7. */
export function glyphStamp(raw: GlyphValue): string {
  const code = glyphState(raw) === "set" ? glyphCode(raw) : "";
  if (!code) return "";
  return `${code.slice(-1)}${code.slice(0, 1)}${code.length}`;
}

/** A long status wins, then a split mark, then a twin start, then a digit, then a vowel, then a short word. */
export function glyphLane(raw: GlyphValue): GlyphLane {
  const code = glyphState(raw) === "set" ? glyphCode(raw) : "";
  if (!code) return "";
  if (code.length >= 12) return "long";
  if (/[-_]/.test(code)) return "split";
  if (code[0] === code[1]) return "twin";
  if (/^\d/.test(code)) return "digit";
  if (/^[AEIOU]/.test(code)) return "vowel";
  if (code.length <= 4) return "brief";
  return "plain";
}

/** Hue follows the first mark. Digits are mist. */
export function glyphHue(raw: GlyphValue): GlyphHue {
  const code = glyphState(raw) === "set" ? glyphCode(raw) : "";
  if (!code) return "";
  const first = code[0];
  if (first >= "0" && first <= "9") return "mist";
  if (first <= "D") return "gilt";
  if (first <= "H") return "slate";
  if (first <= "L") return "sand";
  if (first <= "P") return "clay";
  if (first <= "T") return "soot";
  return "pearl";
}

export function glyphBound(raw: GlyphValue): boolean {
  const code = glyphState(raw) === "set" ? glyphCode(raw) : "";
  return Boolean(code && (code.startsWith("V") || code.startsWith("P")));
}

export function glyphWide(raw: GlyphValue): boolean {
  const code = glyphState(raw) === "set" ? glyphCode(raw) : "";
  return Boolean(code && code.length >= 8);
}

export function glyphNotch(raw: GlyphValue): boolean {
  const code = glyphState(raw) === "set" ? glyphCode(raw) : "";
  return Boolean(code && code.includes("_"));
}

export function glyphStep(raw: GlyphValue): number {
  const code = glyphState(raw) === "set" ? glyphCode(raw) : "";
  if (!code) return 0;
  return Math.min(6, new Set(code.split("")).size);
}

export function glyphJoin(raw: GlyphValue): boolean {
  const code = glyphState(raw) === "set" ? glyphCode(raw) : "";
  return Boolean(code && /(.)\1/.test(code));
}

export function glyphLanes(rows: readonly GlyphRow[]): GlyphLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = glyphLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingGlyph(rows: readonly GlyphRow[]): string {
  const bars = glyphLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingGlyphHue(rows: readonly GlyphRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = glyphHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedGlyphCount(rows: readonly GlyphRow[]): number {
  const marks = rows.map((row) => glyphStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneGlyphCount(rows: readonly GlyphRow[], lane: GlyphLane): number {
  return rows.filter((row) => glyphLane(row.note) === lane).length;
}

export function hueGlyphCount(rows: readonly GlyphRow[], hue: GlyphHue): number {
  return rows.filter((row) => glyphHue(row.note) === hue).length;
}

export function glyphShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentGlyphLanes(rows: readonly GlyphRow[]): string[] {
  return glyphLanes(rows).map((line) => line.lane);
}

export function readHiddenGlyphs(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedGlyphs(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleGlyph(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleGlyphReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGlyphReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGlyphLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleGlyphs(
  rows: readonly GlyphRow[],
  lane: string,
  hue: string,
  query: string,
  review: GlyphReview,
  reviewed: readonly string[],
  shape: GlyphShape,
): GlyphRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (glyphState(row.note) === "") return false;
    const found = glyphLane(row.note);
    const hueName = glyphHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${glyphText(row.note)} ${glyphStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "twin" && found !== "twin") return false;
    if (shape === "wide" && !glyphWide(row.note)) return false;
    if (shape === "bound" && !glyphBound(row.note)) return false;
    if (shape === "notch" && !glyphNotch(row.note)) return false;
    if (shape === "digit" && found !== "digit") return false;
    if (shape === "vowel" && found !== "vowel") return false;
    if (shape === "brief" && found !== "brief") return false;
    return true;
  });
}

export function glyphCopy(raw: GlyphValue): string {
  return [glyphStamp(raw), glyphLane(raw), glyphHue(raw)].filter(Boolean).join(" ");
}

export function glyphLanesCsv(rows: readonly GlyphRow[]): string {
  const lines = ["lane,count"];
  for (const line of glyphLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function glyphRowsCsv(rows: readonly GlyphRow[], reviewed: readonly string[]): string {
  const lines = ["code,stamp,lane,hue,step,join,wide,notch,bound,digit,brief,vowel,twin,split,long,plain,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (glyphState(row.note) !== "set") continue;
    const lane = glyphLane(row.note);
    lines.push([
      csvCell(glyphCode(row.note)),
      glyphStamp(row.note),
      lane,
      glyphHue(row.note),
      String(glyphStep(row.note)),
      glyphJoin(row.note) ? "1" : "0",
      glyphWide(row.note) ? "1" : "0",
      glyphNotch(row.note) ? "1" : "0",
      glyphBound(row.note) ? "1" : "0",
      lane === "digit" ? "1" : "0",
      lane === "brief" ? "1" : "0",
      lane === "vowel" ? "1" : "0",
      lane === "twin" ? "1" : "0",
      lane === "split" ? "1" : "0",
      lane === "long" ? "1" : "0",
      lane === "plain" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
