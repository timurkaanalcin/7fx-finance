/**
 * Salon frames for the gallery desk, and the desk id already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_salon_frame (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   bay integer,
 *   grain text not null default '',
 *   mark text not null default '',
 *   tone text not null default '',
 *   weight integer,
 *   reach integer,
 *   pinned boolean not null default false,
 *   sealed boolean not null default false,
 *   boxed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_desk_plate_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_desk_plate_review (
 *   customer_id text primary key
 * );
 */

export const FRAME_KEY = "crmv4-salon-frames";
export const FRAME_VIEW_KEY = "crmv4-salon-frame-views";
export const PLATE_KEY = "crmv4-desk-plate-hide";
export const PLATE_REVIEW_KEY = "crmv4-desk-plate-review";

export type ChitGrain = "blank" | "wool" | "silk" | "linen";

export type ChitTone = "blank" | "mist" | "honey" | "soot";

export type ChitTray = "open" | "sealed" | "boxed";

export type BayPick = "blank" | "dawn" | "noon" | "dusk" | "peak" | "quiet";

export type Chit = {
  id: string;
  title: string;
  note: string;
  hand: string;
  bay: number | null;
  grain: string;
  mark: string;
  tone: string;
  weight: number | null;
  reach: number | null;
  pinned: boolean;
  sealed: boolean;
  boxed: boolean;
  audit: string;
};

export type ChitView = {
  id: string;
  name: string;
  tray: ChitTray;
  query: string;
  hand: string;
  grain: string;
  mark: string;
  tone: string;
  bay: string;
  weight: string;
  reach: string;
};

