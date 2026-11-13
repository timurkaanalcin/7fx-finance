/**
 * Pastry slips for a bakehouse follow-up book, and cipher plates already stored as affiliateC.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_pastry_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   baker text not null default '',
 *   bench text not null default '',
 *   glaze text not null default '',
 *   pace text not null default '',
 *   wait_min integer,
 *   rank_no integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   paused boolean not null default false,
 *   sealed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_cipher_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_cipher_review (
 *   trader_id text primary key
 * );
 */

export const PST_KEY = "crmv4-pastry-slip";
export const PST_VIEW_KEY = "crmv4-pastry-views";
export const PST_DENSITY_KEY = "crmv4-pastry-density";
export const CPH_KEY = "crmv4-cipher-hide";
export const CPH_REVIEW_KEY = "crmv4-cipher-review";

export const PASTRY_BENCHES = ["slab", "peel", "hearth", "loft"] as const;

export type PastryBench = (typeof PASTRY_BENCHES)[number];

export type GlazeName = "blank" | "sugar" | "butter" | "cocoa";

export type PaceName = "blank" | "fold" | "whip" | "rest";

export type PastryTray = "open" | "pause" | "seal";

export type PastryDensity = "roomy" | "close";

export type PastrySort = "bench" | "baker";

export type PastrySlip = {
  id: string;
  title: string;
  note: string;
  baker: string;
  bench: string;
  wait: number | null;
  glaze: string;
  pace: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  paused: boolean;
  sealed: boolean;
  flagged: boolean;
  audit: string;
};

export type PastryView = {
  id: string;
  name: string;
  tray: PastryTray;
  query: string;
  baker: string;
  glaze: string;
  pace: string;
  bench: string;
  wait: string;
  rank: string;
};

export type PastryCounts = {
  open: number;
  pause: number;
  seal: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  rank: number;
  house: number;
  wait: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
};

export type CipherLane = "" | "crest" | "board" | "mark" | "seam";

export type CipherHue = "" | "ivory" | "graphite" | "champagne";

export type CipherState = "" | "clear" | "set";

export type CipherShape = "all" | "crest" | "board" | "mark" | "seam" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type CipherReview = "all" | "reviewed" | "fresh";

export type CipherValue = string | { affiliateC?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type CipherRow = { id: string; label: string; note: CipherValue };

export type CipherLaneLine = { lane: string; count: number };

export const ROUND264_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "wait",
  "seal",
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
  "fair-baker",
  "viewer",
  "suggest",
  "sla",
  "cipher",
  "cipher-csv",
] as const;

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "pause", "resume", "seal", "open", "glaze", "tag", "rank", "wait", "short", "flag"] as const;

const GLASSES = ["sugar", "butter", "cocoa"] as const;

const POURS = ["fold", "whip", "rest"] as const;

const WAIT_CYCLE = [15, 30, 45] as const;

const RANK_CYCLE = [1, 3, 5, 7] as const;

const PEAK = new Set(["slab", "hearth"]);

const QUIET = new Set(["peel", "loft"]);

const HOUSE = new Set(["SUGAR", "COCOA"]);

const EARLY = new Set(["slab", "peel"]);

const LANE_ORDER = ["crest", "board", "mark", "seam"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["crest", "code"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): PastryTray {
  return raw === "pause" || raw === "seal" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glazeName(raw: unknown): Exclude<GlazeName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GLASSES as readonly string[]).includes(text) ? (text as Exclude<GlazeName, "blank">) : "";
}

function paceName(raw: unknown): Exclude<PaceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (POURS as readonly string[]).includes(text) ? (text as Exclude<PaceName, "blank">) : "";
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

