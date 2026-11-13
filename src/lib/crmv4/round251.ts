/**
 * Lectern leaves for a retention reading desk, and cameo plates already stored as a trader sale status.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_lectern_leaf (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   reader text not null default '',
 *   folio text not null default '',
 *   ink text not null default '',
 *   pace text not null default '',
 *   margin_min integer,
 *   quire integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   shelved boolean not null default false,
 *   flagged boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_cameo_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_cameo_review (
 *   trader_id text primary key
 * );
 */

export const LCT_KEY = "crmv4-lectern-leaf";
export const LCT_VIEW_KEY = "crmv4-lectern-views";
export const LCT_DENSITY_KEY = "crmv4-lectern-density";
export const CMO_KEY = "crmv4-cameo-hide";
export const CMO_REVIEW_KEY = "crmv4-cameo-review";

export const LECTERN_FOLIOS = ["preface", "chapter", "margin", "index", "colophon", "errata"] as const;

export type LecternFolio = (typeof LECTERN_FOLIOS)[number];

export type InkName = "blank" | "iron" | "oak" | "soot";

export type PaceName = "blank" | "calm" | "even" | "brisk";

export type LeafTray = "open" | "held" | "shelved";

export type LeafDensity = "airy" | "tight";

export type LeafSort = "folio" | "reader";

export type LecternLeaf = {
  id: string;
  title: string;
  note: string;
  reader: string;
  folio: string;
  margin: number | null;
  ink: string;
  pace: string;
  quire: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  shelved: boolean;
  flagged: boolean;
  audit: string;
};

export type LeafView = {
  id: string;
  name: string;
  tray: LeafTray;
  query: string;
  reader: string;
  ink: string;
  pace: string;
  folio: string;
  margin: string;
  quire: string;
};

export type LeafCounts = {
  open: number;
  held: number;
  shelved: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  quire: number;
  house: number;
  margin: number;
  matched: number;
  flagged: number;
  idle: number;
  rush: number;
  resting: number;
  overdue: number;
};

export type CameoLane = "" | "figure" | "short" | "open" | "pair" | "break" | "scroll" | "plain";

export type CameoHue = "" | "ivory" | "graphite" | "champagne" | "ink" | "vellum" | "ash" | "bronze";

export type CameoState = "" | "clear" | "set";

export type CameoShape = "all" | "pair" | "wide" | "bound" | "notch" | "figure" | "open" | "short";

export type CameoReview = "all" | "reviewed" | "fresh";

export type CameoValue = string | { saleStatus?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type CameoRow = { id: string; label: string; note: CameoValue };

export type CameoLaneLine = { lane: string; count: number };

export const ROUND251_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "hold",
  "shelve",
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
  "fair-reader",
  "viewer",
  "suggest",
  "cameos",
  "cameo-review",
  "cameo-csv",
] as const;

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "shelve", "open", "ink", "tag", "quire", "margin", "short", "flag"] as const;

const INKS = ["iron", "oak", "soot"] as const;

const PACES = ["calm", "even", "brisk"] as const;

const PACE_CYCLE = ["calm", "even", "brisk"] as const;

const QUIRE_CYCLE = [1, 3, 5, 7] as const;

const MARGINS = [12, 24, 36] as const;

const PEAK = new Set(["preface", "colophon"]);

const QUIET = new Set(["margin", "errata"]);

const HOUSE = new Set(["IRON", "OAK"]);

const EARLY = new Set(["preface", "chapter"]);

const MID = new Set(["margin", "index"]);

const LATE = new Set(["colophon", "errata"]);

