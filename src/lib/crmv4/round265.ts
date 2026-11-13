/**
 * Loom spools for a tailor follow-up book, and invite plates already stored as referralCodeUsed.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_loom_spool (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   weaver text not null default '',
 *   frame text not null default '',
 *   dye text not null default '',
 *   shuttle text not null default '',
 *   wait_min integer,
 *   rank_no integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   paused boolean not null default false,
 *   sealed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_invite_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_invite_review (
 *   trader_id text primary key
 * );
 */

export const LOM_KEY = "crmv4-loom-spool";
export const LOM_VIEW_KEY = "crmv4-loom-views";
export const LOM_DENSITY_KEY = "crmv4-loom-density";
export const IVT_KEY = "crmv4-invite-hide";
export const IVT_REVIEW_KEY = "crmv4-invite-review";

export const LOOM_FRAMES = ["warp", "weft", "reed", "beam"] as const;

export type LoomFrame = (typeof LOOM_FRAMES)[number];

export type DyeName = "blank" | "flax" | "wool" | "silk";

export type ShuttleName = "blank" | "draw" | "beat" | "rest";

export type LoomTray = "open" | "pause" | "seal";

export type LoomDensity = "roomy" | "close";

export type LoomSort = "frame" | "weaver";

export type LoomSlip = {
  id: string;
  title: string;
  note: string;
  weaver: string;
  frame: string;
  wait: number | null;
  dye: string;
  shuttle: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  paused: boolean;
  sealed: boolean;
  flagged: boolean;
  audit: string;
};

export type LoomView = {
  id: string;
  name: string;
  tray: LoomTray;
  query: string;
  weaver: string;
  dye: string;
  shuttle: string;
  frame: string;
  wait: string;
  rank: string;
};