function inTray(card: PastrySlip, tray: PastryTray): boolean {
  if (tray === "pause") return card.paused && !card.sealed;
  if (tray === "seal") return card.sealed;
  return !card.paused && !card.sealed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function benchIndex(bench: string): number {
  return PASTRY_BENCHES.indexOf(bench as PastryBench);
}

function rankIndex(rank: number): number {
  return RANK_CYCLE.indexOf(rank as (typeof RANK_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function benchOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (PASTRY_BENCHES as readonly string[]).includes(text) ? text : "";
}

/** The pastry wait is 15, 30, or 45 minutes. Anything else stays blank. */
export function pastryWait(raw: unknown): 15 | 30 | 45 | null {
  const value = Number(clip(raw, 2));
  return (WAIT_CYCLE as readonly number[]).includes(value) ? (value as 15 | 30 | 45) : null;
}

/** Rank is 1, 3, 5, or 7. Anything else stays blank. */
export function pastryRank(raw: unknown): 1 | 3 | 5 | 7 | null {
  const value = Number(clip(raw, 1));
  return (RANK_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 7) : null;
}

/** Glaze is flint, green, or amber. The saved glaze is FLINT, GREEN, or AMBER. */
export function glazeOf(raw: unknown): string {
  const text = glazeName(raw);
  return text ? text.toUpperCase() : "";
}

/** Pace is still, spark, or cask. A blank pace stays blank. */
export function paceOf(raw: unknown): string {
  return paceName(raw);
}

export function peakBench(bench: unknown): boolean {
  return PEAK.has(clip(bench, 12).toLowerCase());
}

export function quietBench(bench: unknown): boolean {
  return QUIET.has(clip(bench, 12).toLowerCase());
}

/** Early is slab and peel. Mid is hearth. Late is loft. */
export function benchBand(bench: unknown): string {
  const text = benchOf(bench);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "hearth") return "mid";
  return "late";
}

/** Signed distance from the slip bench to the desk bench. */
export function benchGap(from: unknown, to: unknown): number | null {
  const left = benchIndex(benchOf(from));
  const right = benchIndex(benchOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseGlaze(glaze: unknown): boolean {
  return HOUSE.has(glazeOf(glaze));
}

export function activeBench(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return benchOf(text) || "all";
}

export function activePastryWait(raw: unknown): string {
  const wait = pastryWait(raw);
  return wait === null ? "all" : String(wait);
}

export function activePace(raw: unknown, allow: readonly string[]): string {
  const text = paceOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePastryRank(raw: unknown): string {
  const rank = pastryRank(raw);
  return rank === null ? "all" : String(rank);
}

export function activeGlaze(raw: unknown): string {
  const text = glazeName(raw);
  return text || "all";
}

export function movePastryFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestGlaze(cards: readonly PastrySlip[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.glaze) continue;
    counts.set(card.glaze, (counts.get(card.glaze) || 0) + 1);
  }
  let best = "SUGAR";
  let score = 0;
  for (const glaze of ["SUGAR", "BUTTER", "COCOA"]) {
    const count = counts.get(glaze) || 0;
    if (count > score) {
      best = glaze;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short wait. Afternoon asks for a long one. Saved waits win when any exist. */
export function suggestPastryWait(cards: readonly PastrySlip[], hour: number): 15 | 30 | 45 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.wait === null) continue;
    counts.set(card.wait, (counts.get(card.wait) || 0) + 1);
  }
  let best: 15 | 30 | 45 | null = null;
  let score = 0;
  for (const wait of WAIT_CYCLE) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 15;
  if (hour < 14) return 30;
  return 45;
}

/** Quiet hours suggest the slab. The rest of the day suggests the hearth. */
export function suggestBench(hour: number): PastryBench {
  return hour < 9 ? "slab" : "hearth";
}

/** The baker with the fewest open unpinned slips. A tie keeps the roster order. */
export function fairPastryBaker(cards: readonly PastrySlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open") && !card.pinned);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.baker.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readButteries(raw: unknown): PastrySlip[] {
  if (!Array.isArray(raw)) return [];
  const out: PastrySlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PastrySlip>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      baker: clip(row.baker, 24),
      bench: benchOf(row.bench),
      wait: pastryWait(row.wait),
      glaze: glazeOf(row.glaze),
      pace: paceOf(row.pace),
      rank: pastryRank(row.rank) ?? 1,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      paused: row.paused === true,
      sealed: row.sealed === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addPastry(
  cards: readonly PastrySlip[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    baker?: string;
    bench?: string;
    wait?: unknown;
    glaze?: string;
    pace?: string;
    rank?: unknown;
    tags?: string;
  },
): PastrySlip[] {
  const current = readButteries(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: PastrySlip = {
    id,
    title,
    note: noteOf(card.note),
    baker: clip(card.baker, 24),
    bench: benchOf(card.bench),
    wait: pastryWait(card.wait),
    glaze: glazeOf(card.glaze),
    pace: paceOf(card.pace),
    rank: pastryRank(card.rank) ?? 1,
    tags: tagsOf(card.tags),
    pinned: false,
    paused: false,
    sealed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly PastrySlip[], id: string, change: (card: PastrySlip) => PastrySlip): PastrySlip[] {
  return readButteries(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly PastrySlip[], ids: readonly string[], change: (card: PastrySlip) => PastrySlip): PastrySlip[] {
  const picked = new Set(ids);
  return readButteries(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editPastry(cards: readonly PastrySlip[], id: string, title: string): PastrySlip[] {
  const next = lineOf(title);
  if (!next) return readButteries(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editPastryNote(cards: readonly PastrySlip[], id: string, note: string): PastrySlip[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setPastryPin(cards: readonly PastrySlip[], id: string, pinned: boolean): PastrySlip[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setPastryPause(cards: readonly PastrySlip[], id: string, paused: boolean): PastrySlip[] {
  return mapCard(cards, id, (card) => (card.paused === paused ? card : { ...card, paused, sealed: paused ? false : card.sealed, audit: paused ? "pause" : "resume" }));
}

export function setPastrySeal(cards: readonly PastrySlip[], id: string, sealed: boolean): PastrySlip[] {
  return mapCard(cards, id, (card) => (card.sealed === sealed ? card : { ...card, sealed, paused: sealed ? false : card.paused, audit: sealed ? "seal" : "open" }));
}

export function setPastryStar(cards: readonly PastrySlip[], id: string, flagged: boolean): PastrySlip[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setPastryGlaze(cards: readonly PastrySlip[], id: string, glaze: unknown): PastrySlip[] {
  const next = glazeOf(glaze);
  if (!next) return readButteries(cards);
  return mapCard(cards, id, (card) => (card.glaze === next ? card : { ...card, glaze: next, audit: "glaze" }));
}

/** Pace steps still, spark, cask, then still again. A blank pace starts at still. */
export function cyclePace(cards: readonly PastrySlip[], id: string): PastrySlip[] {
  return mapCard(cards, id, (card) => {
    const at = POURS.indexOf(card.pace as (typeof POURS)[number]);
    const next = at < 0 ? POURS[0] : POURS[(at + 1) % POURS.length];
    return next === card.pace ? card : { ...card, pace: next, audit: "pace" };
  });
}

export function addPastryTag(cards: readonly PastrySlip[], id: string, tag: string): PastrySlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readButteries(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank wait becomes 15, 15 becomes 30, and 30 becomes 45. A wait of 45 stays. */
export function lengthenPastry(cards: readonly PastrySlip[], id: string): PastrySlip[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 45) return card;
    const next = card.wait === 30 ? 45 : card.wait === 15 ? 30 : 15;
    return { ...card, wait: next, audit: "wait" };
  });
}

/** A blank wait becomes 45, 45 becomes 30, and 30 becomes 15. A wait of 15 stays. */
export function shortenPastry(cards: readonly PastrySlip[], id: string): PastrySlip[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 15) return card;
    const next = card.wait === 30 ? 15 : card.wait === 45 ? 30 : 45;
    return { ...card, wait: next, audit: "short" };
  });
}

export function raisePastry(cards: readonly PastrySlip[], id: string): PastrySlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 1, audit: "rank" };
    if (at === RANK_CYCLE.length - 1) return card;
    return { ...card, rank: RANK_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerPastry(cards: readonly PastrySlip[], id: string): PastrySlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: RANK_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkPastryPin(cards: readonly PastrySlip[], ids: readonly string[]): PastrySlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkPastrySeal(cards: readonly PastrySlip[], ids: readonly string[]): PastrySlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, sealed: true, paused: false, audit: "seal" }));
}

export function bulkPastryWhip(cards: readonly PastrySlip[], ids: readonly string[]): PastrySlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pace: "whip", audit: "pace" }));
}

export function bulkPastryCocoa(cards: readonly PastrySlip[], ids: readonly string[]): PastrySlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, glaze: "COCOA", audit: "glaze" }));
}