const LANE_ORDER = ["figure", "short", "open", "pair", "break", "scroll", "plain"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne", "ink", "vellum", "ash", "bronze"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const LEAF_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LeafTray {
  return raw === "held" || raw === "shelved" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<InkName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<InkName, "blank">) : "";
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
    if (!/^[xyz]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(leaf: LecternLeaf, tray: LeafTray): boolean {
  if (tray === "held") return leaf.held && !leaf.shelved;
  if (tray === "shelved") return leaf.shelved;
  return !leaf.held && !leaf.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function folioIndex(folio: string): number {
  return LECTERN_FOLIOS.indexOf(folio as LecternFolio);
}

function quireIndex(quire: number): number {
  return QUIRE_CYCLE.indexOf(quire as (typeof QUIRE_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function leafLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function leafNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A folio outside the six gatherings is left blank. */
export function folioOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (LECTERN_FOLIOS as readonly string[]).includes(text) ? text : "";
}

/** The SLA timer is 12, 24, or 36 minutes. Anything else stays blank. */
export function marginOf(raw: unknown): 12 | 24 | 36 | null {
  const value = Number(clip(raw, 2));
  return (MARGINS as readonly number[]).includes(value) ? (value as 12 | 24 | 36) : null;
}

/** Quire is 1, 3, 5, or 7. Anything else stays blank. */
export function quireOf(raw: unknown): 1 | 3 | 5 | 7 | null {
  const value = Number(clip(raw, 1));
  return (QUIRE_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 7) : null;
}

/** Ink is iron, oak, or soot. The saved ink is IRON, OAK, or SOOT. */
export function inkOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "iron") return "IRON";
  if (text === "oak") return "OAK";
  if (text === "soot") return "SOOT";
  return "";
}

/** Pace is calm, even, or brisk. A blank pace stays blank. */
export function paceOf(raw: unknown): string {
  return paceName(raw);
}

export function peakFolio(folio: unknown): boolean {
  return PEAK.has(folioOf(folio));
}

export function quietFolio(folio: unknown): boolean {
  return QUIET.has(folioOf(folio));
}

/** Early is preface and chapter. Mid is margin and index. Late is colophon and errata. */
export function folioBand(folio: unknown): "early" | "mid" | "late" | "" {
  const name = folioOf(folio);
  if (EARLY.has(name)) return "early";
  if (MID.has(name)) return "mid";
  if (LATE.has(name)) return "late";
  return "";
}

/** Steps from the leaf folio to the desk folio. A blank folio has no gap. */
export function folioGap(leafFolio: unknown, deskFolio: unknown): number | null {
  const from = folioIndex(folioOf(leafFolio));
  const to = folioIndex(folioOf(deskFolio));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseInk(ink: unknown): boolean {
  return HOUSE.has(inkOf(ink));
}

export function activeFolio(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return folioOf(text) || "all";
}

export function activeMargin(raw: unknown): string {
  const value = marginOf(raw);
  return value === null ? "all" : String(value);
}

export function activePace(raw: unknown, paces: readonly string[]): string {
  const pace = paceOf(raw);
  return pace && paces.includes(pace) ? pace : "all";
}

export function activeQuire(raw: unknown): string {
  const value = quireOf(raw);
  return value === null ? "all" : String(value);
}

export function activeInk(raw: unknown): string {
  const name = inkName(raw);
  return name || "all";
}

export function moveLeafFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestInk(leaves: readonly LecternLeaf[]): string {
  const counts = new Map<string, number>();
  for (const leaf of leaves) {
    if (!leaf.ink) continue;
    counts.set(leaf.ink, (counts.get(leaf.ink) || 0) + 1);
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

/** A night desk asks for a short SLA. An evening desk asks for a long one. A tie among saved leaves keeps 24. */
export function suggestMargin(leaves: readonly LecternLeaf[], hour: number): 12 | 24 | 36 {
  const counts = new Map<number, number>();
  for (const leaf of leaves) {
    if (leaf.margin === null) continue;
    counts.set(leaf.margin, (counts.get(leaf.margin) || 0) + 1);
  }
  let best: 12 | 24 | 36 | null = null;
  let score = 0;
  for (const margin of MARGINS) {
    const count = counts.get(margin) || 0;
    if (count > score) {
      best = margin;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 12;
  if (hour >= 18) return 36;
  return 24;
}

/** The reader with the fewest open leaves. A tie keeps the roster order. */
export function fairReader(leaves: readonly LecternLeaf[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = leaves.filter((leaf) => inTray(leaf, "open"));
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((leaf) => leaf.reader.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readLecternLeaves(raw: unknown): LecternLeaf[] {
  if (!Array.isArray(raw)) return [];
  const out: LecternLeaf[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LecternLeaf>;
    const id = clip(row.id, 40);
    const title = leafLine(row.title);
    if (!id || !title || out.some((leaf) => leaf.id === id || leaf.title === title)) continue;
    out.push({
      id,
      title,
      note: leafNote(row.note),
      reader: clip(row.reader, 24),
      folio: folioOf(row.folio),
      margin: marginOf(row.margin),
      ink: inkOf(row.ink),
      pace: paceOf(row.pace),
      quire: quireOf(row.quire) ?? 1,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      shelved: row.shelved === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, LEAF_CAP);
}

export function addLecternLeaf(
  leaves: readonly LecternLeaf[],
  leaf: {
    id: string;
    title: string;
    note?: string;
    reader?: string;
    folio?: unknown;
    ink?: string;
    pace?: string;
    margin?: unknown;
    quire?: unknown;
    tags?: unknown;
  },
): LecternLeaf[] {
  const current = readLecternLeaves(leaves);
  const id = clip(leaf.id, 40);
  const title = leafLine(leaf.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: LecternLeaf = {
    id,
    title,
    note: leafNote(leaf.note),
    reader: clip(leaf.reader, 24),
    folio: folioOf(leaf.folio),
    margin: marginOf(leaf.margin),
    ink: inkOf(leaf.ink),
    pace: paceOf(leaf.pace),
    quire: quireOf(leaf.quire) ?? 1,
    tags: tagsOf(leaf.tags),
    pinned: false,
    held: false,
    shelved: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, LEAF_CAP);
}

function mapLeaf(leaves: readonly LecternLeaf[], id: string, change: (leaf: LecternLeaf) => LecternLeaf): LecternLeaf[] {
  return readLecternLeaves(leaves).map((leaf) => (leaf.id === id ? change(leaf) : leaf));
}

function touchIds(leaves: readonly LecternLeaf[], ids: readonly string[], change: (leaf: LecternLeaf) => LecternLeaf): LecternLeaf[] {
  const picked = new Set(ids);
  return readLecternLeaves(leaves).map((leaf) => (picked.has(leaf.id) ? change(leaf) : leaf));
}

export function editLeaf(leaves: readonly LecternLeaf[], id: string, title: string): LecternLeaf[] {
  const next = leafLine(title);
  if (!next) return readLecternLeaves(leaves);
  return mapLeaf(leaves, id, (leaf) => (leaf.title === next ? leaf : { ...leaf, title: next, audit: "edit" }));
}

export function editLeafNote(leaves: readonly LecternLeaf[], id: string, note: string): LecternLeaf[] {
  const next = leafNote(note);
  return mapLeaf(leaves, id, (leaf) => (leaf.note === next ? leaf : { ...leaf, note: next, audit: "note" }));
}

export function setLeafPin(leaves: readonly LecternLeaf[], id: string, pinned: boolean): LecternLeaf[] {
  return mapLeaf(leaves, id, (leaf) => (leaf.pinned === pinned ? leaf : { ...leaf, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setLeafHold(leaves: readonly LecternLeaf[], id: string, held: boolean): LecternLeaf[] {
  return mapLeaf(leaves, id, (leaf) => (leaf.held === held ? leaf : { ...leaf, held, shelved: held ? false : leaf.shelved, audit: held ? "hold" : "resume" }));
}

export function setLeafShelve(leaves: readonly LecternLeaf[], id: string, shelved: boolean): LecternLeaf[] {
  return mapLeaf(leaves, id, (leaf) => (leaf.shelved === shelved ? leaf : { ...leaf, shelved, held: shelved ? false : leaf.held, audit: shelved ? "shelve" : "open" }));
}

export function setLeafFlag(leaves: readonly LecternLeaf[], id: string, flagged: boolean): LecternLeaf[] {
  return mapLeaf(leaves, id, (leaf) => (leaf.flagged === flagged ? leaf : { ...leaf, flagged, audit: "flag" }));
}

export function setLeafInk(leaves: readonly LecternLeaf[], id: string, ink: unknown): LecternLeaf[] {
  const next = inkOf(ink);
  if (!next) return readLecternLeaves(leaves);
  return mapLeaf(leaves, id, (leaf) => (leaf.ink === next ? leaf : { ...leaf, ink: next, audit: "ink" }));
}

/** Pace steps calm, even, brisk, then calm again. A blank pace starts at calm. */
export function cyclePace(leaves: readonly LecternLeaf[], id: string): LecternLeaf[] {
  return mapLeaf(leaves, id, (leaf) => {
    const at = PACE_CYCLE.indexOf(leaf.pace as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    return next === leaf.pace ? leaf : { ...leaf, pace: next, audit: "pace" };
  });
}

export function addLeafTag(leaves: readonly LecternLeaf[], id: string, tag: string): LecternLeaf[] {
  const next = tagsOf(tag)[0];
  if (!next) return readLecternLeaves(leaves);
  return mapLeaf(leaves, id, (leaf) => {
    if (leaf.tags.includes(next) || leaf.tags.length >= TAG_CAP) return leaf;
    return { ...leaf, tags: [...leaf.tags, next], audit: "tag" };
  });
}

export function lengthenMargin(leaves: readonly LecternLeaf[], id: string): LecternLeaf[] {
  return mapLeaf(leaves, id, (leaf) => {
    if (leaf.margin === 36) return leaf;
    const next = leaf.margin === 24 ? 36 : leaf.margin === 12 ? 24 : 12;
    return { ...leaf, margin: next, audit: "margin" };
  });
}

/** A blank margin becomes 36, 36 becomes 24, and 24 becomes 12. A margin of 12 stays. */
export function shortenMargin(leaves: readonly LecternLeaf[], id: string): LecternLeaf[] {
  return mapLeaf(leaves, id, (leaf) => {
    if (leaf.margin === 12) return leaf;
    const next = leaf.margin === 24 ? 12 : leaf.margin === 36 ? 24 : 36;
    return { ...leaf, margin: next, audit: "short" };
  });
}

export function raiseQuire(leaves: readonly LecternLeaf[], id: string): LecternLeaf[] {
  return mapLeaf(leaves, id, (leaf) => {
    const at = quireIndex(leaf.quire);
    const next = at < 0 ? QUIRE_CYCLE[0] : QUIRE_CYCLE[(at + 1) % QUIRE_CYCLE.length];
    return next === leaf.quire ? leaf : { ...leaf, quire: next, audit: "quire" };
  });
}

export function lowerQuire(leaves: readonly LecternLeaf[], id: string): LecternLeaf[] {
  return mapLeaf(leaves, id, (leaf) => {
    const at = quireIndex(leaf.quire);
    const next = at < 0 ? QUIRE_CYCLE[0] : QUIRE_CYCLE[(at + QUIRE_CYCLE.length - 1) % QUIRE_CYCLE.length];
    return next === leaf.quire ? leaf : { ...leaf, quire: next, audit: "quire" };
  });
}

function focusedLeaf(leaves: readonly LecternLeaf[], shownIds: readonly string[], index: number): LecternLeaf | undefined {
  const id = shownIds[index];
  return id ? readLecternLeaves(leaves).find((item) => item.id === id) : undefined;
}

export function pinFocusedLeaf(leaves: readonly LecternLeaf[], shownIds: readonly string[], index: number): LecternLeaf[] {
  const leaf = focusedLeaf(leaves, shownIds, index);
  if (!leaf) return readLecternLeaves(leaves);
  return setLeafPin(leaves, leaf.id, !leaf.pinned);
}

export function holdFocusedLeaf(leaves: readonly LecternLeaf[], shownIds: readonly string[], index: number): LecternLeaf[] {
  const leaf = focusedLeaf(leaves, shownIds, index);
  if (!leaf) return readLecternLeaves(leaves);
  return setLeafHold(leaves, leaf.id, !leaf.held);
}

export function paceFocusedLeaf(leaves: readonly LecternLeaf[], shownIds: readonly string[], index: number): LecternLeaf[] {
  const id = shownIds[index];
  return id ? cyclePace(leaves, id) : readLecternLeaves(leaves);
}

export function flagFocusedLeaf(leaves: readonly LecternLeaf[], shownIds: readonly string[], index: number): LecternLeaf[] {
  const leaf = focusedLeaf(leaves, shownIds, index);
  if (!leaf) return readLecternLeaves(leaves);
  return setLeafFlag(leaves, leaf.id, !leaf.flagged);
}

export function tagFocusedLeaf(leaves: readonly LecternLeaf[], shownIds: readonly string[], index: number, tag: string): LecternLeaf[] {
  const id = shownIds[index];
  return id ? addLeafTag(leaves, id, tag) : readLecternLeaves(leaves);
}

export function raiseFocusedLeaf(leaves: readonly LecternLeaf[], shownIds: readonly string[], index: number): LecternLeaf[] {
  const id = shownIds[index];
  return id ? raiseQuire(leaves, id) : readLecternLeaves(leaves);
}

export function lowerFocusedLeaf(leaves: readonly LecternLeaf[], shownIds: readonly string[], index: number): LecternLeaf[] {
  const id = shownIds[index];
  return id ? lowerQuire(leaves, id) : readLecternLeaves(leaves);
}

export function lengthenFocusedLeaf(leaves: readonly LecternLeaf[], shownIds: readonly string[], index: number): LecternLeaf[] {
  const id = shownIds[index];
  return id ? lengthenMargin(leaves, id) : readLecternLeaves(leaves);
}

export function shortenFocusedLeaf(leaves: readonly LecternLeaf[], shownIds: readonly string[], index: number): LecternLeaf[] {
  const id = shownIds[index];
  return id ? shortenMargin(leaves, id) : readLecternLeaves(leaves);
}

export function bulkLeafPin(leaves: readonly LecternLeaf[], ids: readonly string[]): LecternLeaf[] {
  return touchIds(leaves, ids, (leaf) => (leaf.pinned ? leaf : { ...leaf, pinned: true, audit: "pin" }));
}

export function bulkLeafShelve(leaves: readonly LecternLeaf[], ids: readonly string[]): LecternLeaf[] {
  return touchIds(leaves, ids, (leaf) => (leaf.shelved ? leaf : { ...leaf, shelved: true, held: false, audit: "shelve" }));
}

export function bulkLeafBrisk(leaves: readonly LecternLeaf[], ids: readonly string[]): LecternLeaf[] {
  return touchIds(leaves, ids, (leaf) => (leaf.pace === "brisk" ? leaf : { ...leaf, pace: "brisk", audit: "pace" }));
}

export function bulkLeafTag(leaves: readonly LecternLeaf[], ids: readonly string[], tag: string): LecternLeaf[] {
  const next = tagsOf(tag)[0];
  if (!next) return readLecternLeaves(leaves);
  return touchIds(leaves, ids, (leaf) => (leaf.tags.includes(next) || leaf.tags.length >= TAG_CAP ? leaf : { ...leaf, tags: [...leaf.tags, next], audit: "tag" }));
}

export function bulkLeafSoot(leaves: readonly LecternLeaf[], ids: readonly string[]): LecternLeaf[] {
  return touchIds(leaves, ids, (leaf) => (leaf.ink === "SOOT" ? leaf : { ...leaf, ink: "SOOT", audit: "ink" }));
}

export function readLeafViews(raw: unknown): LeafView[] {
  if (!Array.isArray(raw)) return [];
  const out: LeafView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LeafView>;
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
      pace: activePace(row.pace, PACES),
      folio: activeFolio(row.folio),
      margin: activeMargin(row.margin),
      quire: activeQuire(row.quire),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addLeafView(
  views: readonly LeafView[],
  view: {
    id: string;
    name: string;
    tray?: unknown;
    query?: string;
    reader?: string;
    ink?: string;
    pace?: string;
    folio?: string;
    margin?: string;
    quire?: string;
  },
): LeafView[] {
  const current = readLeafViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: LeafView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    reader: clip(view.reader, 24),
    ink: activeInk(view.ink),
    pace: activePace(view.pace, PACES),
    folio: activeFolio(view.folio),
    margin: activeMargin(view.margin),
    quire: activeQuire(view.quire),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropLeafView(views: readonly LeafView[], id: string): LeafView[] {
  return readLeafViews(views).filter((view) => view.id !== id);
}

export function leafDensity(raw: unknown): LeafDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function lateLeaf(leaf: LecternLeaf, deskFolio: unknown): boolean {
  const gap = folioGap(leaf.folio, deskFolio);
  return gap !== null && gap > 0;
}

export function idleLeaf(leaf: LecternLeaf): boolean {
  return leaf.pace === "calm" && quietFolio(leaf.folio) && leaf.quire === 1;
}

export function rushLeaf(leaf: LecternLeaf): boolean {
  return leaf.quire === 5 && leaf.pace === "brisk" && peakFolio(leaf.folio);
}

export function restingLeaf(leaf: LecternLeaf): boolean {
  return leaf.margin === 36 && leaf.pace === "even" && !leaf.flagged;
}

/** A twelve-minute margin on a peak folio is overdue unless the leaf is pinned. */
export function overdueLeaf(leaf: LecternLeaf): boolean {
  return leaf.margin === 12 && peakFolio(leaf.folio) && !leaf.pinned;
}

export function visibleLeaves(
  leaves: readonly LecternLeaf[],
  tray: LeafTray,
  query: string,
  reader: string,
  ink: string,
  pace: string,
  folio: string,
  margin: string,
  quire: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): LecternLeaf[] {
  const text = query.trim().toLowerCase();
  const readerOn = reader === "all" ? "" : reader.trim().toLowerCase();
  const inkOn = ink === "all" ? "" : inkOf(ink);
  const paceOn = pace === "all" ? "" : paceOf(pace);
  const folioOn = folio === "all" ? "" : activeFolio(folio);
  const marginOn = margin === "all" ? "" : activeMargin(margin);
  const quireOn = quire === "all" ? "" : activeQuire(quire);
  return readLecternLeaves(leaves).filter((leaf) => {
    if (!inTray(leaf, tray)) return false;
    if (text && !`${leaf.title} ${leaf.note}`.toLowerCase().includes(text)) return false;
    if (readerOn && leaf.reader.toLowerCase() !== readerOn) return false;
    if (inkOn && leaf.ink !== inkOn) return false;
    if (paceOn && leaf.pace !== paceOn) return false;
    if (folioOn === "peak" && !peakFolio(leaf.folio)) return false;
    if (folioOn === "quiet" && !quietFolio(leaf.folio)) return false;
    if (folioOn && folioOn !== "peak" && folioOn !== "quiet" && leaf.folio !== folioOn) return false;
    if (marginOn && String(leaf.margin ?? "") !== marginOn) return false;
    if (quireOn && String(leaf.quire) !== quireOn) return false;
    if (houseOnly && !houseInk(leaf.ink)) return false;
    if (peakOnly && !peakFolio(leaf.folio)) return false;
    if (quietOnly && !quietFolio(leaf.folio)) return false;
    return true;
  });
}

export function sortLeaves(leaves: readonly LecternLeaf[], sort: LeafSort): LecternLeaf[] {
  return leaves.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "reader") {
      const reader = a.reader.localeCompare(b.reader);
      if (reader) return reader;
    }
    const folio = (folioIndex(a.folio) < 0 ? 99 : folioIndex(a.folio)) - (folioIndex(b.folio) < 0 ? 99 : folioIndex(b.folio));
    if (folio) return folio;
    return a.title.localeCompare(b.title);
  });
}

export function leafCounts(leaves: readonly LecternLeaf[], shown: readonly LecternLeaf[], deskFolio: unknown): LeafCounts {
  const open = leaves.filter((leaf) => inTray(leaf, "open"));
  void shown;
  return {
    open: open.length,
    held: leaves.filter((leaf) => inTray(leaf, "held")).length,
    shelved: leaves.filter((leaf) => inTray(leaf, "shelved")).length,
    pinned: open.filter((leaf) => leaf.pinned).length,
    peak: open.filter((leaf) => peakFolio(leaf.folio)).length,
    quiet: open.filter((leaf) => quietFolio(leaf.folio)).length,
    soon: open.filter((leaf) => leaf.margin === 12).length,
    quire: open.reduce((sum, leaf) => sum + leaf.quire, 0),
    house: open.filter((leaf) => houseInk(leaf.ink)).length,
    margin: open.filter((leaf) => leaf.margin !== null).length,
    matched: open.filter((leaf) => leaf.folio && leaf.folio === folioOf(deskFolio)).length,
    flagged: open.filter((leaf) => leaf.flagged).length,
    idle: open.filter((leaf) => idleLeaf(leaf)).length,
    rush: open.filter((leaf) => rushLeaf(leaf)).length,
    resting: open.filter((leaf) => restingLeaf(leaf)).length,
    overdue: open.filter((leaf) => overdueLeaf(leaf)).length,
  };
}

export function clashFolioCount(leaves: readonly LecternLeaf[]): number {
  const open = leaves.filter((leaf) => inTray(leaf, "open") && leaf.folio);
  return open.filter((leaf) => open.some((other) => other.id !== leaf.id && other.folio === leaf.folio && other.quire === leaf.quire)).length;
}

export function neighborLeafCount(leaves: readonly LecternLeaf[]): number {
  const open = leaves.filter((leaf) => inTray(leaf, "open") && quireIndex(leaf.quire) >= 0);
  return open.filter((leaf) => open.some((other) => {
    if (other.id === leaf.id) return false;
    const gap = Math.abs(quireIndex(other.quire) - quireIndex(leaf.quire));
    const ring = Math.min(gap, QUIRE_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestReader(leaves: readonly LecternLeaf[]): string {
  const open = leaves.filter((leaf) => inTray(leaf, "open") && leaf.reader);
  let best = "";
  let score = 0;
  for (const leaf of open) {
    const count = open.filter((item) => item.reader.toLowerCase() === leaf.reader.toLowerCase()).length;
    if (count > score) {
      best = leaf.reader;
      score = count;
    }
  }
  return best;
}

export function reminderLeaves(leaves: readonly LecternLeaf[]): LecternLeaf[] {
  return leaves.filter((leaf) => inTray(leaf, "open") && (leaf.margin === 12 || leaf.margin === 24));
}

export function idleLeaves(leaves: readonly LecternLeaf[]): LecternLeaf[] {
  return leaves.filter((leaf) => inTray(leaf, "open") && idleLeaf(leaf));
}

export function leafTimeline(leaves: readonly LecternLeaf[]): { quire: number; titles: string[] }[] {
  const open = leaves.filter((leaf) => inTray(leaf, "open"));
  return QUIRE_CYCLE.map((quire) => ({ quire, titles: open.filter((leaf) => leaf.quire === quire).map((leaf) => leaf.title) })).filter((lane) => lane.titles.length);
}

export function leafBars(leaves: readonly LecternLeaf[]): { folio: string; count: number }[] {
  const open = leaves.filter((leaf) => inTray(leaf, "open"));
  return LECTERN_FOLIOS.map((folio) => ({ folio, count: open.filter((leaf) => leaf.folio === folio).length }));
}

export function leafReaders(leaves: readonly LecternLeaf[]): string[] {
  const out: string[] = [];
  for (const leaf of leaves) {
    if (!leaf.reader || out.some((item) => item.toLowerCase() === leaf.reader.toLowerCase())) continue;
    out.push(leaf.reader);
  }
  return out;
}

export function leafCopy(leaf: LecternLeaf): string {
  return [leaf.title, leaf.reader, leaf.folio, leaf.ink, leaf.pace, leaf.margin ?? "", leaf.quire, leaf.note].filter((item) => item !== "").join(" · ");
}

export function leafShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function leafCsv(leaves: readonly LecternLeaf[], deskFolio: unknown): string {
  const lines = ["title,reader,folio,ink,pace,margin,quire,tags,pinned,held,shelved,flagged,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const leaf of readLecternLeaves(leaves)) {
    const gap = folioGap(leaf.folio, deskFolio);
    lines.push([
      csvCell(leaf.title),
      csvCell(leaf.reader),
      leaf.folio,
      leaf.ink,
      leaf.pace,
      leaf.margin === null ? "" : String(leaf.margin),
      String(leaf.quire),
      leaf.tags.join(" "),
      leaf.pinned ? "1" : "0",
      leaf.held ? "1" : "0",
      leaf.shelved ? "1" : "0",
      leaf.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateLeaf(leaf, deskFolio) ? "1" : "0",
      idleLeaf(leaf) ? "1" : "0",
      peakFolio(leaf.folio) ? "1" : "0",
      quietFolio(leaf.folio) ? "1" : "0",
      houseInk(leaf.ink) ? "1" : "0",
      folioBand(leaf.folio),
      rushLeaf(leaf) ? "1" : "0",
      restingLeaf(leaf) ? "1" : "0",
      overdueLeaf(leaf) ? "1" : "0",
      leaf.audit,
      csvCell(leaf.note),
    ].join(","));
  }
  return lines.join("\n");
}

function cameoRecord(raw: CameoValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function cameoText(raw: CameoValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = cameoRecord(raw);
  if (!row || !("saleStatus" in row)) return "";
  return clip(row.saleStatus, 24);
}

function hasBlocked(raw: CameoValue): boolean {
  const row = cameoRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

function cameoCode(raw: CameoValue): string {
  if (hasBlocked(raw)) return "";
  const text = cameoText(raw).toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9][A-Z0-9_-]{1,13}$/.test(text)) return "";
  return text;
}

/** A blocked field clears the plate. A status of two to fourteen marks is set. A short status is clear. */
export function cameoState(raw: CameoValue): CameoState {
  if (hasBlocked(raw)) return "";
  const row = cameoRecord(raw);
  if (row && !("saleStatus" in row)) return "";
  return cameoCode(raw) ? "set" : "clear";
}

/** The first mark, the last mark, and the length. WARM is WM4. */
export function cameoStamp(raw: CameoValue): string {
  const code = cameoState(raw) === "set" ? cameoCode(raw) : "";
  if (!code) return "";
  return `${code.slice(0, 1)}${code.slice(-1)}${code.length}`;
}

/** A long status wins, then a break, then a paired start, then a figure, then an open vowel, then a short word. */
export function cameoLane(raw: CameoValue): CameoLane {
  const code = cameoState(raw) === "set" ? cameoCode(raw) : "";
  if (!code) return "";
  if (code.length >= 11) return "scroll";
  if (/[-_]/.test(code)) return "break";
  if (code[0] === code[1]) return "pair";
  if (/^\d/.test(code)) return "figure";
  if (/^[AEIOU]/.test(code)) return "open";
  if (code.length <= 3) return "short";
  return "plain";
}

/** Hue follows the last mark. Digits are bronze. */
export function cameoHue(raw: CameoValue): CameoHue {
  const code = cameoState(raw) === "set" ? cameoCode(raw) : "";
  if (!code) return "";
  const last = code[code.length - 1];
  if (last >= "0" && last <= "9") return "bronze";
  if (last <= "D") return "ivory";
  if (last <= "H") return "graphite";
  if (last <= "L") return "champagne";
  if (last <= "P") return "ink";
  if (last <= "T") return "vellum";
  return "ash";
}

export function cameoBound(raw: CameoValue): boolean {
  const code = cameoState(raw) === "set" ? cameoCode(raw) : "";
  return Boolean(code && (code.startsWith("S") || code.startsWith("N")));
}

export function cameoWide(raw: CameoValue): boolean {
  const code = cameoState(raw) === "set" ? cameoCode(raw) : "";
  return Boolean(code && code.length >= 9);
}

export function cameoNotch(raw: CameoValue): boolean {
  const code = cameoState(raw) === "set" ? cameoCode(raw) : "";
  return Boolean(code && (code.includes("-") || code.includes("_")));
}

export function cameoStep(raw: CameoValue): number {
  const code = cameoState(raw) === "set" ? cameoCode(raw) : "";
  if (!code) return 0;
  return Math.min(7, new Set(code.split("")).size);
}

export function cameoJoin(raw: CameoValue): boolean {
  const code = cameoState(raw) === "set" ? cameoCode(raw) : "";
  return Boolean(code && /(.)\1/.test(code));
}

export function cameoLanes(rows: readonly CameoRow[]): CameoLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = cameoLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingCameo(rows: readonly CameoRow[]): string {
  const bars = cameoLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingCameoHue(rows: readonly CameoRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = cameoHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedCameoCount(rows: readonly CameoRow[]): number {
  const marks = rows.map((row) => cameoStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneCameoCount(rows: readonly CameoRow[], lane: CameoLane): number {
  return rows.filter((row) => cameoLane(row.note) === lane).length;
}

export function hueCameoCount(rows: readonly CameoRow[], hue: CameoHue): number {
  return rows.filter((row) => cameoHue(row.note) === hue).length;
}

export function cameoShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCameoLanes(rows: readonly CameoRow[]): string[] {
  return cameoLanes(rows).map((line) => line.lane);
}

export function readHiddenCameos(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedCameos(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCameo(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleCameoReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCameoReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCameoLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleCameos(
  rows: readonly CameoRow[],
  lane: string,
  hue: string,
  query: string,
  review: CameoReview,
  reviewed: readonly string[],
  shape: CameoShape,
): CameoRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (cameoState(row.note) === "") return false;
    const found = cameoLane(row.note);
    const hueName = cameoHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${cameoText(row.note)} ${cameoStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "pair" && found !== "pair") return false;
    if (shape === "wide" && !cameoWide(row.note)) return false;
    if (shape === "bound" && !cameoBound(row.note)) return false;
    if (shape === "notch" && !cameoNotch(row.note)) return false;
    if (shape === "figure" && found !== "figure") return false;
    if (shape === "open" && found !== "open") return false;
    if (shape === "short" && found !== "short") return false;
    return true;
  });
}

export function cameoCopy(raw: CameoValue): string {
  return [cameoStamp(raw), cameoLane(raw), cameoHue(raw)].filter(Boolean).join(" ");
}

export function cameoLanesCsv(rows: readonly CameoRow[]): string {
  const lines = ["lane,count"];
  for (const line of cameoLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function cameoRowsCsv(rows: readonly CameoRow[], reviewed: readonly string[]): string {
  const lines = ["code,stamp,lane,hue,step,join,wide,notch,bound,figure,short,open,pair,break,scroll,plain,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (cameoState(row.note) !== "set") continue;
    const lane = cameoLane(row.note);
    lines.push([
      csvCell(cameoCode(row.note)),
      cameoStamp(row.note),
      lane,
      cameoHue(row.note),
      String(cameoStep(row.note)),
      cameoJoin(row.note) ? "1" : "0",
      cameoWide(row.note) ? "1" : "0",
      cameoNotch(row.note) ? "1" : "0",
      cameoBound(row.note) ? "1" : "0",
      lane === "figure" ? "1" : "0",
      lane === "short" ? "1" : "0",
      lane === "open" ? "1" : "0",
      lane === "pair" ? "1" : "0",
      lane === "break" ? "1" : "0",
      lane === "scroll" ? "1" : "0",
      lane === "plain" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
