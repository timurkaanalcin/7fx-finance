/**
 * Choir cards for a retention call book, and assignment crests already stored as a trader assignee name.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_choir_card (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   singer text not null default '',
 *   verse text not null default '',
 *   cloth text not null default '',
 *   tempo text not null default '',
 *   bar_min integer,
 *   measure integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   waiting boolean not null default false,
 *   filed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_assign_crest_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_assign_crest_review (
 *   trader_id text primary key
 * );
 */

export const CHR_KEY = "crmv4-choir-card";
export const CHR_VIEW_KEY = "crmv4-choir-views";
export const CHR_DENSITY_KEY = "crmv4-choir-density";
export const ACR_KEY = "crmv4-assign-hide";
export const ACR_REVIEW_KEY = "crmv4-assign-review";

export const CHOIR_VERSES = ["intro", "stanza", "chorus", "bridge", "outro", "coda"] as const;

export type ChoirVerse = (typeof CHOIR_VERSES)[number];

export type ClothName = "blank" | "linen" | "gilt" | "wax";

export type TempoName = "blank" | "largo" | "andante" | "presto";

export type CardTray = "open" | "held" | "shelved";

export type CardDensity = "airy" | "tight";

export type CardSort = "folio" | "reader";

export type ChoirCard = {
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

export type CardView = {
  id: string;
  name: string;
  tray: CardTray;
  query: string;
  reader: string;
  ink: string;
  pace: string;
  folio: string;
  margin: string;
  quire: string;
};

export type CardCounts = {
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

export type CrestLane = "" | "house" | "bench" | "duo" | "link" | "brief" | "long" | "plain";

export type CrestHue = "" | "ivory" | "graphite" | "champagne" | "ink" | "vellum" | "ash" | "bronze";

export type CrestState = "" | "clear" | "set";

export type CrestShape = "all" | "house" | "bench" | "duo" | "link" | "brief" | "long" | "wide" | "notch";

export type CrestReview = "all" | "reviewed" | "fresh";

export type CrestValue = string | { assigneeName?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type CrestRow = { id: string; label: string; note: CrestValue };

export type CrestLaneLine = { lane: string; count: number };

export const ROUND252_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "wait",
  "file",
  "star",
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
  "fair-singer",
  "viewer",
  "suggest",
  "crests",
  "crest-review",
  "crest-csv",
] as const;

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "shelve", "open", "ink", "tag", "quire", "margin", "short", "flag"] as const;

const INKS = ["linen", "gilt", "wax"] as const;

const PACES = ["largo", "andante", "presto"] as const;

const PACE_CYCLE = ["largo", "andante", "presto"] as const;

const QUIRE_CYCLE = [2, 4, 8, 16] as const;

const MARGINS = [6, 12, 18] as const;

const PEAK = new Set(["intro", "outro"]);

const QUIET = new Set(["bridge", "coda"]);

const HOUSE = new Set(["LINEN", "GILT"]);

const EARLY = new Set(["intro", "stanza"]);

const MID = new Set(["chorus", "bridge"]);

const LATE = new Set(["outro", "coda"]);

const LANE_ORDER = ["house", "bench", "duo", "link", "brief", "long", "plain"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne", "ink", "vellum", "ash", "bronze"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const LEAF_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CardTray {
  return raw === "held" || raw === "shelved" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ClothName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<ClothName, "blank">) : "";
}

function tempoName(raw: unknown): Exclude<TempoName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<TempoName, "blank">) : "";
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