export type LoomCounts = {
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

export type InviteLane = "" | "seal" | "card" | "mark" | "seam";

export type InviteHue = "" | "ivory" | "graphite" | "champagne";

export type InviteState = "" | "clear" | "set";

export type InviteShape = "all" | "seal" | "card" | "mark" | "seam" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type InviteReview = "all" | "reviewed" | "fresh";

export type InviteValue = string | { referralCodeUsed?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type InviteRow = { id: string; label: string; note: InviteValue };

export type InviteLaneLine = { lane: string; count: number };

export const ROUND265_FEATURES = [
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
  "fair-weaver",
  "viewer",
  "suggest",
  "sla",
  "invite",
  "invite-csv",
] as const;

const AUDITS = ["save", "edit", "note", "shuttle", "pin", "unpin", "pause", "resume", "seal", "open", "dye", "tag", "rank", "wait", "short", "flag"] as const;

const DYES = ["flax", "wool", "silk"] as const;

const SHUTTLES = ["draw", "beat", "rest"] as const;

const WAIT_CYCLE = [10, 20, 40] as const;

const RANK_CYCLE = [2, 4, 6, 8] as const;

const PEAK = new Set(["warp", "reed"]);

const QUIET = new Set(["weft", "beam"]);

const HOUSE = new Set(["FLAX", "SILK"]);

const EARLY = new Set(["warp", "weft"]);

const LANE_ORDER = ["seal", "card", "mark", "seam"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["invite", "guest"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LoomTray {
  return raw === "pause" || raw === "seal" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function dyeName(raw: unknown): Exclude<DyeName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (DYES as readonly string[]).includes(text) ? (text as Exclude<DyeName, "blank">) : "";
}

function shuttleName(raw: unknown): Exclude<ShuttleName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SHUTTLES as readonly string[]).includes(text) ? (text as Exclude<ShuttleName, "blank">) : "";
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

function inTray(card: LoomSlip, tray: LoomTray): boolean {
  if (tray === "pause") return card.paused && !card.sealed;
  if (tray === "seal") return card.sealed;
  return !card.paused && !card.sealed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function frameIndex(frame: string): number {
  return LOOM_FRAMES.indexOf(frame as LoomFrame);
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

export function frameOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (LOOM_FRAMES as readonly string[]).includes(text) ? text : "";
}

/** The loom wait is 10, 20, or 40 minutes. Anything else stays blank. */
export function loomWait(raw: unknown): 10 | 20 | 40 | null {
  const value = Number(clip(raw, 2));
  return (WAIT_CYCLE as readonly number[]).includes(value) ? (value as 10 | 20 | 40) : null;
}

/** Rank is 2, 4, 6, or 8. Anything else stays blank. */
export function loomRank(raw: unknown): 2 | 4 | 6 | 8 | null {
  const value = Number(clip(raw, 1));
  return (RANK_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 6 | 8) : null;
}

/** Dye is flax, wool, or silk. The saved dye is FLAX, WOOL, or SILK. */
export function dyeOf(raw: unknown): string {
  const text = dyeName(raw);
  return text ? text.toUpperCase() : "";
}

/** Shuttle is draw, beat, or rest. A blank shuttle stays blank. */
export function shuttleOf(raw: unknown): string {
  return shuttleName(raw);
}

export function peakFrame(frame: unknown): boolean {
  return PEAK.has(clip(frame, 12).toLowerCase());
}

export function quietFrame(frame: unknown): boolean {
  return QUIET.has(clip(frame, 12).toLowerCase());
}

/** Early is warp and weft. Mid is reed. Late is beam. */
export function frameBand(frame: unknown): string {
  const text = frameOf(frame);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "reed") return "mid";
  return "late";
}

/** Signed distance from the slip frame to the desk frame. */
export function frameGap(from: unknown, to: unknown): number | null {
  const left = frameIndex(frameOf(from));
  const right = frameIndex(frameOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseDye(dye: unknown): boolean {
  return HOUSE.has(dyeOf(dye));
}

export function activeFrame(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return frameOf(text) || "all";
}

export function activeLoomWait(raw: unknown): string {
  const wait = loomWait(raw);
  return wait === null ? "all" : String(wait);
}

export function activeShuttle(raw: unknown, allow: readonly string[]): string {
  const text = shuttleOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeLoomRank(raw: unknown): string {
  const rank = loomRank(raw);
  return rank === null ? "all" : String(rank);
}

export function activeDye(raw: unknown): string {
  const text = dyeName(raw);
  return text || "all";
}

export function moveLoomFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestDye(cards: readonly LoomSlip[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.dye) continue;
    counts.set(card.dye, (counts.get(card.dye) || 0) + 1);
  }
  let best = "FLAX";
  let score = 0;
  for (const dye of ["FLAX", "WOOL", "SILK"]) {
    const count = counts.get(dye) || 0;
    if (count > score) {
      best = dye;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short wait. Afternoon asks for a long one. Saved waits win when any exist. */
export function suggestLoomWait(cards: readonly LoomSlip[], hour: number): 10 | 20 | 40 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.wait === null) continue;
    counts.set(card.wait, (counts.get(card.wait) || 0) + 1);
  }
  let best: 10 | 20 | 40 | null = null;
  let score = 0;
  for (const wait of WAIT_CYCLE) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 7) return 10;
  if (hour < 15) return 20;
  return 40;
}

/** Before the shop opens, suggest the warp. The rest of the day suggests the reed. */
export function suggestFrame(hour: number): LoomFrame {
  return hour < 8 ? "warp" : "reed";
}

/** The weaver with the fewest open unpinned slips. A tie keeps the roster order. */
export function fairLoomWeaver(cards: readonly LoomSlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open") && !card.pinned);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.weaver.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readLooms(raw: unknown): LoomSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: LoomSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LoomSlip>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      weaver: clip(row.weaver, 24),
      frame: frameOf(row.frame),
      wait: loomWait(row.wait),
      dye: dyeOf(row.dye),
      shuttle: shuttleOf(row.shuttle),
      rank: loomRank(row.rank) ?? 2,
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

export function addLoom(
  cards: readonly LoomSlip[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    weaver?: string;
    frame?: string;
    wait?: unknown;
    dye?: string;
    shuttle?: string;
    rank?: unknown;
    tags?: string;
  },
): LoomSlip[] {
  const current = readLooms(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: LoomSlip = {
    id,
    title,
    note: noteOf(card.note),
    weaver: clip(card.weaver, 24),
    frame: frameOf(card.frame),
    wait: loomWait(card.wait),
    dye: dyeOf(card.dye),
    shuttle: shuttleOf(card.shuttle),
    rank: loomRank(card.rank) ?? 2,
    tags: tagsOf(card.tags),
    pinned: false,
    paused: false,
    sealed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly LoomSlip[], id: string, change: (card: LoomSlip) => LoomSlip): LoomSlip[] {
  return readLooms(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly LoomSlip[], ids: readonly string[], change: (card: LoomSlip) => LoomSlip): LoomSlip[] {
  const picked = new Set(ids);
  return readLooms(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editLoom(cards: readonly LoomSlip[], id: string, title: string): LoomSlip[] {
  const next = lineOf(title);
  if (!next) return readLooms(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editLoomNote(cards: readonly LoomSlip[], id: string, note: string): LoomSlip[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setLoomPin(cards: readonly LoomSlip[], id: string, pinned: boolean): LoomSlip[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setLoomPause(cards: readonly LoomSlip[], id: string, paused: boolean): LoomSlip[] {
  return mapCard(cards, id, (card) => (card.paused === paused ? card : { ...card, paused, sealed: paused ? false : card.sealed, audit: paused ? "pause" : "resume" }));
}

export function setLoomSeal(cards: readonly LoomSlip[], id: string, sealed: boolean): LoomSlip[] {
  return mapCard(cards, id, (card) => (card.sealed === sealed ? card : { ...card, sealed, paused: sealed ? false : card.paused, audit: sealed ? "seal" : "open" }));
}

export function setLoomStar(cards: readonly LoomSlip[], id: string, flagged: boolean): LoomSlip[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setLoomDye(cards: readonly LoomSlip[], id: string, dye: unknown): LoomSlip[] {
  const next = dyeOf(dye);
  if (!next) return readLooms(cards);
  return mapCard(cards, id, (card) => (card.dye === next ? card : { ...card, dye: next, audit: "dye" }));
}

/** Shuttle steps draw, beat, rest, then draw again. A blank shuttle starts at draw. */
export function cycleShuttle(cards: readonly LoomSlip[], id: string): LoomSlip[] {
  return mapCard(cards, id, (card) => {
    const at = SHUTTLES.indexOf(card.shuttle as (typeof SHUTTLES)[number]);
    const next = at < 0 ? SHUTTLES[0] : SHUTTLES[(at + 1) % SHUTTLES.length];
    return next === card.shuttle ? card : { ...card, shuttle: next, audit: "shuttle" };
  });
}

export function addLoomTag(cards: readonly LoomSlip[], id: string, tag: string): LoomSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readLooms(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank wait becomes 10, 10 becomes 20, and 20 becomes 40. A wait of 40 stays. */
export function lengthenLoom(cards: readonly LoomSlip[], id: string): LoomSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 40) return card;
    const next = card.wait === 20 ? 40 : card.wait === 10 ? 20 : 10;
    return { ...card, wait: next, audit: "wait" };
  });
}

/** A blank wait becomes 40, 40 becomes 20, and 20 becomes 10. A wait of 10 stays. */
export function shortenLoom(cards: readonly LoomSlip[], id: string): LoomSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 10) return card;
    const next = card.wait === 20 ? 10 : card.wait === 40 ? 20 : 40;
    return { ...card, wait: next, audit: "short" };
  });
}

export function raiseLoom(cards: readonly LoomSlip[], id: string): LoomSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 2, audit: "rank" };
    if (at === RANK_CYCLE.length - 1) return card;
    return { ...card, rank: RANK_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerLoom(cards: readonly LoomSlip[], id: string): LoomSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: RANK_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkLoomPin(cards: readonly LoomSlip[], ids: readonly string[]): LoomSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkLoomSeal(cards: readonly LoomSlip[], ids: readonly string[]): LoomSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, sealed: true, paused: false, audit: "seal" }));
}

export function bulkLoomBeat(cards: readonly LoomSlip[], ids: readonly string[]): LoomSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, shuttle: "beat", audit: "shuttle" }));
}

