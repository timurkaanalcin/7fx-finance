/**
 * Quire slips for a reading room's document review, and postmark lanes already stored as a trader phone.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_quire_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   reader text not null default '',
 *   room text not null default '',
 *   ink text not null default '',
 *   stage text not null default '',
 *   wait_min integer,
 *   folio integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   ribbon boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_postmark_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_postmark_review (
 *   trader_id text primary key
 * );
 */

export const QRE_KEY = "crmv4-quire-slip";
export const QRE_VIEW_KEY = "crmv4-quire-views";
export const QRE_DENSITY_KEY = "crmv4-quire-density";
export const PMK_KEY = "crmv4-postmark-hide";
export const PMK_REVIEW_KEY = "crmv4-postmark-review";

export const QUIRE_ROOMS = ["folio", "quire", "vellum", "index", "margin", "colophon"] as const;

export type QuireRoom = (typeof QUIRE_ROOMS)[number];

export type InkName = "blank" | "iron" | "oak" | "soot";

export type StageName = "blank" | "draft" | "fair" | "sealed";

export type SlipTray = "open" | "held" | "archived";

export type SlipDensity = "airy" | "tight";

export type SlipSort = "room" | "reader";

export type QuireSlip = {
  id: string;
  title: string;
  note: string;
  reader: string;
  room: string;
  wait: number | null;
  ink: string;
  stage: string;
  folio: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  ribbon: boolean;
  audit: string;
};

export type QuireView = {
  id: string;
  name: string;
  tray: SlipTray;
  query: string;
  reader: string;
  ink: string;
  stage: string;
  room: string;
  wait: string;
  folio: string;
};

export type SlipCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  folio: number;
  house: number;
  wait: number;
  matched: number;
  ribbon: number;
  idle: number;
  rush: number;
  resting: number;
  overdue: number;
};

export type PostmarkLane = "" | "plus" | "paren" | "dash" | "space" | "short" | "local" | "intl" | "long";

export type PostmarkHue = "" | "gilt" | "slate" | "sand" | "clay" | "soot" | "pearl" | "mist";

export type PostmarkState = "" | "clear" | "set";

export type PostmarkShape = "all" | "plus" | "wide" | "bound" | "notch" | "paren";

export type PostmarkReview = "all" | "reviewed" | "fresh";

export type PostmarkValue = string | { phone?: unknown; line?: unknown; [key: string]: unknown } | null | undefined;

export type PostmarkRow = { id: string; label: string; note: PostmarkValue };

export type PostmarkLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "stage", "pin", "unpin", "hold", "resume", "archive", "open", "ink", "tag", "folio", "wait", "short", "ribbon"] as const;

const INKS = ["iron", "oak", "soot"] as const;

const STAGES = ["draft", "fair", "sealed"] as const;

const STAGE_CYCLE = ["draft", "fair", "sealed"] as const;

const FOLIO_CYCLE = [2, 4, 6, 8] as const;

const WAITS = [15, 30, 45] as const;

const PEAK = new Set(["folio", "colophon"]);

const QUIET = new Set(["margin"]);

const HOUSE = new Set(["IRON", "SOOT"]);

const EARLY = new Set(["folio", "quire"]);

const MID = new Set(["vellum", "index"]);

const LATE = new Set(["margin", "colophon"]);

const LANE_ORDER = ["plus", "paren", "dash", "space", "short", "local", "intl", "long"] as const;

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

function inkName(raw: unknown): Exclude<InkName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<InkName, "blank">) : "";
}

function stageName(raw: unknown): Exclude<StageName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (STAGES as readonly string[]).includes(text) ? (text as Exclude<StageName, "blank">) : "";
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