export type ChitCounts = {
  open: number;
  sealed: number;
  boxed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type SlipState = "" | "set" | "clear";

export type SlipBand = "" | "tick" | "nick" | "plate" | "banner";

export type SlipDepth = "" | "plain" | "pair" | "stack" | "seam" | "rail" | "figure";

export type SlipShape = "all" | "amp" | "odd";

export type SlipValue =
  | {
      deskId?: unknown;
      failedLoginCount?: unknown;
      loginBlockedAt?: unknown;
      loginBlockedMessage?: unknown;
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
      withdrawalsEnabled?: unknown;
      isTest?: unknown;
      name?: unknown;
      email?: unknown;
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
      retentionNote?: unknown;
      phone?: unknown;
      address?: unknown;
      lastCountry?: unknown;
      registrationCountry?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type SlipRow = { id?: string; note?: SlipValue; label?: string | null };

export type SlipBandLine = { band: string; count: number };

export type SlipDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "glaze", "pin", "unpin", "hang", "lift", "store", "restore", "shift"] as const;

const GRAINS = ["wool", "silk", "linen"] as const;

const TONES = ["mist", "honey", "soot"] as const;

const TONE_ORDER = ["", "mist", "honey", "soot"] as const;

const PICKS = ["blank", "dawn", "noon", "dusk", "peak", "quiet"] as const;

const PEAKS = new Set([2, 5]);

const QUIETS = new Set([1, 3, 6]);

const WEIGHTS = [3, 6, 9] as const;

const REACHES = [5, 9, 12] as const;

const HOME = new Set(["DE", "TR", "AE"]);

const SLIP_BANDS = ["tick", "nick", "plate", "banner"] as const;

const DEPTHS = ["plain", "pair", "stack", "seam", "rail", "figure"] as const;

const STATES = ["set", "clear"] as const;

const SLIP_BLOCK = [
  "city",
  "failedLoginCount",
  "loginBlockedAt",
  "loginBlockedMessage",
  "loginEnabled",
  "tradingEnabled",
  "withdrawalsEnabled",
  "isTest",
  "name",
  "email",
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
  "retentionNote",
  "phone",
  "address",
  "lastCountry",
  "registrationCountry",
] as const;

const CHIT_CAP = 9;

const VIEW_CAP = 6;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ChitTray {
  return raw === "sealed" || raw === "boxed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function grainName(raw: unknown): Exclude<ChitGrain, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GRAINS as readonly string[]).includes(text) ? (text as Exclude<ChitGrain, "blank">) : "";
}

function toneName(raw: unknown): Exclude<ChitTone, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<ChitTone, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function chitLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function chitNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank hand stays blank. It is not filled in. */
export function handLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A mark is exactly two letters. Anything else stays blank. Letters are stored in capitals. */
export function chitMark(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : "";
}

/**
 * A hook is an integer from 1 through 6.
 * A blank value stays unset. 0 and 7 are not hooks.
 * A leading zero is the same hook: 01 is 1, and 06 is 6. 07 is not a hook.
 */
export function bayOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 6) return raw;
  if (typeof raw === "string" && /^(?:[1-6]|0[1-6])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A span is 3, 6, or 9.
 * A blank value stays unset. 0 and 2 are not spans.
 * A leading zero is not a span.
 */
export function weightOf(raw: unknown): number | null {
  if (typeof raw === "number" && (WEIGHTS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:3|6|9)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A cord is 5, 9, or 12. A blank value stays unset. A leading zero is not a cord. */
export function reachOf(raw: unknown): number | null {
  if (typeof raw === "number" && (REACHES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:5|9|12)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Wool, silk, linen, or blank. Anything else is blank. */
export function grainOf(raw: unknown): ChitGrain {
  return grainName(raw) || "blank";
}

/** Mist, honey, soot, or blank. Anything else is blank. */
export function toneOf(raw: unknown): ChitTone {
  return toneName(raw) || "blank";
}

/** Dawn is 1. Noon is 2–4. Dusk is 5–6. An unset hook is blank. */
export function bayBand(bay: unknown): "blank" | "dawn" | "noon" | "dusk" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value === 1) return "dawn";
  if (value <= 4) return "noon";
  return "dusk";
}

/** Peak hooks are 2 and 5. An unset hook is not a peak. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAKS.has(value);
}

/** Quiet hooks are 1, 3, and 6. 2, 4, and 5 are not quiet. An unset hook is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIETS.has(value);
}

/**
 * The shortest signed step from the saved hook to the typed hook.
 * The ring wraps at 6. A step of 3 stays. A step of -3 stays.
 * A positive step means the typed hook is ahead of the frame.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 3) diff -= 6;
  if (diff < -3) diff += 6;
  return diff;
}

/** DE, TR, and AE are home ciphers. A blank cipher is not. */
export function homeMark(mark: unknown): boolean {
  return HOME.has(chitMark(mark));
}

export function readChits(raw: unknown): Chit[] {
  if (!Array.isArray(raw)) return [];
  const out: Chit[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Chit>;
    const id = String(row.id || "").trim();
    const title = chitLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: chitNote(row.note),
      hand: handLabel(row.hand),
      bay: bayOf(row.bay),
      grain: grainName(row.grain),
      mark: chitMark(row.mark),
      tone: toneName(row.tone),
      weight: weightOf(row.weight),
      reach: reachOf(row.reach),
      pinned: row.pinned === true,
      sealed: row.sealed === true,
      boxed: row.boxed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CHIT_CAP);
}

export function addChit(
  cards: readonly Chit[],
  card: {
    id: string;
    title: string;
    note?: string;
    hand?: string;
    bay?: unknown;
    grain?: string;
    mark?: string;
    tone?: string;
    weight?: unknown;
    reach?: unknown;
  },
): Chit[] {
  const current = readChits(cards);
  const id = String(card.id || "").trim();
  const title = chitLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Chit = {
    id,
    title,
    note: chitNote(card.note),
    hand: handLabel(card.hand),
    bay: bayOf(card.bay),
    grain: grainName(card.grain),
    mark: chitMark(card.mark),
    tone: toneName(card.tone),
    weight: weightOf(card.weight),
    reach: reachOf(card.reach),
    pinned: false,
    sealed: false,
    boxed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CHIT_CAP);
}

/** Blank becomes mist. Mist becomes honey, honey becomes soot, and soot returns to mist. */
export function cycleTone(cards: readonly Chit[], id: string): Chit[] {
  return readChits(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TONE_ORDER.indexOf(card.tone as (typeof TONE_ORDER)[number]);
    const next = at < 0 || at >= TONES.length ? TONES[0] : TONES[at % TONES.length];
    if (!next || next === card.tone) return card;
    return { ...card, tone: next, audit: "glaze" };
  });
}

export function setChitPin(cards: readonly Chit[], id: string, pinned: boolean): Chit[] {
  return readChits(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setChitSeal(cards: readonly Chit[], id: string, sealed: boolean): Chit[] {
  return readChits(cards).map((card) => (card.id === id ? { ...card, sealed, audit: sealed ? "hang" : "lift" } : card));
}

export function setChitBoxed(cards: readonly Chit[], id: string, boxed: boolean): Chit[] {
  return readChits(cards).map((card) => (card.id === id ? { ...card, boxed, audit: boxed ? "store" : "restore" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editChit(cards: readonly Chit[], id: string, title: string): Chit[] {
  const current = readChits(cards);
  const next = chitLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editChitNote(cards: readonly Chit[], id: string, note: string): Chit[] {
  const current = readChits(cards);
  const next = chitNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkChitPin(cards: readonly Chit[], ids: readonly string[], pinned: boolean): Chit[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readChits(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkChitBox(cards: readonly Chit[], ids: readonly string[], boxed: boolean): Chit[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readChits(cards).map((card) => (want.has(card.id) ? { ...card, boxed, audit: boxed ? "store" : "restore" } : card));
}

/** A blank or unknown grain is left out. A chit already at that grain is left as it is. */
export function bulkChitGrain(cards: readonly Chit[], ids: readonly string[], grain: string): Chit[] {
  const name = grainName(grain);
  const current = readChits(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.grain !== name ? { ...card, grain: name, audit: "shift" } : card));
}

export function resetChits(): Chit[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function chitCopy(raw: unknown): string {
  return chitLine(raw);
}

function inTray(card: Chit, tray: ChitTray): boolean {
  if (tray === "boxed") return card.boxed;
  if (tray === "sealed") return card.sealed && !card.boxed;
  return !card.sealed && !card.boxed;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

function toneScore(tone: string): number {
  if (tone === "soot") return 3;
  if (tone === "honey") return 2;
  if (tone === "mist") return 1;
  return 0;
}

function waitingPeak(card: Chit): boolean {
  return peakBay(card.bay) && inTray(card, "open");
}

function haystack(card: Chit): string {
  return `${card.title}\n${card.note}\n${card.mark}`.toLowerCase();
}

/** An open frame is late when the desk hook is more than one step ahead. */
export function lateChit(card: Chit, desk: unknown): boolean {
  const gap = bayGap(card.bay, desk);
  return inTray(card, "open") && gap !== null && gap > 1;
}

/** An open frame with a cord of 5 is due soon. A hung or stored frame is not. */
export function soonChit(card: Chit): boolean {
  return inTray(card, "open") && card.reach === 5;
}

/** Search matches the title, the note, and the mark. The hand, the bay, and the grain are not part of the query. */
export function visibleChits(
  cards: readonly Chit[],
  tray: ChitTray,
  query: string,
  hand: string | null,
  grain: ChitGrain | null,
  mark: string | null,
  tone: ChitTone | null,
  exact: number | null,
  pick: BayPick | null,
  weight: number | "blank" | null,
  reach: number | "blank" | null,
  inkOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): Chit[] {
  const text = query.trim().toLowerCase();
  const wantHand = hand === null ? null : handLabel(hand);
  const wantMark = mark === null ? null : chitMark(mark);
  return readChits(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (inkOnly && card.tone !== "soot") return false;
      if (wantHand !== null && handLabel(card.hand) !== wantHand) return false;
      if (grain !== null && grainOf(card.grain) !== grain) return false;
      if (wantMark !== null && chitMark(card.mark) !== wantMark) return false;
      if (tone !== null && toneOf(card.tone) !== tone) return false;
      if (!bayHit(card.bay, exact, pick)) return false;
      if (weight === "blank" && card.weight !== null) return false;
      if (typeof weight === "number" && card.weight !== weight) return false;
      if (reach === "blank" && card.reach !== null) return false;
      if (typeof reach === "number" && card.reach !== reach) return false;
      if (peakOnly && !waitingPeak(card)) return false;
      if (homeOnly && !homeMark(card.mark)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (toneScore(a.tone) !== toneScore(b.tone)) return toneScore(b.tone) - toneScore(a.tone);
      return a.title.localeCompare(b.title);
    });
}

/** The bay orders the desk. An unset bay stays at the end. Search matches the title, the note, and the mark. */
export function bayTimeline(cards: readonly Chit[], query: string): Chit[] {
  const text = query.trim().toLowerCase();
  return readChits(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.bay === null && b.bay !== null) return 1;
      if (a.bay !== null && b.bay === null) return -1;
      if (a.bay !== null && b.bay !== null && a.bay !== b.bay) return a.bay - b.bay;
      return a.title.localeCompare(b.title);
    });
}

export function chitCounts(cards: readonly Chit[], desk: unknown): ChitCounts {
  const rows = readChits(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    sealed: rows.filter((card) => inTray(card, "sealed")).length,
    boxed: rows.filter((card) => inTray(card, "boxed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => waitingPeak(card)).length,
    late: rows.filter((card) => lateChit(card, desk)).length,
    soon: rows.filter((card) => soonChit(card)).length,
    home: rows.filter((card) => homeMark(card.mark)).length,
  };
}

/** How many distinct bays the saved chits already use. An unset bay is not counted. */
export function usedBays(cards: readonly Chit[]): number {
  const seen = new Set<number>();
  for (const card of readChits(cards)) if (card.bay !== null) seen.add(card.bay);
  return seen.size;
}

/** Share of the saved chits. A zero total stays at zero. */
export function chitShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function chitHands(cards: readonly Chit[]): string[] {
  const out: string[] = [];
  for (const card of readChits(cards)) {
    if (card.hand && !out.includes(card.hand)) out.push(card.hand);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function chitMarks(cards: readonly Chit[]): string[] {
  const out: string[] = [];
  for (const card of readChits(cards)) {
    if (card.mark && !out.includes(card.mark)) out.push(card.mark);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function chitGrains(cards: readonly Chit[]): Exclude<ChitGrain, "blank">[] {
  const seen = new Set<string>();
  for (const card of readChits(cards)) if (card.grain) seen.add(card.grain);
  return GRAINS.filter((grain) => seen.has(grain));
}

export function chitTones(cards: readonly Chit[]): Exclude<ChitTone, "blank">[] {
  const seen = new Set<string>();
  for (const card of readChits(cards)) if (card.tone) seen.add(card.tone);
  return TONES.filter((tone) => seen.has(tone));
}

/** Open chits already assigned to this hand. A blank hand is not a load. */
export function handLoad(cards: readonly Chit[], hand: string): number {
  const name = handLabel(hand);
  if (!name) return 0;
  return readChits(cards).filter((card) => card.hand === name && inTray(card, "open")).length;
}

/** Three grains. Index 0 is linen. Index 2 is slate. */
export function grainCounts(cards: readonly Chit[]): number[] {
  const rows = readChits(cards);
  return GRAINS.map((grain) => rows.filter((card) => grainOf(card.grain) === grain).length);
}

/** "all" and "blank" stay. A hand that is no longer on a chit falls back to all. */
export function activeHand(filter: string, hands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const hand = handLabel(filter);
  return hand && hands.includes(hand) ? hand : "all";
}

export function handArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return handLabel(filter) || null;
}

/** "all" and "blank" stay. A grain that is no longer on a chit falls back to all. */
export function activeGrain(filter: string, grains: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const grain = grainName(filter);
  return grain && grains.includes(grain) ? grain : "all";
}

export function grainArg(filter: string): ChitGrain | null {
  if (filter === "blank") return "blank";
  return grainName(filter) || null;
}

/** "all" and "blank" stay. A mark that is no longer on a chit falls back to all. */
export function activeMarkCode(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = chitMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markCodeArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return chitMark(filter) || null;
}

/** "all" and "blank" stay. A tone that is no longer on a chit falls back to all. */
export function activeTone(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tone = toneName(filter);
  return tone && tones.includes(tone) ? tone : "all";
}

export function toneArg(filter: string): ChitTone | null {
  if (filter === "blank") return "blank";
  return toneName(filter) || null;
}

/** All, blank, the bands, peak, quiet, and the hooks 1 through 6 stay. Anything else is all. */
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

/** All, blank, and the spans 3, 6, and 9 stay. Anything else is all. */
export function activeWeight(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const weight = weightOf(filter);
  return weight === null ? "all" : String(weight);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

/** All, blank, and the cords 5, 9, and 12 stay. Anything else is all. */
export function activeReach(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const reach = reachOf(filter);
  return reach === null ? "all" : String(reach);
}

export function reachArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return reachOf(filter);
}

/** Other chits with the same grain and the same bay. A blank grain or a blank bay clashes with nothing. */
export function bayClashIds(cards: readonly Chit[], id: string): string[] {
  const rows = readChits(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.grain || card.bay === null) return [];
  return rows
    .filter((item) => item.id !== id && item.grain === card.grain && item.bay === card.bay)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved chits share a grain and a bay with another chit. */
export function clashBayCount(cards: readonly Chit[]): number {
  const rows = readChits(cards);
  return rows.filter((card) => bayClashIds(rows, card.id).length > 0).length;
}

/** Other chits with the same grain and the same weight. A blank grain or a blank weight clashes with nothing. */
export function weightClashIds(cards: readonly Chit[], id: string): string[] {
  const rows = readChits(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.grain || card.weight === null) return [];
  return rows
    .filter((item) => item.id !== id && item.grain === card.grain && item.weight === card.weight)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved chits share a grain and a weight with another chit. */
export function weightClashCount(cards: readonly Chit[]): number {
  const rows = readChits(cards);
  return rows.filter((card) => weightClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open chit at or after the bay you type, skipping ink.
 * After 6, the ring wraps to the earliest open frame that is not soot.
 */
export function nextChit(cards: readonly Chit[], desk: unknown): string {
  const now = bayOf(desk);
  if (now === null) return "";
  const waiting = readChits(cards).filter((card) => inTray(card, "open") && card.bay !== null && card.tone !== "soot");
  if (!waiting.length) return "";
  const byBay = (a: Chit, b: Chit) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.bay ?? 0) >= now).sort(byBay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBay)[0].id;
}

/**
 * The cloth with the fewest open frames.
 * A tie keeps the earlier cloth: wool, then silk, then linen.
 * Frames with no cloth are not a load. An empty desk still suggests wool.
 */
export function suggestGrain(cards: readonly Chit[]): Exclude<ChitGrain, "blank"> {
  const rows = readChits(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<ChitGrain, "blank"> = "wool";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const grain of GRAINS) {
    const count = rows.filter((card) => card.grain === grain).length;
    if (count < bestCount) {
      best = grain;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The hand with the fewest open chits.
 * A tie keeps the earlier name. A blank hand is not a candidate.
 * A desk with no named hand suggests nothing.
 */
export function suggestHand(cards: readonly Chit[]): string {
  const rows = readChits(cards).filter((card) => inTray(card, "open") && card.hand);
  const hands: string[] = [];
  for (const card of rows) {
    if (!hands.includes(card.hand)) hands.push(card.hand);
  }
  hands.sort((a, b) => a.localeCompare(b));
  if (!hands.length) return "";
  let best = hands[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const hand of hands) {
    const count = rows.filter((card) => card.hand === hand).length;
    if (count < bestCount) {
      best = hand;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The cord with the fewest open frames.
 * A tie keeps 9, then 5, then 12, so a cord of 5 is not the first choice.
 * An empty desk still suggests 9.
 */
export function suggestReach(cards: readonly Chit[]): (typeof REACHES)[number] {
  const rows = readChits(cards).filter((card) => inTray(card, "open"));
  const order = [9, 5, 12] as const;
  let best: (typeof REACHES)[number] = 9;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const reach of order) {
    const count = rows.filter((card) => card.reach === reach).length;
    if (count < bestCount) {
      best = reach;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the chits saved in this browser. The gap and the late mark use the bay you pass. */
export function chitsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,hanger,hook,cloth,cipher,glaze,span,cord,band,pinned,hung,stored,gap,late,soon,home,note,audit"];
  for (const card of readChits(raw)) {
    const gap = bayGap(card.bay, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.hand),
      card.bay === null ? "" : String(card.bay),
      card.grain,
      csvCell(card.mark),
      card.tone,
      card.weight === null ? "" : String(card.weight),
      card.reach === null ? "" : String(card.reach),
      bayBand(card.bay),
      card.pinned ? "1" : "0",
      card.sealed ? "1" : "0",
      card.boxed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateChit(card, desk) ? "1" : "0",
      soonChit(card) ? "1" : "0",
      homeMark(card.mark) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function handSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return handLabel(raw) || "all";
}

function grainSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return grainName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return chitMark(raw) || "all";
}

function toneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return toneName(raw) || "all";
}

export function readChitViews(raw: unknown): ChitView[] {
  if (!Array.isArray(raw)) return [];
  const out: ChitView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ChitView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      hand: handSlot(row.hand),
      grain: grainSlot(row.grain),
      mark: markSlot(row.mark),
      tone: toneSlot(row.tone),
      bay: activeBay(String(row.bay || "all")),
      weight: activeWeight(String(row.weight || "all")),
      reach: activeReach(String(row.reach || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addChitView(views: readonly ChitView[], view: ChitView): ChitView[] {
  const current = readChitViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    hand: handSlot(view.hand),
    grain: grainSlot(view.grain),
    mark: markSlot(view.mark),
    tone: toneSlot(view.tone),
    bay: activeBay(view.bay),
    weight: activeWeight(view.weight),
    reach: activeReach(view.reach),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropChitView(views: readonly ChitView[], id: string): ChitView[] {
  return readChitViews(views).filter((view) => view.id !== id);
}

function slipText(raw: unknown): string {
  return clip(raw, 48);
}

function slipBody(value: SlipValue): { text: string; explicit: boolean } | null {
  if (typeof value === "number") return { text: "", explicit: false };
  if (typeof value === "string") return { text: slipText(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: "", explicit: false };
  if (SLIP_BLOCK.some((key) => key in value)) return null;
  if (!("deskId" in value)) return { text: "", explicit: false };
  const inner = value.deskId;
  if (inner === null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: "", explicit: false };
  return { text: slipText(inner), explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set city is text. A clear city is an explicit blank. A missing field stays unmarked.
 * A phone, an address, a registration country, and the other blocked fields are not a city.
 */
export function slipState(value: SlipValue): SlipState {
  const body = slipBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/** The clipped city. A clear or unmarked value stays blank. */
export function slipCopy(value: SlipValue): string {
  const body = slipBody(value);
  return body?.text || "";
}

/**
 * Tick is exactly 1 character. Nick is 2–4. Plate is 5–8. Nine and above is a banner.
 * A blank desk id has no band.
 */
export function slipBand(value: SlipValue): SlipBand {
  const text = slipCopy(value);
  if (!text) return "";
  const length = text.length;
  if (length === 1) return "tick";
  if (length <= 4) return "nick";
  if (length <= 8) return "plate";
  return "banner";
}

/**
 * Figure is any digit. Rail is an underscore and no digit. Seam is a hyphen and no digit.
 * Stack is three words or more. Pair is two words. One word is plain.
 * A blank desk id has no depth.
 */
export function slipDepth(value: SlipValue): SlipDepth {
  const text = slipCopy(value);
  if (!text) return "";
  if (/\d/.test(text)) return "figure";
  if (text.includes("_")) return "rail";
  if (text.includes("-")) return "seam";
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 3) return "stack";
  if (words === 2) return "pair";
  return "plain";
}

/** How many words the city text carries. A blank city stays at zero. */
export function slipWords(value: SlipValue): number {
  const text = slipCopy(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** A desk id that contains # is a hash plate. Other marks are not. */
export function ampSlip(value: SlipValue): boolean {
  return slipCopy(value).includes("#");
}

/** A set desk id with an odd digit count. An even count is not odd. Letters do not count. */
export function oddSlip(value: SlipValue): boolean {
  const digits = slipCopy(value).replace(/\D/g, "");
  return Boolean(digits) && digits.length % 2 === 1;
}

export function slipBands(rows: readonly SlipRow[]): SlipBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = slipState(row.note);
    if (state === "") continue;
    const band = state === "set" ? slipBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: SlipBandLine[] = [];
  for (const band of ["", ...SLIP_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function slipDepths(rows: readonly SlipRow[]): SlipDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = slipDepth(row.note);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: SlipDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps tick, then nick, plate, and banner. An unmarked field is not a lead. */
export function leadingSlip(rows: readonly SlipRow[]): string {
  const named = slipBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const tie = ["tick", "nick", "plate", "banner"];
  const order = (band: string) => tie.indexOf(band);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps plain, then pair, stack, seam, rail, and figure. A blank desk id is not a lead. */
export function leadingSlipDepth(rows: readonly SlipRow[]): string {
  const named = slipDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** How many set cities have an odd letter count. */
export function oddSlipCount(rows: readonly SlipRow[]): number {
  return rows.filter((row) => slipState(row.note) === "set" && oddSlip(row.note)).length;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function slipShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((SLIP_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentSlips(rows: readonly SlipRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = slipState(row.note);
    const token = state === "set" ? slipBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenSlips(raw: unknown, present: readonly string[]): string[] {
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

export function toggleSlip(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandToken(band);
  if (!token || !present.includes(token)) return readHiddenSlips(hidden, present);
  const current = readHiddenSlips(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleSlipBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSlips(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeSlip(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SLIP_BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function slipArg(filter: string): SlipBand | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (SLIP_BANDS as readonly string[]).includes(filter) ? (filter as SlipBand) : null;
}

/** "all" and "blank" stay. A depth that is no longer loaded falls back to all. */
export function activeSlipDepth(filter: string, depths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (DEPTHS as readonly string[]).includes(filter) && depths.includes(filter) ? filter : "all";
}

export function slipDepthArg(filter: string): SlipDepth | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (DEPTHS as readonly string[]).includes(filter) ? (filter as SlipDepth) : null;
}

function rowId(row: SlipRow): string {
  return String(row.id || "").trim();
}

export function readReviewed(raw: unknown, present: readonly string[]): string[] {
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

export function toggleReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewed(reviewed, present);
  const current = readReviewed(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewed(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the depth, and the city are not part of the query. */
export function visibleSlipCustomers<T extends SlipRow>(
  rows: readonly T[],
  band: SlipBand | "blank" | null,
  depth: SlipDepth | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: SlipShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = slipState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && slipBand(row.note) !== band) return false;
    if (depth !== null && slipDepth(row.note) !== depth) return false;
    if (shape === "amp" && !ampSlip(row.note)) return false;
    if (shape === "odd" && (state !== "set" || !oddSlip(row.note))) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function slipsCsv(rows: readonly SlipRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = slipState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of slipBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of slipDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  lines.push(["shape", "odd", String(oddSlipCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function slipRowsCsv(rows: readonly SlipRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,depth,words,hash,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(slipBand(row.note)),
      csvCell(slipDepth(row.note)),
      String(slipWords(row.note)),
      ampSlip(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}

export const CHIT_GRAINS = GRAINS;
export const SLIP_BAND_NAMES = ["tick", "nick", "plate", "banner"] as const;