export function bulkLoomSilk(cards: readonly LoomSlip[], ids: readonly string[]): LoomSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, dye: "SILK", audit: "dye" }));
}

export function bulkLoomTag(cards: readonly LoomSlip[], ids: readonly string[], tag: string): LoomSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readLooms(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly LoomSlip[], ids: readonly string[], index: number, change: (list: readonly LoomSlip[], id: string) => LoomSlip[]): LoomSlip[] {
  const id = ids[index];
  return id ? change(cards, id) : readLooms(cards);
}

export function lengthenLoomFocused(cards: readonly LoomSlip[], ids: readonly string[], index: number): LoomSlip[] {
  return focused(cards, ids, index, lengthenLoom);
}

export function shortenLoomFocused(cards: readonly LoomSlip[], ids: readonly string[], index: number): LoomSlip[] {
  return focused(cards, ids, index, shortenLoom);
}

export function shuttleFocused(cards: readonly LoomSlip[], ids: readonly string[], index: number): LoomSlip[] {
  return focused(cards, ids, index, cycleShuttle);
}

export function raiseLoomFocused(cards: readonly LoomSlip[], ids: readonly string[], index: number): LoomSlip[] {
  return focused(cards, ids, index, raiseLoom);
}

export function lowerLoomFocused(cards: readonly LoomSlip[], ids: readonly string[], index: number): LoomSlip[] {
  return focused(cards, ids, index, lowerLoom);
}