function inTray(leaf: ChoirCard, tray: CardTray): boolean {
  if (tray === "held") return leaf.held && !leaf.shelved;
  if (tray === "shelved") return leaf.shelved;
  return !leaf.held && !leaf.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function verseIndex(folio: string): number {
  return CHOIR_VERSES.indexOf(folio as ChoirVerse);
}

function measureIndex(quire: number): number {
  return QUIRE_CYCLE.indexOf(quire as (typeof QUIRE_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function cardLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function cardNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A folio outside the six gatherings is left blank. */
export function verseOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (CHOIR_VERSES as readonly string[]).includes(text) ? text : "";
}

/** The SLA timer is 12, 24, or 36 minutes. Anything else stays blank. */
export function barOf(raw: unknown): 6 | 12 | 18 | null {
  const value = Number(clip(raw, 2));
  return (MARGINS as readonly number[]).includes(value) ? (value as 6 | 12 | 18) : null;
}

/** Quire is 1, 3, 5, or 7. Anything else stays blank. */
export function measureOf(raw: unknown): 2 | 4 | 8 | 16 | null {
  const value = Number(clip(raw, 2));
  return (QUIRE_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 8 | 16) : null;
}

/** Ink is iron, oak, or soot. The saved ink is IRON, OAK, or SOOT. */
export function clothOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "linen") return "LINEN";
  if (text === "gilt") return "GILT";
  if (text === "wax") return "WAX";
  return "";
}

/** Pace is calm, even, or brisk. A blank pace stays blank. */
export function tempoOf(raw: unknown): string {
  return tempoName(raw);
}

export function peakVerse(folio: unknown): boolean {
  return PEAK.has(verseOf(folio));
}

export function quietVerse(folio: unknown): boolean {
  return QUIET.has(verseOf(folio));
}

/** Early is preface and chapter. Mid is margin and index. Late is colophon and errata. */
export function verseBand(folio: unknown): "early" | "mid" | "late" | "" {
  const name = verseOf(folio);
  if (EARLY.has(name)) return "early";
  if (MID.has(name)) return "mid";
  if (LATE.has(name)) return "late";
  return "";
}

/** Steps from the leaf folio to the desk folio. A blank folio has no gap. */
export function verseGap(leafFolio: unknown, deskFolio: unknown): number | null {
  const from = verseIndex(verseOf(leafFolio));
  const to = verseIndex(verseOf(deskFolio));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseCloth(ink: unknown): boolean {
  return HOUSE.has(clothOf(ink));
}

export function activeVerse(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return verseOf(text) || "all";
}

export function activeBar(raw: unknown): string {
  const value = barOf(raw);
  return value === null ? "all" : String(value);
}

export function activeTempo(raw: unknown, paces: readonly string[]): string {
  const pace = tempoOf(raw);
  return pace && paces.includes(pace) ? pace : "all";
}

export function activeMeasure(raw: unknown): string {
  const value = measureOf(raw);
  return value === null ? "all" : String(value);
}

export function activeCloth(raw: unknown): string {
  const name = clothName(raw);
  return name || "all";
}

export function moveCardFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestCloth(leaves: readonly ChoirCard[]): string {
  const counts = new Map<string, number>();
  for (const leaf of leaves) {
    if (!leaf.ink) continue;
    counts.set(leaf.ink, (counts.get(leaf.ink) || 0) + 1);
  }
  let best = "LINEN";
  let score = 0;
  for (const ink of ["LINEN", "GILT", "WAX"]) {
    const count = counts.get(ink) || 0;
    if (count > score) {
      best = ink;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short SLA. An evening desk asks for a long one. A tie among saved leaves keeps 24. */
export function suggestBar(leaves: readonly ChoirCard[], hour: number): 6 | 12 | 18 {
  const counts = new Map<number, number>();
  for (const leaf of leaves) {
    if (leaf.margin === null) continue;
    counts.set(leaf.margin, (counts.get(leaf.margin) || 0) + 1);
  }
  let best: 6 | 12 | 18 | null = null;
  let score = 0;
  for (const margin of MARGINS) {
    const count = counts.get(margin) || 0;
    if (count > score) {
      best = margin;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 6;
  if (hour >= 18) return 18;
  return 12;
}

/** The reader with the fewest open leaves. A tie keeps the roster order. */
export function fairSinger(leaves: readonly ChoirCard[], roster: string): string {
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

export function readChoirCards(raw: unknown): ChoirCard[] {
  if (!Array.isArray(raw)) return [];
  const out: ChoirCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ChoirCard>;
    const id = clip(row.id, 40);
    const title = cardLine(row.title);
    if (!id || !title || out.some((leaf) => leaf.id === id || leaf.title === title)) continue;
    out.push({
      id,
      title,
      note: cardNote(row.note),
      reader: clip(row.reader, 24),
      folio: verseOf(row.folio),
      margin: barOf(row.margin),
      ink: clothOf(row.ink),
      pace: tempoOf(row.pace),
      quire: measureOf(row.quire) ?? 2,
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

export function addChoirCard(
  leaves: readonly ChoirCard[],
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
): ChoirCard[] {
  const current = readChoirCards(leaves);
  const id = clip(leaf.id, 40);
  const title = cardLine(leaf.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: ChoirCard = {
    id,
    title,
    note: cardNote(leaf.note),
    reader: clip(leaf.reader, 24),
    folio: verseOf(leaf.folio),
    margin: barOf(leaf.margin),
    ink: clothOf(leaf.ink),
    pace: tempoOf(leaf.pace),
    quire: measureOf(leaf.quire) ?? 1,
    tags: tagsOf(leaf.tags),
    pinned: false,
    held: false,
    shelved: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, LEAF_CAP);
}

function mapCard(leaves: readonly ChoirCard[], id: string, change: (leaf: ChoirCard) => ChoirCard): ChoirCard[] {
  return readChoirCards(leaves).map((leaf) => (leaf.id === id ? change(leaf) : leaf));
}

function touchIds(leaves: readonly ChoirCard[], ids: readonly string[], change: (leaf: ChoirCard) => ChoirCard): ChoirCard[] {
  const picked = new Set(ids);
  return readChoirCards(leaves).map((leaf) => (picked.has(leaf.id) ? change(leaf) : leaf));
}

export function editCard(leaves: readonly ChoirCard[], id: string, title: string): ChoirCard[] {
  const next = cardLine(title);
  if (!next) return readChoirCards(leaves);
  return mapCard(leaves, id, (leaf) => (leaf.title === next ? leaf : { ...leaf, title: next, audit: "edit" }));
}

export function editCardNote(leaves: readonly ChoirCard[], id: string, note: string): ChoirCard[] {
  const next = cardNote(note);
  return mapCard(leaves, id, (leaf) => (leaf.note === next ? leaf : { ...leaf, note: next, audit: "note" }));
}

export function setCardPin(leaves: readonly ChoirCard[], id: string, pinned: boolean): ChoirCard[] {
  return mapCard(leaves, id, (leaf) => (leaf.pinned === pinned ? leaf : { ...leaf, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setCardWait(leaves: readonly ChoirCard[], id: string, held: boolean): ChoirCard[] {
  return mapCard(leaves, id, (leaf) => (leaf.held === held ? leaf : { ...leaf, held, shelved: held ? false : leaf.shelved, audit: held ? "hold" : "resume" }));
}

export function setCardFile(leaves: readonly ChoirCard[], id: string, shelved: boolean): ChoirCard[] {
  return mapCard(leaves, id, (leaf) => (leaf.shelved === shelved ? leaf : { ...leaf, shelved, held: shelved ? false : leaf.held, audit: shelved ? "shelve" : "open" }));
}

export function setCardStar(leaves: readonly ChoirCard[], id: string, flagged: boolean): ChoirCard[] {
  return mapCard(leaves, id, (leaf) => (leaf.flagged === flagged ? leaf : { ...leaf, flagged, audit: "flag" }));
}

export function setCardCloth(leaves: readonly ChoirCard[], id: string, ink: unknown): ChoirCard[] {
  const next = clothOf(ink);
  if (!next) return readChoirCards(leaves);
  return mapCard(leaves, id, (leaf) => (leaf.ink === next ? leaf : { ...leaf, ink: next, audit: "ink" }));
}

/** Pace steps calm, even, brisk, then calm again. A blank pace starts at calm. */
export function cycleTempo(leaves: readonly ChoirCard[], id: string): ChoirCard[] {
  return mapCard(leaves, id, (leaf) => {
    const at = PACE_CYCLE.indexOf(leaf.pace as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    return next === leaf.pace ? leaf : { ...leaf, pace: next, audit: "pace" };
  });
}

export function addCardTag(leaves: readonly ChoirCard[], id: string, tag: string): ChoirCard[] {
  const next = tagsOf(tag)[0];
  if (!next) return readChoirCards(leaves);
  return mapCard(leaves, id, (leaf) => {
    if (leaf.tags.includes(next) || leaf.tags.length >= TAG_CAP) return leaf;
    return { ...leaf, tags: [...leaf.tags, next], audit: "tag" };
  });
}

export function lengthenBar(leaves: readonly ChoirCard[], id: string): ChoirCard[] {
  return mapCard(leaves, id, (leaf) => {
    if (leaf.margin === 18) return leaf;
    const next = leaf.margin === 12 ? 18 : leaf.margin === 6 ? 12 : 6;
    return { ...leaf, margin: next, audit: "margin" };
  });
}

/** A blank margin becomes 36, 36 becomes 24, and 24 becomes 12. A margin of 12 stays. */
export function shortenBar(leaves: readonly ChoirCard[], id: string): ChoirCard[] {
  return mapCard(leaves, id, (leaf) => {
    if (leaf.margin === 6) return leaf;
    const next = leaf.margin === 12 ? 6 : leaf.margin === 18 ? 12 : 18;
    return { ...leaf, margin: next, audit: "short" };
  });
}

export function raiseMeasure(leaves: readonly ChoirCard[], id: string): ChoirCard[] {
  return mapCard(leaves, id, (leaf) => {
    const at = measureIndex(leaf.quire);
    const next = at < 0 ? QUIRE_CYCLE[0] : QUIRE_CYCLE[(at + 1) % QUIRE_CYCLE.length];
    return next === leaf.quire ? leaf : { ...leaf, quire: next, audit: "quire" };
  });
}

export function lowerMeasure(leaves: readonly ChoirCard[], id: string): ChoirCard[] {
  return mapCard(leaves, id, (leaf) => {
    const at = measureIndex(leaf.quire);
    const next = at < 0 ? QUIRE_CYCLE[0] : QUIRE_CYCLE[(at + QUIRE_CYCLE.length - 1) % QUIRE_CYCLE.length];
    return next === leaf.quire ? leaf : { ...leaf, quire: next, audit: "quire" };
  });
}

function focusedCard(leaves: readonly ChoirCard[], shownIds: readonly string[], index: number): ChoirCard | undefined {
  const id = shownIds[index];
  return id ? readChoirCards(leaves).find((item) => item.id === id) : undefined;
}

export function pinFocusedCard(leaves: readonly ChoirCard[], shownIds: readonly string[], index: number): ChoirCard[] {
  const leaf = focusedCard(leaves, shownIds, index);
  if (!leaf) return readChoirCards(leaves);
  return setCardPin(leaves, leaf.id, !leaf.pinned);
}

export function waitFocusedCard(leaves: readonly ChoirCard[], shownIds: readonly string[], index: number): ChoirCard[] {
  const leaf = focusedCard(leaves, shownIds, index);
  if (!leaf) return readChoirCards(leaves);
  return setCardWait(leaves, leaf.id, !leaf.held);
}

export function tempoFocusedCard(leaves: readonly ChoirCard[], shownIds: readonly string[], index: number): ChoirCard[] {
  const id = shownIds[index];
  return id ? cycleTempo(leaves, id) : readChoirCards(leaves);
}

export function starFocusedCard(leaves: readonly ChoirCard[], shownIds: readonly string[], index: number): ChoirCard[] {
  const leaf = focusedCard(leaves, shownIds, index);
  if (!leaf) return readChoirCards(leaves);
  return setCardStar(leaves, leaf.id, !leaf.flagged);
}

export function tagFocusedCard(leaves: readonly ChoirCard[], shownIds: readonly string[], index: number, tag: string): ChoirCard[] {
  const id = shownIds[index];
  return id ? addCardTag(leaves, id, tag) : readChoirCards(leaves);
}

export function raiseFocusedCard(leaves: readonly ChoirCard[], shownIds: readonly string[], index: number): ChoirCard[] {
  const id = shownIds[index];
  return id ? raiseMeasure(leaves, id) : readChoirCards(leaves);
}

export function lowerFocusedCard(leaves: readonly ChoirCard[], shownIds: readonly string[], index: number): ChoirCard[] {
  const id = shownIds[index];
  return id ? lowerMeasure(leaves, id) : readChoirCards(leaves);
}

export function lengthenFocusedCard(leaves: readonly ChoirCard[], shownIds: readonly string[], index: number): ChoirCard[] {
  const id = shownIds[index];
  return id ? lengthenBar(leaves, id) : readChoirCards(leaves);
}

export function shortenFocusedCard(leaves: readonly ChoirCard[], shownIds: readonly string[], index: number): ChoirCard[] {
  const id = shownIds[index];
  return id ? shortenBar(leaves, id) : readChoirCards(leaves);
}

export function bulkCardPin(leaves: readonly ChoirCard[], ids: readonly string[]): ChoirCard[] {
  return touchIds(leaves, ids, (leaf) => (leaf.pinned ? leaf : { ...leaf, pinned: true, audit: "pin" }));
}

export function bulkCardFile(leaves: readonly ChoirCard[], ids: readonly string[]): ChoirCard[] {
  return touchIds(leaves, ids, (leaf) => (leaf.shelved ? leaf : { ...leaf, shelved: true, held: false, audit: "shelve" }));
}

export function bulkCardPresto(leaves: readonly ChoirCard[], ids: readonly string[]): ChoirCard[] {
  return touchIds(leaves, ids, (leaf) => (leaf.pace === "presto" ? leaf : { ...leaf, pace: "presto", audit: "pace" }));
}

export function bulkCardTag(leaves: readonly ChoirCard[], ids: readonly string[], tag: string): ChoirCard[] {
  const next = tagsOf(tag)[0];
  if (!next) return readChoirCards(leaves);
  return touchIds(leaves, ids, (leaf) => (leaf.tags.includes(next) || leaf.tags.length >= TAG_CAP ? leaf : { ...leaf, tags: [...leaf.tags, next], audit: "tag" }));
}

export function bulkCardWax(leaves: readonly ChoirCard[], ids: readonly string[]): ChoirCard[] {
  return touchIds(leaves, ids, (leaf) => (leaf.ink === "WAX" ? leaf : { ...leaf, ink: "WAX", audit: "ink" }));
}

export function readCardViews(raw: unknown): CardView[] {
  if (!Array.isArray(raw)) return [];
  const out: CardView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CardView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      reader: clip(row.reader, 24),
      ink: activeCloth(row.ink),
      pace: activeTempo(row.pace, PACES),
      folio: activeVerse(row.folio),
      margin: activeBar(row.margin),
      quire: activeMeasure(row.quire),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCardView(
  views: readonly CardView[],
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
): CardView[] {
  const current = readCardViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: CardView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    reader: clip(view.reader, 24),
    ink: activeCloth(view.ink),
    pace: activeTempo(view.pace, PACES),
    folio: activeVerse(view.folio),
    margin: activeBar(view.margin),
    quire: activeMeasure(view.quire),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropCardView(views: readonly CardView[], id: string): CardView[] {
  return readCardViews(views).filter((view) => view.id !== id);
}

export function cardDensity(raw: unknown): CardDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function lateCard(leaf: ChoirCard, deskFolio: unknown): boolean {
  const gap = verseGap(leaf.folio, deskFolio);
  return gap !== null && gap > 0;
}

export function idleCard(leaf: ChoirCard): boolean {
  return leaf.pace === "largo" && quietVerse(leaf.folio) && leaf.quire === 2;
}

export function rushCard(leaf: ChoirCard): boolean {
  return leaf.quire === 8 && leaf.pace === "presto" && peakVerse(leaf.folio);
}

export function restingCard(leaf: ChoirCard): boolean {
  return leaf.margin === 18 && leaf.pace === "andante" && !leaf.flagged;
}

/** A twelve-minute margin on a peak folio is overdue unless the leaf is pinned. */
export function overdueCard(leaf: ChoirCard): boolean {
  return leaf.margin === 6 && peakVerse(leaf.folio) && !leaf.pinned;
}

export function visibleCards(
  leaves: readonly ChoirCard[],
  tray: CardTray,
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
): ChoirCard[] {
  const text = query.trim().toLowerCase();
  const readerOn = reader === "all" ? "" : reader.trim().toLowerCase();
  const inkOn = ink === "all" ? "" : clothOf(ink);
  const paceOn = pace === "all" ? "" : tempoOf(pace);
  const folioOn = folio === "all" ? "" : activeVerse(folio);
  const marginOn = margin === "all" ? "" : activeBar(margin);
  const quireOn = quire === "all" ? "" : activeMeasure(quire);
  return readChoirCards(leaves).filter((leaf) => {
    if (!inTray(leaf, tray)) return false;
    if (text && !`${leaf.title} ${leaf.note}`.toLowerCase().includes(text)) return false;
    if (readerOn && leaf.reader.toLowerCase() !== readerOn) return false;
    if (inkOn && leaf.ink !== inkOn) return false;
    if (paceOn && leaf.pace !== paceOn) return false;
    if (folioOn === "peak" && !peakVerse(leaf.folio)) return false;
    if (folioOn === "quiet" && !quietVerse(leaf.folio)) return false;
    if (folioOn && folioOn !== "peak" && folioOn !== "quiet" && leaf.folio !== folioOn) return false;
    if (marginOn && String(leaf.margin ?? "") !== marginOn) return false;
    if (quireOn && String(leaf.quire) !== quireOn) return false;
    if (houseOnly && !houseCloth(leaf.ink)) return false;
    if (peakOnly && !peakVerse(leaf.folio)) return false;
    if (quietOnly && !quietVerse(leaf.folio)) return false;
    return true;
  });
}

export function sortCards(leaves: readonly ChoirCard[], sort: CardSort): ChoirCard[] {
  return leaves.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "reader") {
      const reader = a.reader.localeCompare(b.reader);
      if (reader) return reader;
    }
    const folio = (verseIndex(a.folio) < 0 ? 99 : verseIndex(a.folio)) - (verseIndex(b.folio) < 0 ? 99 : verseIndex(b.folio));
    if (folio) return folio;
    return a.title.localeCompare(b.title);
  });
}

export function cardCounts(leaves: readonly ChoirCard[], shown: readonly ChoirCard[], deskFolio: unknown): CardCounts {
  const open = leaves.filter((leaf) => inTray(leaf, "open"));
  void shown;
  return {
    open: open.length,
    held: leaves.filter((leaf) => inTray(leaf, "held")).length,
    shelved: leaves.filter((leaf) => inTray(leaf, "shelved")).length,
    pinned: open.filter((leaf) => leaf.pinned).length,
    peak: open.filter((leaf) => peakVerse(leaf.folio)).length,
    quiet: open.filter((leaf) => quietVerse(leaf.folio)).length,
    soon: open.filter((leaf) => leaf.margin === 6).length,
    quire: open.reduce((sum, leaf) => sum + leaf.quire, 0),
    house: open.filter((leaf) => houseCloth(leaf.ink)).length,
    margin: open.filter((leaf) => leaf.margin !== null).length,
    matched: open.filter((leaf) => leaf.folio && leaf.folio === verseOf(deskFolio)).length,
    flagged: open.filter((leaf) => leaf.flagged).length,
    idle: open.filter((leaf) => idleCard(leaf)).length,
    rush: open.filter((leaf) => rushCard(leaf)).length,
    resting: open.filter((leaf) => restingCard(leaf)).length,
    overdue: open.filter((leaf) => overdueCard(leaf)).length,
  };
}

export function clashVerseCount(leaves: readonly ChoirCard[]): number {
  const open = leaves.filter((leaf) => inTray(leaf, "open") && leaf.folio);
  return open.filter((leaf) => open.some((other) => other.id !== leaf.id && other.folio === leaf.folio && other.quire === leaf.quire)).length;
}

export function neighborCardCount(leaves: readonly ChoirCard[]): number {
  const open = leaves.filter((leaf) => inTray(leaf, "open") && measureIndex(leaf.quire) >= 0);
  return open.filter((leaf) => open.some((other) => {
    if (other.id === leaf.id) return false;
    const gap = Math.abs(measureIndex(other.quire) - measureIndex(leaf.quire));
    const ring = Math.min(gap, QUIRE_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestSinger(leaves: readonly ChoirCard[]): string {
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

export function reminderCards(leaves: readonly ChoirCard[]): ChoirCard[] {
  return leaves.filter((leaf) => inTray(leaf, "open") && (leaf.margin === 6 || leaf.margin === 12));
}

export function idleCards(leaves: readonly ChoirCard[]): ChoirCard[] {
  return leaves.filter((leaf) => inTray(leaf, "open") && idleCard(leaf));
}

export function cardTimeline(leaves: readonly ChoirCard[]): { quire: number; titles: string[] }[] {
  const open = leaves.filter((leaf) => inTray(leaf, "open"));
  return QUIRE_CYCLE.map((quire) => ({ quire, titles: open.filter((leaf) => leaf.quire === quire).map((leaf) => leaf.title) })).filter((lane) => lane.titles.length);
}

export function cardBars(leaves: readonly ChoirCard[]): { folio: string; count: number }[] {
  const open = leaves.filter((leaf) => inTray(leaf, "open"));
  return CHOIR_VERSES.map((folio) => ({ folio, count: open.filter((leaf) => leaf.folio === folio).length }));
}

export function cardSingers(leaves: readonly ChoirCard[]): string[] {
  const out: string[] = [];
  for (const leaf of leaves) {
    if (!leaf.reader || out.some((item) => item.toLowerCase() === leaf.reader.toLowerCase())) continue;
    out.push(leaf.reader);
  }
  return out;
}

export function cardCopy(leaf: ChoirCard): string {
  return [leaf.title, leaf.reader, leaf.folio, leaf.ink, leaf.pace, leaf.margin ?? "", leaf.quire, leaf.note].filter((item) => item !== "").join(" · ");
}

export function cardShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function cardCsv(leaves: readonly ChoirCard[], deskFolio: unknown): string {
  const lines = ["title,singer,verse,cloth,tempo,bar,measure,tags,pinned,waiting,filed,starred,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const leaf of readChoirCards(leaves)) {
    const gap = verseGap(leaf.folio, deskFolio);
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
      lateCard(leaf, deskFolio) ? "1" : "0",
      idleCard(leaf) ? "1" : "0",
      peakVerse(leaf.folio) ? "1" : "0",
      quietVerse(leaf.folio) ? "1" : "0",
      houseCloth(leaf.ink) ? "1" : "0",
      verseBand(leaf.folio),
      rushCard(leaf) ? "1" : "0",
      restingCard(leaf) ? "1" : "0",
      overdueCard(leaf) ? "1" : "0",
      leaf.audit,
      csvCell(leaf.note),
    ].join(","));
  }
  return lines.join("\n");
}

function crestRecord(raw: CrestValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function crestText(raw: CrestValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = crestRecord(raw);
  if (!row || !("assigneeName" in row)) return "";
  return clip(row.assigneeName, 24);
}

function hasBlocked(raw: CrestValue): boolean {
  const row = crestRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

/** A person name of two to twenty-four marks. Money fields and other objects stay blank. */
function crestName(raw: CrestValue): string {
  if (hasBlocked(raw)) return "";
  const row = crestRecord(raw);
  if (row && !("assigneeName" in row)) return "";
  const text = crestText(raw).replace(/\s+/g, " ").trim();
  if (!/^[A-Za-z][A-Za-z .'-]{1,23}$/.test(text)) return "";
  return text;
}

/** A blocked field clears the crest. A name of two to twenty-four marks is set. */
export function crestState(raw: CrestValue): CrestState {
  if (hasBlocked(raw)) return "";
  const row = crestRecord(raw);
  if (row && !("assigneeName" in row)) return "";
  return crestName(raw) ? "set" : "clear";
}

/** The first letter, the last letter, and the letter count. Ada Lovelace is AE11. */
export function crestStamp(raw: CrestValue): string {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return "";
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  if (compact.length < 2) return "";
  return `${compact.slice(0, 1)}${compact.slice(-1)}${compact.length}`;
}

/** All capitals are the house. Three words are a bench. Two words are a duo. A hyphen links. */
export function crestLane(raw: CrestValue): CrestLane {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return "";
  const words = name.split(/\s+/).filter(Boolean);
  if (name === name.toUpperCase() && name.length >= 3) return "house";
  if (words.length >= 3) return "bench";
  if (words.length === 2) return "duo";
  if (name.includes("-") || name.includes("'")) return "link";
  if (name.length <= 4) return "brief";
  if (name.length >= 14) return "long";
  return "plain";
}

/** Hue follows the first letter. */
export function crestHue(raw: CrestValue): CrestHue {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return "";
  const first = name.toUpperCase().replace(/[^A-Z]/g, "")[0] || "";
  if (!first) return "";
  if (first <= "D") return "ivory";
  if (first <= "H") return "graphite";
  if (first <= "L") return "champagne";
  if (first <= "P") return "ink";
  if (first <= "T") return "vellum";
  return "ash";
}

export function crestBound(raw: CrestValue): boolean {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  return Boolean(name && (name[0] === "A" || name[0] === "a" || name[0] === "M" || name[0] === "m"));
}

export function crestWide(raw: CrestValue): boolean {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return false;
  return name.toUpperCase().replace(/[^A-Z]/g, "").length >= 12;
}

export function crestNotch(raw: CrestValue): boolean {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  return Boolean(name && (name.includes("-") || name.includes("'")));
}

export function crestStep(raw: CrestValue): number {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return 0;
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  return Math.min(7, new Set(compact.split("")).size);
}

export function crestJoin(raw: CrestValue): boolean {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return false;
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  return /(.)\1/.test(compact);
}

export function crestLanes(rows: readonly CrestRow[]): CrestLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = crestLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingCrest(rows: readonly CrestRow[]): string {
  const bars = crestLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingCrestHue(rows: readonly CrestRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = crestHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedCrestCount(rows: readonly CrestRow[]): number {
  const marks = rows.map((row) => crestStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneCrestCount(rows: readonly CrestRow[], lane: CrestLane): number {
  return rows.filter((row) => crestLane(row.note) === lane).length;
}

export function hueCrestCount(rows: readonly CrestRow[], hue: CrestHue): number {
  return rows.filter((row) => crestHue(row.note) === hue).length;
}

export function crestShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCrestLanes(rows: readonly CrestRow[]): string[] {
  return crestLanes(rows).map((line) => line.lane);
}

export function readHiddenCrests(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedCrests(raw: unknown, ids: readonly string[]): string[] {
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
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleCrests(
  rows: readonly CrestRow[],
  lane: string,
  hue: string,
  query: string,
  review: CrestReview,
  reviewed: readonly string[],
  shape: CrestShape,
): CrestRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (crestState(row.note) === "") return false;
    const found = crestLane(row.note);
    const hueName = crestHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${crestText(row.note)} ${crestStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "house" && found !== "house") return false;
    if (shape === "bench" && found !== "bench") return false;
    if (shape === "duo" && found !== "duo") return false;
    if (shape === "link" && found !== "link") return false;
    if (shape === "brief" && found !== "brief") return false;
    if (shape === "long" && found !== "long") return false;
    if (shape === "wide" && !crestWide(row.note)) return false;
    if (shape === "notch" && !crestNotch(row.note)) return false;
    return true;
  });
}

export function crestCopy(raw: CrestValue): string {
  return [crestStamp(raw), crestLane(raw), crestHue(raw)].filter(Boolean).join(" ");
}

export function crestLanesCsv(rows: readonly CrestRow[]): string {
  const lines = ["lane,count"];
  for (const line of crestLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function crestRowsCsv(rows: readonly CrestRow[], reviewed: readonly string[]): string {
  const lines = ["name,stamp,lane,hue,step,join,wide,notch,bound,house,bench,duo,link,brief,long,plain,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (crestState(row.note) !== "set") continue;
    const lane = crestLane(row.note);
    lines.push([
      csvCell(crestName(row.note)),
      crestStamp(row.note),
      lane,
      crestHue(row.note),
      String(crestStep(row.note)),
      crestJoin(row.note) ? "1" : "0",
      crestWide(row.note) ? "1" : "0",
      crestNotch(row.note) ? "1" : "0",
      crestBound(row.note) ? "1" : "0",
      lane === "house" ? "1" : "0",
      lane === "bench" ? "1" : "0",
      lane === "duo" ? "1" : "0",
      lane === "link" ? "1" : "0",
      lane === "brief" ? "1" : "0",
      lane === "long" ? "1" : "0",
      lane === "plain" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