export function bulkPastryTag(cards: readonly PastrySlip[], ids: readonly string[], tag: string): PastrySlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readButteries(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly PastrySlip[], ids: readonly string[], index: number, change: (list: readonly PastrySlip[], id: string) => PastrySlip[]): PastrySlip[] {
  const id = ids[index];
  return id ? change(cards, id) : readButteries(cards);
}

export function lengthenPastryFocused(cards: readonly PastrySlip[], ids: readonly string[], index: number): PastrySlip[] {
  return focused(cards, ids, index, lengthenPastry);
}

export function shortenPastryFocused(cards: readonly PastrySlip[], ids: readonly string[], index: number): PastrySlip[] {
  return focused(cards, ids, index, shortenPastry);
}

export function paceFocused(cards: readonly PastrySlip[], ids: readonly string[], index: number): PastrySlip[] {
  return focused(cards, ids, index, cyclePace);
}

export function raisePastryFocused(cards: readonly PastrySlip[], ids: readonly string[], index: number): PastrySlip[] {
  return focused(cards, ids, index, raisePastry);
}

export function lowerPastryFocused(cards: readonly PastrySlip[], ids: readonly string[], index: number): PastrySlip[] {
  return focused(cards, ids, index, lowerPastry);
}

export function pinPastryFocused(cards: readonly PastrySlip[], ids: readonly string[], index: number): PastrySlip[] {
  const id = ids[index];
  if (!id) return readButteries(cards);
  const card = readButteries(cards).find((item) => item.id === id);
  return card ? setPastryPin(cards, id, !card.pinned) : readButteries(cards);
}