function inTray(slip: QuireSlip, tray: SlipTray): boolean {
  if (tray === "held") return slip.held && !slip.archived;
  if (tray === "archived") return slip.archived;
  return !slip.held && !slip.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function roomIndex(room: string): number {
  return QUIRE_ROOMS.indexOf(room as QuireRoom);
}

function folioIndex(folio: number): number {
  return FOLIO_CYCLE.indexOf(folio as (typeof FOLIO_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function slipLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function slipNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A room outside the six reading rooms is left blank. */
export function roomOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (QUIRE_ROOMS as readonly string[]).includes(text) ? text : "";
}

/** The review timer is 15, 30, or 45 minutes. Anything else stays blank. */
export function waitOf(raw: unknown): 15 | 30 | 45 | null {
  const text = clip(raw, 2);
  const value = Number(text);
  return (WAITS as readonly number[]).includes(value) ? (value as 15 | 30 | 45) : null;
}

/** Folio is 2, 4, 6, or 8. Anything else stays blank. */
export function folioOf(raw: unknown): 2 | 4 | 6 | 8 | null {
  const value = Number(clip(raw, 1));
  return (FOLIO_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 6 | 8) : null;
}

/** Ink is iron, oak, or soot. The saved ink is IRON, OAK, or SOOT. */
export function inkOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "iron") return "IRON";
  if (text === "oak") return "OAK";
  if (text === "soot") return "SOOT";
  return "";
}

/** Stage is draft, fair, or sealed. A blank stage stays blank. */
export function stageOf(raw: unknown): string {
  return stageName(raw);
}

export function peakRoom(room: unknown): boolean {
  return PEAK.has(roomOf(room));
}

export function quietRoom(room: unknown): boolean {
  return QUIET.has(roomOf(room));
}

/** Early is folio and quire. Mid is vellum and index. Late is margin and colophon. */
export function roomBand(room: unknown): "early" | "mid" | "late" | "" {
  const name = roomOf(room);
  if (EARLY.has(name)) return "early";
  if (MID.has(name)) return "mid";
  if (LATE.has(name)) return "late";
  return "";
}

/** Steps from the slip room to the desk room. A blank room has no gap. */
export function roomGap(slipRoom: unknown, deskRoom: unknown): number | null {
  const from = roomIndex(roomOf(slipRoom));
  const to = roomIndex(roomOf(deskRoom));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseInk(ink: unknown): boolean {
  return HOUSE.has(inkOf(ink));
}

export function activeRoom(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return roomOf(text) || "all";
}

export function activeWait(raw: unknown): string {
  const value = waitOf(raw);
  return value === null ? "all" : String(value);
}

export function activeStage(raw: unknown, stages: readonly string[]): string {
  const stage = stageOf(raw);
  return stage && stages.includes(stage) ? stage : "all";
}

export function activeFolio(raw: unknown): string {
  const value = folioOf(raw);
  return value === null ? "all" : String(value);
}

export function activeInk(raw: unknown): string {
  const name = inkName(raw);
  return name || "all";
}

export function moveQuireFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestInk(slips: readonly QuireSlip[]): string {
  const counts = new Map<string, number>();
  for (const slip of slips) {
    if (!slip.ink) continue;
    counts.set(slip.ink, (counts.get(slip.ink) || 0) + 1);
  }
  let best = "IRON";
  let score = 0;
  for (const ink of ["IRON", "OAK", "SOOT"]) {
    const count = counts.get(ink) || 0;
    if (count > score) {
      best = ink;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short review. An evening desk asks for a long one. A tie among saved slips keeps 30. */
export function suggestWait(slips: readonly QuireSlip[], hour: number): 15 | 30 | 45 {
  const counts = new Map<number, number>();
  for (const slip of slips) {
    if (slip.wait === null) continue;
    counts.set(slip.wait, (counts.get(slip.wait) || 0) + 1);
  }
  let best: 15 | 30 | 45 | null = null;
  let score = 0;
  for (const wait of WAITS) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 7) return 15;
  if (hour >= 17) return 45;
  return 30;
}

/** The reader with the fewest open slips. A tie keeps the roster order. */
export function fairReader(slips: readonly QuireSlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = slips.filter((slip) => inTray(slip, "open"));
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((slip) => slip.reader.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readQuireSlips(raw: unknown): QuireSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: QuireSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<QuireSlip>;
    const id = clip(row.id, 40);
    const title = slipLine(row.title);
    if (!id || !title || out.some((slip) => slip.id === id || slip.title === title)) continue;
    out.push({
      id,
      title,
      note: slipNote(row.note),
      reader: clip(row.reader, 24),
      room: roomOf(row.room),
      wait: waitOf(row.wait),
      ink: inkOf(row.ink),
      stage: stageOf(row.stage),
      folio: folioOf(row.folio) ?? 2,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      archived: row.archived === true,
      ribbon: row.ribbon === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, SLIP_CAP);
}

export function addQuireSlip(
  slips: readonly QuireSlip[],
  slip: {
    id: string;
    title: string;
    note?: string;
    reader?: string;
    room?: unknown;
    ink?: string;
    stage?: string;
    wait?: unknown;
    folio?: unknown;
    tags?: unknown;
  },
): QuireSlip[] {
  const current = readQuireSlips(slips);
  const id = clip(slip.id, 40);
  const title = slipLine(slip.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: QuireSlip = {
    id,
    title,
    note: slipNote(slip.note),
    reader: clip(slip.reader, 24),
    room: roomOf(slip.room),
    wait: waitOf(slip.wait),
    ink: inkOf(slip.ink),
    stage: stageOf(slip.stage),
    folio: folioOf(slip.folio) ?? 2,
    tags: tagsOf(slip.tags),
    pinned: false,
    held: false,
    archived: false,
    ribbon: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLIP_CAP);
}

function mapSlip(slips: readonly QuireSlip[], id: string, change: (slip: QuireSlip) => QuireSlip): QuireSlip[] {
  return readQuireSlips(slips).map((slip) => (slip.id === id ? change(slip) : slip));
}

export function editQuire(slips: readonly QuireSlip[], id: string, title: string): QuireSlip[] {
  const next = slipLine(title);
  if (!next) return readQuireSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.title === next ? slip : { ...slip, title: next, audit: "edit" }));
}

export function editQuireNote(slips: readonly QuireSlip[], id: string, note: string): QuireSlip[] {
  const next = slipNote(note);
  return mapSlip(slips, id, (slip) => (slip.note === next ? slip : { ...slip, note: next, audit: "note" }));
}

export function setSlipPin(slips: readonly QuireSlip[], id: string, pinned: boolean): QuireSlip[] {
  return mapSlip(slips, id, (slip) => (slip.pinned === pinned ? slip : { ...slip, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setSlipHold(slips: readonly QuireSlip[], id: string, held: boolean): QuireSlip[] {
  return mapSlip(slips, id, (slip) => (slip.held === held || slip.archived ? slip : { ...slip, held, audit: held ? "hold" : "resume" }));
}

export function setSlipArchive(slips: readonly QuireSlip[], id: string, archived: boolean): QuireSlip[] {
  return mapSlip(slips, id, (slip) => (slip.archived === archived ? slip : { ...slip, archived, held: archived ? false : slip.held, audit: archived ? "archive" : "open" }));
}

export function setSlipRibbon(slips: readonly QuireSlip[], id: string, ribbon: boolean): QuireSlip[] {
  return mapSlip(slips, id, (slip) => (slip.ribbon === ribbon ? slip : { ...slip, ribbon, audit: "ribbon" }));
}

export function setSlipFolio(slips: readonly QuireSlip[], id: string, folio: unknown): QuireSlip[] {
  const next = folioOf(folio);
  if (next === null) return readQuireSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.folio === next ? slip : { ...slip, folio: next, audit: "folio" }));
}

export function setSlipInk(slips: readonly QuireSlip[], id: string, ink: unknown): QuireSlip[] {
  const next = inkOf(ink);
  if (!next) return readQuireSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.ink === next ? slip : { ...slip, ink: next, audit: "ink" }));
}

/** Stage steps draft, fair, sealed, then draft again. A blank stage starts at draft. */
export function cycleStage(slips: readonly QuireSlip[], id: string): QuireSlip[] {
  return mapSlip(slips, id, (slip) => {
    const at = STAGE_CYCLE.indexOf(slip.stage as (typeof STAGE_CYCLE)[number]);
    const next = at < 0 ? STAGE_CYCLE[0] : STAGE_CYCLE[(at + 1) % STAGE_CYCLE.length];
    return next === slip.stage ? slip : { ...slip, stage: next, audit: "stage" };
  });
}

export function addQuireTag(slips: readonly QuireSlip[], id: string, tag: string): QuireSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readQuireSlips(slips);
  return mapSlip(slips, id, (slip) => {
    if (slip.tags.includes(next) || slip.tags.length >= TAG_CAP) return slip;
    return { ...slip, tags: [...slip.tags, next], audit: "tag" };
  });
}

/** A blank wait becomes 15, 15 becomes 30, and 30 becomes 45. A wait of 45 stays. */
export function lengthenWait(slips: readonly QuireSlip[], id: string): QuireSlip[] {
  return mapSlip(slips, id, (slip) => {
    if (slip.wait === 45) return slip;
    const next = slip.wait === 30 ? 45 : slip.wait === 15 ? 30 : 15;
    return { ...slip, wait: next, audit: "wait" };
  });
}

/** A blank wait becomes 45, 45 becomes 30, and 30 becomes 15. A wait of 15 stays. */
export function shortenWait(slips: readonly QuireSlip[], id: string): QuireSlip[] {
  return mapSlip(slips, id, (slip) => {
    if (slip.wait === 15) return slip;
    const next = slip.wait === 30 ? 15 : slip.wait === 45 ? 30 : 45;
    return { ...slip, wait: next, audit: "short" };
  });
}

export function raiseFolio(slips: readonly QuireSlip[], id: string): QuireSlip[] {
  return mapSlip(slips, id, (slip) => {
    const at = folioIndex(slip.folio);
    const next = at < 0 ? FOLIO_CYCLE[0] : FOLIO_CYCLE[(at + 1) % FOLIO_CYCLE.length];
    return next === slip.folio ? slip : { ...slip, folio: next, audit: "folio" };
  });
}

export function lowerFolio(slips: readonly QuireSlip[], id: string): QuireSlip[] {
  return mapSlip(slips, id, (slip) => {
    const at = folioIndex(slip.folio);
    const next = at < 0 ? FOLIO_CYCLE[0] : FOLIO_CYCLE[(at + FOLIO_CYCLE.length - 1) % FOLIO_CYCLE.length];
    return next === slip.folio ? slip : { ...slip, folio: next, audit: "folio" };
  });
}

function focusedSlip(slips: readonly QuireSlip[], shownIds: readonly string[], index: number): QuireSlip | undefined {
  const id = shownIds[index];
  return id ? readQuireSlips(slips).find((item) => item.id === id) : undefined;
}

export function pinFocusedSlip(slips: readonly QuireSlip[], shownIds: readonly string[], index: number): QuireSlip[] {
  const slip = focusedSlip(slips, shownIds, index);
  if (!slip) return readQuireSlips(slips);
  return setSlipPin(slips, slip.id, !slip.pinned);
}

export function holdFocusedSlip(slips: readonly QuireSlip[], shownIds: readonly string[], index: number): QuireSlip[] {
  const slip = focusedSlip(slips, shownIds, index);
  if (!slip) return readQuireSlips(slips);
  return setSlipHold(slips, slip.id, !slip.held);
}

export function stageFocusedSlip(slips: readonly QuireSlip[], shownIds: readonly string[], index: number): QuireSlip[] {
  const id = shownIds[index];
  return id ? cycleStage(slips, id) : readQuireSlips(slips);
}

export function ribbonFocusedSlip(slips: readonly QuireSlip[], shownIds: readonly string[], index: number): QuireSlip[] {
  const slip = focusedSlip(slips, shownIds, index);
  if (!slip) return readQuireSlips(slips);
  return setSlipRibbon(slips, slip.id, !slip.ribbon);
}

export function tagFocusedSlip(slips: readonly QuireSlip[], shownIds: readonly string[], index: number, tag: string): QuireSlip[] {
  const id = shownIds[index];
  return id ? addQuireTag(slips, id, tag) : readQuireSlips(slips);
}

export function raiseFocusedSlip(slips: readonly QuireSlip[], shownIds: readonly string[], index: number): QuireSlip[] {
  const id = shownIds[index];
  return id ? raiseFolio(slips, id) : readQuireSlips(slips);
}

export function lowerFocusedSlip(slips: readonly QuireSlip[], shownIds: readonly string[], index: number): QuireSlip[] {
  const id = shownIds[index];
  return id ? lowerFolio(slips, id) : readQuireSlips(slips);
}

export function lengthenFocusedSlip(slips: readonly QuireSlip[], shownIds: readonly string[], index: number): QuireSlip[] {
  const id = shownIds[index];
  return id ? lengthenWait(slips, id) : readQuireSlips(slips);
}

export function shortenFocusedSlip(slips: readonly QuireSlip[], shownIds: readonly string[], index: number): QuireSlip[] {
  const id = shownIds[index];
  return id ? shortenWait(slips, id) : readQuireSlips(slips);
}

function touchIds(slips: readonly QuireSlip[], ids: readonly string[], change: (slip: QuireSlip) => QuireSlip): QuireSlip[] {
  const want = new Set(ids);
  return readQuireSlips(slips).map((slip) => (want.has(slip.id) ? change(slip) : slip));
}

export function bulkQuirePin(slips: readonly QuireSlip[], ids: readonly string[]): QuireSlip[] {
  return touchIds(slips, ids, (slip) => (slip.pinned ? slip : { ...slip, pinned: true, audit: "pin" }));
}

export function bulkQuireArchive(slips: readonly QuireSlip[], ids: readonly string[]): QuireSlip[] {
  return touchIds(slips, ids, (slip) => (slip.archived ? slip : { ...slip, archived: true, held: false, audit: "archive" }));
}

export function bulkQuireSeal(slips: readonly QuireSlip[], ids: readonly string[]): QuireSlip[] {
  return touchIds(slips, ids, (slip) => (slip.stage === "sealed" ? slip : { ...slip, stage: "sealed", audit: "stage" }));
}

export function bulkQuireTag(slips: readonly QuireSlip[], ids: readonly string[], tag: string): QuireSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readQuireSlips(slips);
  return touchIds(slips, ids, (slip) => {
    if (slip.tags.includes(next) || slip.tags.length >= TAG_CAP) return slip;
    return { ...slip, tags: [...slip.tags, next], audit: "tag" };
  });
}

export function bulkQuireInk(slips: readonly QuireSlip[], ids: readonly string[], ink: unknown): QuireSlip[] {
  const next = inkOf(ink);
  if (!next) return readQuireSlips(slips);
  return touchIds(slips, ids, (slip) => (slip.ink === next ? slip : { ...slip, ink: next, audit: "ink" }));
}

export function readQuireViews(raw: unknown): QuireView[] {
  if (!Array.isArray(raw)) return [];
  const out: QuireView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<QuireView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      reader: clip(row.reader, 24),
      ink: activeInk(row.ink),
      stage: activeStage(row.stage, STAGES),
      room: activeRoom(row.room),
      wait: activeWait(row.wait),
      folio: activeFolio(row.folio),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addQuireView(
  views: readonly QuireView[],
  view: {
    id: string;
    name: string;
    tray?: unknown;
    query?: string;
    reader?: string;
    ink?: string;
    stage?: string;
    room?: string;
    wait?: string;
    folio?: string;
  },
): QuireView[] {
  const current = readQuireViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    reader: clip(view.reader, 24),
    ink: activeInk(view.ink),
    stage: activeStage(view.stage, STAGES),
    room: activeRoom(view.room),
    wait: activeWait(view.wait),
    folio: activeFolio(view.folio),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropQuireView(views: readonly QuireView[], id: string): QuireView[] {
  return readQuireViews(views).filter((view) => view.id !== id);
}

export function quireDensity(raw: unknown): SlipDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function quireSort(raw: unknown): SlipSort {
  return raw === "reader" ? "reader" : "room";
}

export function lateSlip(slip: QuireSlip, deskRoom: unknown): boolean {
  const gap = roomGap(slip.room, deskRoom);
  return gap !== null && gap > 0;
}

export function idleSlip(slip: QuireSlip): boolean {
  return slip.stage === "sealed" && quietRoom(slip.room) && slip.folio === 2;
}

export function rushSlip(slip: QuireSlip): boolean {
  return slip.folio === 6 && slip.stage === "draft" && peakRoom(slip.room);
}

export function restingSlip(slip: QuireSlip): boolean {
  return slip.wait === 45 && slip.stage === "fair" && !slip.ribbon;
}

/** A fifteen-minute wait on a peak room is overdue unless the slip is pinned. */
export function overdueSlip(slip: QuireSlip): boolean {
  return slip.wait === 15 && peakRoom(slip.room) && !slip.pinned;
}

export function visibleQuire(
  slips: readonly QuireSlip[],
  tray: SlipTray,
  query: string,
  reader: string,
  ink: string,
  stage: string,
  room: string,
  wait: string,
  folio: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): QuireSlip[] {
  const text = query.trim().toLowerCase();
  const readerOn = reader === "all" ? "" : reader.trim().toLowerCase();
  const inkOn = ink === "all" ? "" : inkOf(ink);
  const stageOn = stage === "all" ? "" : stageOf(stage);
  const roomOn = room === "all" ? "" : activeRoom(room);
  const waitOn = wait === "all" ? "" : activeWait(wait);
  const folioOn = folio === "all" ? "" : activeFolio(folio);
  return readQuireSlips(slips).filter((slip) => {
    if (!inTray(slip, tray)) return false;
    if (text && !`${slip.title} ${slip.note}`.toLowerCase().includes(text)) return false;
    if (readerOn && slip.reader.toLowerCase() !== readerOn) return false;
    if (inkOn && slip.ink !== inkOn) return false;
    if (stageOn && slip.stage !== stageOn) return false;
    if (roomOn === "peak" && !peakRoom(slip.room)) return false;
    if (roomOn === "quiet" && !quietRoom(slip.room)) return false;
    if (roomOn && roomOn !== "peak" && roomOn !== "quiet" && slip.room !== roomOn) return false;
    if (waitOn && String(slip.wait ?? "") !== waitOn) return false;
    if (folioOn && String(slip.folio) !== folioOn) return false;
    if (houseOnly && !houseInk(slip.ink)) return false;
    if (peakOnly && !peakRoom(slip.room)) return false;
    if (quietOnly && !quietRoom(slip.room)) return false;
    return true;
  });
}

export function sortQuire(slips: readonly QuireSlip[], sort: SlipSort): QuireSlip[] {
  return slips.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "reader") {
      const reader = a.reader.localeCompare(b.reader);
      if (reader) return reader;
    }
    const room = (roomIndex(a.room) < 0 ? 99 : roomIndex(a.room)) - (roomIndex(b.room) < 0 ? 99 : roomIndex(b.room));
    if (room) return room;
    return a.title.localeCompare(b.title);
  });
}

export function quireCounts(slips: readonly QuireSlip[], shown: readonly QuireSlip[], deskRoom: unknown): SlipCounts {
  const open = slips.filter((slip) => inTray(slip, "open"));
  void shown;
  return {
    open: open.length,
    held: slips.filter((slip) => inTray(slip, "held")).length,
    archived: slips.filter((slip) => inTray(slip, "archived")).length,
    pinned: open.filter((slip) => slip.pinned).length,
    peak: open.filter((slip) => peakRoom(slip.room)).length,
    quiet: open.filter((slip) => quietRoom(slip.room)).length,
    soon: open.filter((slip) => slip.wait === 15).length,
    folio: open.reduce((sum, slip) => sum + slip.folio, 0),
    house: open.filter((slip) => houseInk(slip.ink)).length,
    wait: open.filter((slip) => slip.wait !== null).length,
    matched: open.filter((slip) => slip.room && slip.room === roomOf(deskRoom)).length,
    ribbon: open.filter((slip) => slip.ribbon).length,
    idle: open.filter((slip) => idleSlip(slip)).length,
    rush: open.filter((slip) => rushSlip(slip)).length,
    resting: open.filter((slip) => restingSlip(slip)).length,
    overdue: open.filter((slip) => overdueSlip(slip)).length,
  };
}

export function quireShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function clashRoomCount(slips: readonly QuireSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.room);
  return open.filter((slip) => open.some((other) => other.id !== slip.id && other.room === slip.room && other.folio === slip.folio)).length;
}

export function waitClashCount(slips: readonly QuireSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.room && slip.wait !== null);
  return open.filter((slip) => open.some((other) => other.id !== slip.id && other.room === slip.room && other.wait === slip.wait)).length;
}