export function pinLoomFocused(cards: readonly LoomSlip[], ids: readonly string[], index: number): LoomSlip[] {
  const id = ids[index];
  if (!id) return readLooms(cards);
  const card = readLooms(cards).find((item) => item.id === id);
  return card ? setLoomPin(cards, id, !card.pinned) : readLooms(cards);
}

export function pauseLoomFocused(cards: readonly LoomSlip[], ids: readonly string[], index: number): LoomSlip[] {
  const id = ids[index];
  if (!id) return readLooms(cards);
  const card = readLooms(cards).find((item) => item.id === id);
  return card ? setLoomPause(cards, id, !card.paused) : readLooms(cards);
}

export function starLoomFocused(cards: readonly LoomSlip[], ids: readonly string[], index: number): LoomSlip[] {
  const id = ids[index];
  if (!id) return readLooms(cards);
  const card = readLooms(cards).find((item) => item.id === id);
  return card ? setLoomStar(cards, id, !card.flagged) : readLooms(cards);
}

export function tagLoomFocused(cards: readonly LoomSlip[], ids: readonly string[], index: number, tag: string): LoomSlip[] {
  const id = ids[index];
  return id ? addLoomTag(cards, id, tag) : readLooms(cards);
}

export function readLoomViews(raw: unknown): LoomView[] {
  if (!Array.isArray(raw)) return [];
  const out: LoomView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LoomView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      weaver: clip(row.weaver, 24),
      dye: activeDye(row.dye),
      shuttle: activeShuttle(row.shuttle, SHUTTLES),
      frame: activeFrame(row.frame),
      wait: activeLoomWait(row.wait),
      rank: activeLoomRank(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addLoomView(
  views: readonly LoomView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    weaver?: string;
    dye?: string;
    shuttle?: string;
    frame?: string;
    wait?: string;
    rank?: string;
  },
): LoomView[] {
  const current = readLoomViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: LoomView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    weaver: clip(view.weaver, 24),
    dye: activeDye(view.dye),
    shuttle: activeShuttle(view.shuttle, SHUTTLES),
    frame: activeFrame(view.frame),
    wait: activeLoomWait(view.wait),
    rank: activeLoomRank(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropLoomView(views: readonly LoomView[], id: string): LoomView[] {
  return readLoomViews(views).filter((view) => view.id !== id);
}

export function loomDensity(raw: unknown): LoomDensity {
  return raw === "close" ? "close" : "roomy";
}

/** A spool more than one frame behind the desk, at rank 2, is late. */
export function lateLoom(card: LoomSlip, deskFrame: unknown): boolean {
  const gap = frameGap(card.frame, deskFrame);
  return card.rank === 2 && gap !== null && gap > 1;
}

export function idleLoom(card: LoomSlip): boolean {
  return card.shuttle === "draw" && quietFrame(card.frame) && card.rank === 2;
}

export function briskLoom(card: LoomSlip): boolean {
  return card.rank === 8 && card.shuttle === "beat" && peakFrame(card.frame);
}

export function restingLoom(card: LoomSlip): boolean {
  return card.wait === 40 && card.shuttle === "rest" && card.frame === "beam";
}

/** A ten-minute wait on a peak frame is overdue unless the spool is pinned. */
export function overdueLoom(card: LoomSlip): boolean {
  return card.wait === 10 && peakFrame(card.frame) && !card.pinned;
}

export function visibleLooms(
  cards: readonly LoomSlip[],
  tray: LoomTray,
  query: string,
  weaver: string,
  dye: string,
  shuttle: string,
  frame: string,
  wait: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): LoomSlip[] {
  const text = query.trim().toLowerCase();
  const weaverOn = weaver === "all" ? "" : weaver.trim().toLowerCase();
  const dyeOn = dye === "all" ? "" : dyeOf(dye);
  const shuttleOn = shuttle === "all" ? "" : shuttleOf(shuttle);
  const frameOn = frame === "all" ? "" : activeFrame(frame);
  const waitOn = wait === "all" ? "" : activeLoomWait(wait);
  const rankOn = rank === "all" ? "" : activeLoomRank(rank);
  return readLooms(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (weaverOn && card.weaver.toLowerCase() !== weaverOn) return false;
    if (dyeOn && card.dye !== dyeOn) return false;
    if (shuttleOn && card.shuttle !== shuttleOn) return false;
    if (frameOn === "peak" && !peakFrame(card.frame)) return false;
    if (frameOn === "quiet" && !quietFrame(card.frame)) return false;
    if (frameOn && frameOn !== "peak" && frameOn !== "quiet" && card.frame !== frameOn) return false;
    if (waitOn && String(card.wait ?? "") !== waitOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseDye(card.dye)) return false;
    if (peakOnly && !peakFrame(card.frame)) return false;
    if (quietOnly && !quietFrame(card.frame)) return false;
    return true;
  });
}

export function sortLooms(cards: readonly LoomSlip[], sort: LoomSort): LoomSlip[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "weaver") {
      const weaver = a.weaver.localeCompare(b.weaver);
      if (weaver) return weaver;
    }
    const frame = (frameIndex(a.frame) < 0 ? 99 : frameIndex(a.frame)) - (frameIndex(b.frame) < 0 ? 99 : frameIndex(b.frame));
    if (frame) return frame;
    return a.title.localeCompare(b.title);
  });
}