export function pausePastryFocused(cards: readonly PastrySlip[], ids: readonly string[], index: number): PastrySlip[] {
  const id = ids[index];
  if (!id) return readButteries(cards);
  const card = readButteries(cards).find((item) => item.id === id);
  return card ? setPastryPause(cards, id, !card.paused) : readButteries(cards);
}

export function starPastryFocused(cards: readonly PastrySlip[], ids: readonly string[], index: number): PastrySlip[] {
  const id = ids[index];
  if (!id) return readButteries(cards);
  const card = readButteries(cards).find((item) => item.id === id);
  return card ? setPastryStar(cards, id, !card.flagged) : readButteries(cards);
}

export function tagPastryFocused(cards: readonly PastrySlip[], ids: readonly string[], index: number, tag: string): PastrySlip[] {
  const id = ids[index];
  return id ? addPastryTag(cards, id, tag) : readButteries(cards);
}

export function readPastryViews(raw: unknown): PastryView[] {
  if (!Array.isArray(raw)) return [];
  const out: PastryView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PastryView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      baker: clip(row.baker, 24),
      glaze: activeGlaze(row.glaze),
      pace: activePace(row.pace, POURS),
      bench: activeBench(row.bench),
      wait: activePastryWait(row.wait),
      rank: activePastryRank(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addPastryView(
  views: readonly PastryView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    baker?: string;
    glaze?: string;
    pace?: string;
    bench?: string;
    wait?: string;
    rank?: string;
  },
): PastryView[] {
  const current = readPastryViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: PastryView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    baker: clip(view.baker, 24),
    glaze: activeGlaze(view.glaze),
    pace: activePace(view.pace, POURS),
    bench: activeBench(view.bench),
    wait: activePastryWait(view.wait),
    rank: activePastryRank(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropPastryView(views: readonly PastryView[], id: string): PastryView[] {
  return readPastryViews(views).filter((view) => view.id !== id);
}

export function pastryDensity(raw: unknown): PastryDensity {
  return raw === "close" ? "close" : "roomy";
}

/** A slip more than one bench behind the desk, at rank 1, is late. */
export function latePastry(card: PastrySlip, deskBench: unknown): boolean {
  const gap = benchGap(card.bench, deskBench);
  return card.rank === 1 && gap !== null && gap > 1;
}

export function idlePastry(card: PastrySlip): boolean {
  return card.pace === "fold" && quietBench(card.bench) && card.rank === 1;
}

export function briskPastry(card: PastrySlip): boolean {
  return card.rank === 7 && card.pace === "whip" && peakBench(card.bench);
}

export function restingPastry(card: PastrySlip): boolean {
  return card.wait === 45 && card.pace === "rest" && card.bench === "loft";
}

/** A fifteen-minute wait on a peak bench is overdue unless the slip is pinned. */
export function overduePastry(card: PastrySlip): boolean {
  return card.wait === 15 && peakBench(card.bench) && !card.pinned;
}

export function visibleButteries(
  cards: readonly PastrySlip[],
  tray: PastryTray,
  query: string,
  baker: string,
  glaze: string,
  pace: string,
  bench: string,
  wait: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): PastrySlip[] {
  const text = query.trim().toLowerCase();
  const bakerOn = baker === "all" ? "" : baker.trim().toLowerCase();
  const glazeOn = glaze === "all" ? "" : glazeOf(glaze);
  const paceOn = pace === "all" ? "" : paceOf(pace);
  const benchOn = bench === "all" ? "" : activeBench(bench);
  const waitOn = wait === "all" ? "" : activePastryWait(wait);
  const rankOn = rank === "all" ? "" : activePastryRank(rank);
  return readButteries(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (bakerOn && card.baker.toLowerCase() !== bakerOn) return false;
    if (glazeOn && card.glaze !== glazeOn) return false;
    if (paceOn && card.pace !== paceOn) return false;
    if (benchOn === "peak" && !peakBench(card.bench)) return false;
    if (benchOn === "quiet" && !quietBench(card.bench)) return false;
    if (benchOn && benchOn !== "peak" && benchOn !== "quiet" && card.bench !== benchOn) return false;
    if (waitOn && String(card.wait ?? "") !== waitOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseGlaze(card.glaze)) return false;
    if (peakOnly && !peakBench(card.bench)) return false;
    if (quietOnly && !quietBench(card.bench)) return false;
    return true;
  });
}

export function sortButteries(cards: readonly PastrySlip[], sort: PastrySort): PastrySlip[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "baker") {
      const baker = a.baker.localeCompare(b.baker);
      if (baker) return baker;
    }
    const bench = (benchIndex(a.bench) < 0 ? 99 : benchIndex(a.bench)) - (benchIndex(b.bench) < 0 ? 99 : benchIndex(b.bench));
    if (bench) return bench;
    return a.title.localeCompare(b.title);
  });
}