export function neighborSlipCount(slips: readonly QuireSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && folioIndex(slip.folio) >= 0);
  return open.filter((slip) => open.some((other) => {
    if (other.id === slip.id) return false;
    const gap = Math.abs(folioIndex(other.folio) - folioIndex(slip.folio));
    const ring = Math.min(gap, FOLIO_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestReader(slips: readonly QuireSlip[]): string {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.reader);
  let best = "";
  let score = 0;
  for (const slip of open) {
    const count = open.filter((item) => item.reader.toLowerCase() === slip.reader.toLowerCase()).length;
    if (count > score) {
      best = slip.reader;
      score = count;
    }
  }
  return best;
}

export function pairReaderCount(slips: readonly QuireSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.reader);
  return open.filter((slip) => open.filter((item) => item.reader.toLowerCase() === slip.reader.toLowerCase()).length >= 2).length;
}

export function folioLoad(slips: readonly QuireSlip[]): number {
  return slips.filter((slip) => inTray(slip, "open")).reduce((sum, slip) => sum + slip.folio, 0);
}

export function reminderSlips(slips: readonly QuireSlip[]): QuireSlip[] {
  return slips.filter((slip) => inTray(slip, "open") && overdueSlip(slip));
}

export function idleSlips(slips: readonly QuireSlip[]): QuireSlip[] {
  return slips.filter((slip) => inTray(slip, "open") && idleSlip(slip));
}

export function matchedSlips(slips: readonly QuireSlip[], deskRoom: unknown): QuireSlip[] {
  const room = roomOf(deskRoom);
  if (!room) return [];
  return slips.filter((slip) => inTray(slip, "open") && slip.room === room);
}

export function nextSlip(slips: readonly QuireSlip[], id: string): QuireSlip | null {
  const open = sortQuire(slips.filter((slip) => inTray(slip, "open")), "room");
  const at = open.findIndex((slip) => slip.id === id);
  if (at < 0) return null;
  return open[at + 1] || null;
}

export function quireTimeline(slips: readonly QuireSlip[]): { folio: number; titles: string[] }[] {
  const open = slips.filter((slip) => inTray(slip, "open"));
  return FOLIO_CYCLE.map((folio) => ({ folio, titles: open.filter((slip) => slip.folio === folio).map((slip) => slip.title) })).filter((lane) => lane.titles.length);
}

export function quireReaders(slips: readonly QuireSlip[]): string[] {
  const out: string[] = [];
  for (const slip of slips) {
    if (!slip.reader || out.some((item) => item.toLowerCase() === slip.reader.toLowerCase())) continue;
    out.push(slip.reader);
  }
  return out;
}

export function quireCopy(slip: QuireSlip): string {
  return [slip.title, slip.reader, slip.room, slip.ink, slip.stage, slip.wait ?? "", slip.folio, slip.note].filter((item) => item !== "").join(" · ");
}

export function quireCsv(slips: readonly QuireSlip[], deskRoom: unknown): string {
  const lines = ["title,reader,room,ink,stage,wait,folio,tags,pinned,held,archived,ribbon,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const slip of readQuireSlips(slips)) {
    const gap = roomGap(slip.room, deskRoom);
    lines.push([
      csvCell(slip.title),
      csvCell(slip.reader),
      slip.room,
      slip.ink,
      slip.stage,
      slip.wait === null ? "" : String(slip.wait),
      String(slip.folio),
      slip.tags.join(" "),
      slip.pinned ? "1" : "0",
      slip.held ? "1" : "0",
      slip.archived ? "1" : "0",
      slip.ribbon ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(slip, deskRoom) ? "1" : "0",
      idleSlip(slip) ? "1" : "0",
      peakRoom(slip.room) ? "1" : "0",
      quietRoom(slip.room) ? "1" : "0",
      houseInk(slip.ink) ? "1" : "0",
      roomBand(slip.room),
      rushSlip(slip) ? "1" : "0",
      restingSlip(slip) ? "1" : "0",
      overdueSlip(slip) ? "1" : "0",
      slip.audit,
      csvCell(slip.note),
    ].join(","));
  }
  return lines.join("\n");
}

function postmarkRecord(raw: PostmarkValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function postmarkText(raw: PostmarkValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = postmarkRecord(raw);
  if (!row) return "";
  return clip(row.phone ?? row.line, 40);
}

function postmarkDigits(raw: PostmarkValue): string {
  return postmarkText(raw).replace(/\D/g, "");
}

function hasMoney(raw: PostmarkValue): boolean {
  const row = postmarkRecord(raw);
  if (!row) return false;
  return MONEY_KEYS.some((key) => row[key] != null && row[key] !== "");
}

/** A money field clears the mark. Six digits or more are set. A short or blank phone is clear. */
export function postmarkState(raw: PostmarkValue): PostmarkState {
  if (hasMoney(raw)) return "";
  const digits = postmarkDigits(raw);
  if (!digits) return "clear";
  return digits.length >= 6 ? "set" : "clear";
}

/** The first two digits plus the digit count. +90 532 111 22 33 is 9012. */
export function postmarkStamp(raw: PostmarkValue): string {
  if (postmarkState(raw) !== "set") return "";
  const digits = postmarkDigits(raw);
  return `${digits.slice(0, 2)}${digits.length}`;
}

/** Parentheses are a city line. A hyphen is a dash. A leading plus is international. Spaces are a spaced line. */
export function postmarkLane(raw: PostmarkValue): PostmarkLane {
  if (postmarkState(raw) !== "set") return "";
  const text = postmarkText(raw);
  const digits = postmarkDigits(raw);
  if (text.includes("(") && text.includes(")")) return "paren";
  if (text.includes("-")) return "dash";
  if (text.startsWith("+")) return "plus";
  if (/\s/.test(text)) return "space";
  if (digits.length <= 7) return "short";
  if (digits.length === 10) return "local";
  if (digits.length >= 13) return "intl";
  return "long";
}

/** Hue follows the last digit. An x is pearl. A star is mist. */
export function postmarkHue(raw: PostmarkValue): PostmarkHue {
  if (postmarkState(raw) !== "set") return "";
  const text = postmarkText(raw);
  if (/[xX]/.test(text)) return "pearl";
  if (text.includes("*")) return "mist";
  const digits = postmarkDigits(raw);
  const last = Number(digits[digits.length - 1]);
  if (!Number.isFinite(last)) return "mist";
  if (last <= 1) return "gilt";
  if (last <= 3) return "slate";
  if (last <= 5) return "sand";
  return last <= 7 ? "clay" : "soot";
}

export function postmarkBound(raw: PostmarkValue): boolean {
  if (postmarkState(raw) !== "set") return false;
  const first = postmarkDigits(raw)[0];
  return first === "1" || first === "4" || first === "9";
}

export function postmarkWide(raw: PostmarkValue): boolean {
  return postmarkState(raw) === "set" && postmarkDigits(raw).length >= 12;
}

export function postmarkNotch(raw: PostmarkValue): boolean {
  return postmarkText(raw).includes("-");
}

export function postmarkStep(raw: PostmarkValue): number {
  if (postmarkState(raw) !== "set") return 0;
  return Math.min(6, new Set(postmarkDigits(raw).split("")).size);
}

export function postmarkJoin(raw: PostmarkValue): boolean {
  return postmarkText(raw).startsWith("+");
}

export function postmarkLanes(rows: readonly PostmarkRow[]): PostmarkLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = postmarkLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPostmark(rows: readonly PostmarkRow[]): string {
  const bars = postmarkLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingPostmarkHue(rows: readonly PostmarkRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = postmarkHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedPostmarkCount(rows: readonly PostmarkRow[]): number {
  const marks = rows.map((row) => postmarkStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function lanePostmarkCount(rows: readonly PostmarkRow[], lane: PostmarkLane): number {
  return rows.filter((row) => postmarkLane(row.note) === lane).length;
}

export function huePostmarkCount(rows: readonly PostmarkRow[], hue: PostmarkHue): number {
  return rows.filter((row) => postmarkHue(row.note) === hue).length;
}

export function postmarkShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPostmarkLanes(rows: readonly PostmarkRow[]): string[] {
  return postmarkLanes(rows).map((line) => line.lane);
}

export function readHiddenPostmarks(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedPostmarks(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePostmark(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePostmarkReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPostmarkReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePostmarkLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visiblePostmarks(
  rows: readonly PostmarkRow[],
  lane: string,
  hue: string,
  query: string,
  review: PostmarkReview,
  reviewed: readonly string[],
  shape: PostmarkShape,
): PostmarkRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (postmarkState(row.note) === "") return false;
    const found = postmarkLane(row.note);
    const hueName = postmarkHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${postmarkText(row.note)} ${postmarkStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "plus" && found !== "plus") return false;
    if (shape === "wide" && !postmarkWide(row.note)) return false;
    if (shape === "bound" && !postmarkBound(row.note)) return false;
    if (shape === "notch" && !postmarkNotch(row.note)) return false;
    if (shape === "paren" && found !== "paren") return false;
    return true;
  });
}

export function postmarkCopy(raw: PostmarkValue): string {
  return [postmarkStamp(raw), postmarkLane(raw), postmarkHue(raw)].filter(Boolean).join(" ");
}

export function postmarkLanesCsv(rows: readonly PostmarkRow[]): string {
  const lines = ["lane,count"];
  for (const line of postmarkLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function postmarkRowsCsv(rows: readonly PostmarkRow[], reviewed: readonly string[]): string {
  const lines = ["phone,stamp,lane,hue,step,join,wide,notch,bound,plus,paren,dash,space,short,local,intl,long,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (postmarkState(row.note) !== "set") continue;
    const lane = postmarkLane(row.note);
    lines.push([
      csvCell(postmarkText(row.note)),
      postmarkStamp(row.note),
      lane,
      postmarkHue(row.note),
      String(postmarkStep(row.note)),
      postmarkJoin(row.note) ? "1" : "0",
      postmarkWide(row.note) ? "1" : "0",
      postmarkNotch(row.note) ? "1" : "0",
      postmarkBound(row.note) ? "1" : "0",
      lane === "plus" ? "1" : "0",
      lane === "paren" ? "1" : "0",
      lane === "dash" ? "1" : "0",
      lane === "space" ? "1" : "0",
      lane === "short" ? "1" : "0",
      lane === "local" ? "1" : "0",
      lane === "intl" ? "1" : "0",
      lane === "long" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