export function loomCounts(cards: readonly LoomSlip[], shown: readonly LoomSlip[], deskFrame: unknown): LoomCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    pause: cards.filter((card) => inTray(card, "pause")).length,
    seal: cards.filter((card) => inTray(card, "seal")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakFrame(card.frame)).length,
    quiet: open.filter((card) => quietFrame(card.frame)).length,
    soon: open.filter((card) => card.wait === 10).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseDye(card.dye)).length,
    wait: open.filter((card) => card.wait !== null).length,
    matched: shown.filter((card) => card.frame && card.frame === frameOf(deskFrame)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleLoom(card)).length,
    brisk: open.filter((card) => briskLoom(card)).length,
    resting: open.filter((card) => restingLoom(card)).length,
    overdue: open.filter((card) => overdueLoom(card)).length,
  };
}

export function clashFrameCount(cards: readonly LoomSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.frame);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.frame === card.frame && other.rank === card.rank)).length;
}

export function neighborLoomCount(cards: readonly LoomSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, RANK_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestLoomWeaver(cards: readonly LoomSlip[]): string {
  const open = cards.filter((card) => inTray(card, "open") && card.weaver);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.weaver.toLowerCase() === card.weaver.toLowerCase()).length;
    if (count > score) {
      best = card.weaver;
      score = count;
    }
  }
  return best;
}