export function pastryCounts(cards: readonly PastrySlip[], shown: readonly PastrySlip[], deskBench: unknown): PastryCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    pause: cards.filter((card) => inTray(card, "pause")).length,
    seal: cards.filter((card) => inTray(card, "seal")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakBench(card.bench)).length,
    quiet: open.filter((card) => quietBench(card.bench)).length,
    soon: open.filter((card) => card.wait === 15).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseGlaze(card.glaze)).length,
    wait: open.filter((card) => card.wait !== null).length,
    matched: shown.filter((card) => card.bench && card.bench === benchOf(deskBench)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idlePastry(card)).length,
    brisk: open.filter((card) => briskPastry(card)).length,
    resting: open.filter((card) => restingPastry(card)).length,
    overdue: open.filter((card) => overduePastry(card)).length,
  };
}

export function clashBenchCount(cards: readonly PastrySlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.bench);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.bench === card.bench && other.rank === card.rank)).length;
}

export function neighborPastryCount(cards: readonly PastrySlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, RANK_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestPastryBaker(cards: readonly PastrySlip[]): string {
  const open = cards.filter((card) => inTray(card, "open") && card.baker);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.baker.toLowerCase() === card.baker.toLowerCase()).length;
    if (count > score) {
      best = card.baker;
      score = count;
    }
  }
  return best;
}