export function reminderLooms(cards: readonly LoomSlip[]): LoomSlip[] {
  return cards.filter((card) => inTray(card, "open") && (card.wait === 10 || card.wait === 20));
}

export function idleLooms(cards: readonly LoomSlip[]): LoomSlip[] {
  return cards.filter((card) => inTray(card, "open") && idleLoom(card));
}

export function loomTimeline(cards: readonly LoomSlip[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return RANK_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function loomBars(cards: readonly LoomSlip[]): { frame: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return LOOM_FRAMES.map((frame) => ({ frame, count: open.filter((card) => card.frame === frame).length }));
}

export function loomWeavers(cards: readonly LoomSlip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.weaver || out.some((item) => item.toLowerCase() === card.weaver.toLowerCase())) continue;
    out.push(card.weaver);
  }
  return out;
}

export function loomCopy(card: LoomSlip): string {
  return [card.title, card.weaver, card.frame, card.dye, card.shuttle, card.wait ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function loomShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function loomCsv(cards: readonly LoomSlip[], deskFrame: unknown): string {
  const lines = ["title,weaver,frame,dye,shuttle,wait,rank,tags,pinned,paused,sealed,starred,gap,late,idle,peak,quiet,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readLooms(cards)) {
    const gap = frameGap(card.frame, deskFrame);
    lines.push([
      csvCell(card.title),
      csvCell(card.weaver),
      card.frame,
      card.dye,
      card.shuttle,
      card.wait === null ? "" : String(card.wait),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.paused ? "1" : "0",
      card.sealed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateLoom(card, deskFrame) ? "1" : "0",
      idleLoom(card) ? "1" : "0",
      peakFrame(card.frame) ? "1" : "0",
      quietFrame(card.frame) ? "1" : "0",
      houseDye(card.dye) ? "1" : "0",
      frameBand(card.frame),
      briskLoom(card) ? "1" : "0",
      restingLoom(card) ? "1" : "0",
      overdueLoom(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function inviteRecord(raw: InviteValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: InviteValue): boolean {
  const row = inviteRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type InviteParts = { letters: string; invite: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function inviteText(raw: InviteValue): string {
  if (hasBlocked(raw)) return "";
  const row = inviteRecord(raw);
  if (row && !("referralCodeUsed" in row) && !("code" in row)) return "";
  return row ? clip(row.referralCodeUsed ?? row.code, 32) : clip(raw, 32);
}

function inviteParts(raw: InviteValue): InviteParts | null {
  const text = inviteText(raw);
  if (!/^[A-Za-z][A-Za-z_\/-]{1,15}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 12) return null;
  const seps = (text.match(/[_/\-]/g) || []).length;
  return {
    letters,
    invite: text,
    wide: /_/.test(text),
    notch: /-/.test(text),
    slash: /\//.test(text),
    score: (text.match(/_/g) || []).length,
    seps,
  };
}

/** A blocked field clears the plate. A real invite code is set. A blank or broken code is clear. */
export function inviteState(raw: InviteValue): InviteState {
  if (hasBlocked(raw)) return "";
  const row = inviteRecord(raw);
  if (row && !("referralCodeUsed" in row) && !("code" in row)) return "";
  return inviteParts(raw) ? "set" : "clear";
}

/** CREST is a seal, CODE is a card, a separator is a seam, and a plain word is a mark. */
export function inviteLane(raw: InviteValue): InviteLane {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  if (!parts) return "";
  const key = parts.invite.toLowerCase();
  if (key === "invite") return "seal";
  if (key === "guest") return "card";
  if (parts.seps >= 1) return "seam";
  return "mark";
}

/** The first three letters. */
export function inviteStamp(raw: InviteValue): string {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  return parts ? parts.letters.slice(0, 3).toUpperCase() : "";
}

/** INVITE is champagne, GUEST is graphite, and other codes follow the last letter. */
export function inviteHue(raw: InviteValue): InviteHue {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  if (!parts) return "";
  const lane = inviteLane(raw);
  if (lane === "seal") return "champagne";
  if (lane === "card") return "graphite";
  const code = parts.letters[parts.letters.length - 1].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function inviteTwin(raw: InviteValue): boolean {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function inviteWide(raw: InviteValue): boolean {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function inviteNotch(raw: InviteValue): boolean {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function inviteEcho(raw: InviteValue): boolean {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function inviteLeap(raw: InviteValue): boolean {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  return Boolean(parts && parts.letters.length === 5);
}

export function inviteSlash(raw: InviteValue): boolean {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function inviteKnown(raw: InviteValue): boolean {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.invite.toLowerCase()));
}

export function inviteCap(raw: InviteValue): boolean {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.invite[0] || ""));
}

export function inviteTail(raw: InviteValue): boolean {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function inviteScore(raw: InviteValue): number {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  return parts ? parts.score : 0;
}

export function inviteStep(raw: InviteValue): number {
  const parts = inviteState(raw) === "set" ? inviteParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function inviteLanes(rows: readonly InviteRow[]): InviteLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = inviteLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingInvite(rows: readonly InviteRow[]): string {
  const bars = inviteLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingInviteHue(rows: readonly InviteRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = inviteHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedInviteCount(rows: readonly InviteRow[]): number {
  const marks = rows.map((row) => inviteStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneInviteCount(rows: readonly InviteRow[], lane: InviteLane): number {
  return rows.filter((row) => inviteLane(row.note) === lane).length;
}

export function inviteShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentInviteLanes(rows: readonly InviteRow[]): string[] {
  return inviteLanes(rows).map((line) => line.lane);
}

export function readHiddenInvites(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedInvites(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleInvite(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleInviteReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkInviteReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleInviteLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleInvites(
  rows: readonly InviteRow[],
  lane: string,
  hue: string,
  query: string,
  review: InviteReview,
  reviewed: readonly string[],
  shape: InviteShape,
): InviteRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (inviteState(row.note) === "") return false;
    const found = inviteLane(row.note);
    const hueName = inviteHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${inviteText(row.note)} ${inviteStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "seal" && found !== "seal") return false;
    if (shape === "card" && found !== "card") return false;
    if (shape === "mark" && found !== "mark") return false;
    if (shape === "seam" && found !== "seam") return false;
    if (shape === "wide" && !inviteWide(row.note)) return false;
    if (shape === "notch" && !inviteNotch(row.note)) return false;
    if (shape === "leap" && !inviteLeap(row.note)) return false;
    if (shape === "slash" && !inviteSlash(row.note)) return false;
    if (shape === "twin" && !inviteTwin(row.note)) return false;
    if (shape === "known" && !inviteKnown(row.note)) return false;
    if (shape === "echo" && !inviteEcho(row.note)) return false;
    return true;
  });
}

export function inviteCopy(raw: InviteValue): string {
  return [inviteStamp(raw), inviteLane(raw), inviteHue(raw)].filter(Boolean).join(" ");
}

export function inviteLanesCsv(rows: readonly InviteRow[]): string {
  const lines = ["lane,count"];
  for (const line of inviteLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function inviteRowsCsv(rows: readonly InviteRow[], reviewed: readonly string[]): string {
  const lines = ["name,invite,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (inviteState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(inviteText(row.note)),
      inviteStamp(row.note),
      inviteLane(row.note),
      inviteHue(row.note),
      String(inviteStep(row.note)),
      inviteEcho(row.note) ? "1" : "0",
      inviteWide(row.note) ? "1" : "0",
      inviteNotch(row.note) ? "1" : "0",
      inviteLeap(row.note) ? "1" : "0",
      inviteSlash(row.note) ? "1" : "0",
      inviteTwin(row.note) ? "1" : "0",
      inviteKnown(row.note) ? "1" : "0",
      inviteCap(row.note) ? "1" : "0",
      inviteTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