export function reminderButteries(cards: readonly PastrySlip[]): PastrySlip[] {
  return cards.filter((card) => inTray(card, "open") && (card.wait === 15 || card.wait === 30));
}

export function idleButteries(cards: readonly PastrySlip[]): PastrySlip[] {
  return cards.filter((card) => inTray(card, "open") && idlePastry(card));
}

export function pastryTimeline(cards: readonly PastrySlip[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return RANK_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function pastryBars(cards: readonly PastrySlip[]): { bench: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return PASTRY_BENCHES.map((bench) => ({ bench, count: open.filter((card) => card.bench === bench).length }));
}

export function pastryBakers(cards: readonly PastrySlip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.baker || out.some((item) => item.toLowerCase() === card.baker.toLowerCase())) continue;
    out.push(card.baker);
  }
  return out;
}

export function pastryCopy(card: PastrySlip): string {
  return [card.title, card.baker, card.bench, card.glaze, card.pace, card.wait ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function pastryShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function pastryCsv(cards: readonly PastrySlip[], deskBench: unknown): string {
  const lines = ["title,baker,bench,glaze,pace,wait,rank,tags,pinned,paused,sealed,starred,gap,late,idle,peak,quiet,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readButteries(cards)) {
    const gap = benchGap(card.bench, deskBench);
    lines.push([
      csvCell(card.title),
      csvCell(card.baker),
      card.bench,
      card.glaze,
      card.pace,
      card.wait === null ? "" : String(card.wait),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.paused ? "1" : "0",
      card.sealed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      latePastry(card, deskBench) ? "1" : "0",
      idlePastry(card) ? "1" : "0",
      peakBench(card.bench) ? "1" : "0",
      quietBench(card.bench) ? "1" : "0",
      houseGlaze(card.glaze) ? "1" : "0",
      benchBand(card.bench),
      briskPastry(card) ? "1" : "0",
      restingPastry(card) ? "1" : "0",
      overduePastry(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function cipherRecord(raw: CipherValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: CipherValue): boolean {
  const row = cipherRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type CipherParts = { letters: string; cipher: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function cipherText(raw: CipherValue): string {
  if (hasBlocked(raw)) return "";
  const row = cipherRecord(raw);
  if (row && !("affiliateC" in row) && !("code" in row)) return "";
  return row ? clip(row.affiliateC ?? row.code, 32) : clip(raw, 32);
}

function cipherParts(raw: CipherValue): CipherParts | null {
  const text = cipherText(raw);
  if (!/^[A-Za-z][A-Za-z_\/-]{1,15}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 12) return null;
  const seps = (text.match(/[_/\-]/g) || []).length;
  return {
    letters,
    cipher: text,
    wide: /_/.test(text),
    notch: /-/.test(text),
    slash: /\//.test(text),
    score: (text.match(/_/g) || []).length,
    seps,
  };
}

/** A blocked field clears the plate. A real cipher code is set. A blank or broken code is clear. */
export function cipherState(raw: CipherValue): CipherState {
  if (hasBlocked(raw)) return "";
  const row = cipherRecord(raw);
  if (row && !("affiliateC" in row) && !("code" in row)) return "";
  return cipherParts(raw) ? "set" : "clear";
}

/** CREST is a crest, CODE is a board, a separator is a seam, and a plain word is a mark. */
export function cipherLane(raw: CipherValue): CipherLane {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  if (!parts) return "";
  const key = parts.cipher.toLowerCase();
  if (key === "crest") return "crest";
  if (key === "code") return "board";
  if (parts.seps >= 1) return "seam";
  return "mark";
}

/** The first four letters. */
export function cipherStamp(raw: CipherValue): string {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  return parts ? parts.letters.slice(0, 4).toUpperCase() : "";
}

/** A crest is champagne, a board is graphite, and other codes follow the last letter. */
export function cipherHue(raw: CipherValue): CipherHue {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  if (!parts) return "";
  const lane = cipherLane(raw);
  if (lane === "crest") return "champagne";
  if (lane === "board") return "graphite";
  const code = parts.letters[parts.letters.length - 1].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function cipherTwin(raw: CipherValue): boolean {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function cipherWide(raw: CipherValue): boolean {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function cipherNotch(raw: CipherValue): boolean {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function cipherEcho(raw: CipherValue): boolean {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function cipherLeap(raw: CipherValue): boolean {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  return Boolean(parts && parts.letters.length === 6);
}

export function cipherSlash(raw: CipherValue): boolean {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function cipherKnown(raw: CipherValue): boolean {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.cipher.toLowerCase()));
}

export function cipherCap(raw: CipherValue): boolean {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.cipher[0] || ""));
}

export function cipherTail(raw: CipherValue): boolean {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function cipherScore(raw: CipherValue): number {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  return parts ? parts.score : 0;
}

export function cipherStep(raw: CipherValue): number {
  const parts = cipherState(raw) === "set" ? cipherParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function cipherLanes(rows: readonly CipherRow[]): CipherLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = cipherLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingCipher(rows: readonly CipherRow[]): string {
  const bars = cipherLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingCipherHue(rows: readonly CipherRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = cipherHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedCipherCount(rows: readonly CipherRow[]): number {
  const marks = rows.map((row) => cipherStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneCipherCount(rows: readonly CipherRow[], lane: CipherLane): number {
  return rows.filter((row) => cipherLane(row.note) === lane).length;
}

export function cipherShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCipherLanes(rows: readonly CipherRow[]): string[] {
  return cipherLanes(rows).map((line) => line.lane);
}

export function readHiddenCiphers(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedCiphers(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCipher(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleCipherReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCipherReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCipherLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleCiphers(
  rows: readonly CipherRow[],
  lane: string,
  hue: string,
  query: string,
  review: CipherReview,
  reviewed: readonly string[],
  shape: CipherShape,
): CipherRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (cipherState(row.note) === "") return false;
    const found = cipherLane(row.note);
    const hueName = cipherHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${cipherText(row.note)} ${cipherStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "crest" && found !== "crest") return false;
    if (shape === "board" && found !== "board") return false;
    if (shape === "mark" && found !== "mark") return false;
    if (shape === "seam" && found !== "seam") return false;
    if (shape === "wide" && !cipherWide(row.note)) return false;
    if (shape === "notch" && !cipherNotch(row.note)) return false;
    if (shape === "leap" && !cipherLeap(row.note)) return false;
    if (shape === "slash" && !cipherSlash(row.note)) return false;
    if (shape === "twin" && !cipherTwin(row.note)) return false;
    if (shape === "known" && !cipherKnown(row.note)) return false;
    if (shape === "echo" && !cipherEcho(row.note)) return false;
    return true;
  });
}

export function cipherCopy(raw: CipherValue): string {
  return [cipherStamp(raw), cipherLane(raw), cipherHue(raw)].filter(Boolean).join(" ");
}

export function cipherLanesCsv(rows: readonly CipherRow[]): string {
  const lines = ["lane,count"];
  for (const line of cipherLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function cipherRowsCsv(rows: readonly CipherRow[], reviewed: readonly string[]): string {
  const lines = ["name,cipher,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (cipherState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(cipherText(row.note)),
      cipherStamp(row.note),
      cipherLane(row.note),
      cipherHue(row.note),
      String(cipherStep(row.note)),
      cipherEcho(row.note) ? "1" : "0",
      cipherWide(row.note) ? "1" : "0",
      cipherNotch(row.note) ? "1" : "0",
      cipherLeap(row.note) ? "1" : "0",
      cipherSlash(row.note) ? "1" : "0",
      cipherTwin(row.note) ? "1" : "0",
      cipherKnown(row.note) ? "1" : "0",
      cipherCap(row.note) ? "1" : "0",
      cipherTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
