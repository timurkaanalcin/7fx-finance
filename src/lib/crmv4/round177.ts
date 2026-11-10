/**
 * Registry cartouches for the signup desk, and the registration country already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_registry_cartouche (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   clerk text not null default '',
 *   slot integer,
 *   face text not null default '',
 *   code text not null default '',
 *   hue text not null default '',
 *   rank integer,
 *   span integer,
 *   pinned boolean not null default false,
 *   stamped boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_registry_mark_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_registry_mark_review (
 *   customer_id text primary key
 * );
 */

export const CARTOUCHE_KEY = "crmv4-registry-cartouches";
export const CARTOUCHE_VIEW_KEY = "crmv4-registry-cartouche-views";
export const MARK_KEY = "crmv4-registry-mark-hide";
export const MARK_REVIEW_KEY = "crmv4-registry-mark-review";

export type CartoucheFace = "blank" | "cut" | "gilt" | "blind";

export type CartoucheHue = "blank" | "mist" | "sand" | "pitch";

export type CartoucheTray = "open" | "stamped" | "filed";

export type SlotPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type Cartouche = {
  id: string;
  title: string;
  note: string;
  clerk: string;
  slot: number | null;
  face: string;
  code: string;
  hue: string;
  rank: number | null;
  span: number | null;
  pinned: boolean;
  stamped: boolean;
  filed: boolean;
  audit: string;
};

export type CartoucheView = {
  id: string;
  name: string;
  tray: CartoucheTray;
  query: string;
  clerk: string;
  face: string;
  code: string;
  hue: string;
  slot: string;
  rank: string;
  span: string;
};

export type CartoucheCounts = {
  open: number;
  stamped: number;
  filed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type MarkState = "" | "set" | "clear";

export type MarkBand = "" | "iso" | "name" | "title" | "scroll";

export type MarkDepth = "" | "plain" | "pair" | "stack" | "cipher";

export type MarkShape = "all" | "hash" | "odd";

export type MarkValue =
  | {
      registrationCountry?: unknown;
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
      city?: unknown;
      phone?: unknown;
      address?: unknown;
      lastCountry?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type MarkRow = { id?: string; note?: MarkValue; label?: string | null };

export type MarkBandLine = { band: string; count: number };

export type MarkDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "hue", "pin", "unpin", "stamp", "lift", "file", "restore", "shift"] as const;

const FACES = ["cut", "gilt", "blind"] as const;

const HUES = ["mist", "sand", "pitch"] as const;

const HUE_ORDER = ["", "mist", "sand", "pitch"] as const;

const PICKS = ["blank", "early", "mid", "late", "peak", "quiet"] as const;

const PEAKS = new Set([2, 5]);

const QUIETS = new Set([1, 3, 6]);

const RANKS = [1, 2, 4] as const;

const SPANS = [3, 6, 9] as const;

const HOME = new Set(["TR", "DE", "AE"]);

const MARK_BANDS = ["iso", "name", "title", "scroll"] as const;

const DEPTHS = ["plain", "pair", "stack", "cipher"] as const;

const STATES = ["set", "clear"] as const;

const MARK_BLOCK = [
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
  "city",
  "phone",
  "address",
  "lastCountry",
] as const;

const CARTOUCHE_CAP = 9;

const VIEW_CAP = 6;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CartoucheTray {
  return raw === "stamped" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function faceName(raw: unknown): Exclude<CartoucheFace, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (FACES as readonly string[]).includes(text) ? (text as Exclude<CartoucheFace, "blank">) : "";
}

function hueName(raw: unknown): Exclude<CartoucheHue, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (HUES as readonly string[]).includes(text) ? (text as Exclude<CartoucheHue, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function cartoucheLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function cartoucheNote(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank clerk stays blank. It is not filled in. */
export function clerkLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A code is exactly two letters. Anything else stays blank. Letters are stored in capitals. */
export function cartoucheCode(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : "";
}

/**
 * A slot is an integer from 1 through 6.
 * A blank value stays unset. 0 and 7 are not slots.
 * A leading zero is the same slot: 01 is 1, and 06 is 6. 07 is not a slot.
 */
export function slotOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 6) return raw;
  if (typeof raw === "string" && /^(?:[1-6]|0[1-6])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A rank is 1, 2, or 4.
 * A blank value stays unset. 0 and 3 are not ranks.
 * A leading zero is not a rank.
 */
export function rankOf(raw: unknown): number | null {
  if (typeof raw === "number" && (RANKS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:1|2|4)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A span is 3, 6, or 9. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): number | null {
  if (typeof raw === "number" && (SPANS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:3|6|9)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Cut, gilt, blind, or blank. Anything else is blank. */
export function faceOf(raw: unknown): CartoucheFace {
  return faceName(raw) || "blank";
}

/** Mist, sand, pitch, or blank. Anything else is blank. */
export function hueOf(raw: unknown): CartoucheHue {
  return hueName(raw) || "blank";
}

/** Early is 1–2. Mid is 3–4. Late is 5–6. An unset slot is blank. */
export function slotBand(slot: unknown): "blank" | "early" | "mid" | "late" {
  const value = slotOf(slot);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
}

/** Peak slots are 2 and 5. An unset slot is not a peak. */
export function peakSlot(slot: unknown): boolean {
  const value = slotOf(slot);
  return value !== null && PEAKS.has(value);
}

/** Quiet slots are 1, 3, and 6. 2, 4, and 5 are not quiet. An unset slot is not quiet. */
export function quietSlot(slot: unknown): boolean {
  const value = slotOf(slot);
  return value !== null && QUIETS.has(value);
}

/**
 * The shortest signed step from the saved slot to the typed slot.
 * The ring wraps at 6. A step of 3 stays. A step of -3 stays.
 * A positive step means the typed slot is ahead of the cartouche.
 */
export function slotGap(slot: unknown, desk: unknown): number | null {
  const from = slotOf(slot);
  const at = slotOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 3) diff -= 6;
  if (diff < -3) diff += 6;
  return diff;
}

/** TR, DE, and AE are home codes. A blank code is not. */
export function homeCode(code: unknown): boolean {
  return HOME.has(cartoucheCode(code));
}

export function readCartouches(raw: unknown): Cartouche[] {
  if (!Array.isArray(raw)) return [];
  const out: Cartouche[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Cartouche>;
    const id = String(row.id || "").trim();
    const title = cartoucheLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: cartoucheNote(row.note),
      clerk: clerkLabel(row.clerk),
      slot: slotOf(row.slot),
      face: faceName(row.face),
      code: cartoucheCode(row.code),
      hue: hueName(row.hue),
      rank: rankOf(row.rank),
      span: spanOf(row.span),
      pinned: row.pinned === true,
      stamped: row.stamped === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARTOUCHE_CAP);
}

export function addCartouche(
  cards: readonly Cartouche[],
  card: {
    id: string;
    title: string;
    note?: string;
    clerk?: string;
    slot?: unknown;
    face?: string;
    code?: string;
    hue?: string;
    rank?: unknown;
    span?: unknown;
  },
): Cartouche[] {
  const current = readCartouches(cards);
  const id = String(card.id || "").trim();
  const title = cartoucheLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Cartouche = {
    id,
    title,
    note: cartoucheNote(card.note),
    clerk: clerkLabel(card.clerk),
    slot: slotOf(card.slot),
    face: faceName(card.face),
    code: cartoucheCode(card.code),
    hue: hueName(card.hue),
    rank: rankOf(card.rank),
    span: spanOf(card.span),
    pinned: false,
    stamped: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARTOUCHE_CAP);
}

/** Blank becomes mist. Mist becomes sand, sand becomes pitch, and pitch returns to mist. */
export function cycleHue(cards: readonly Cartouche[], id: string): Cartouche[] {
  return readCartouches(cards).map((card) => {
    if (card.id !== id) return card;
    const at = HUE_ORDER.indexOf(card.hue as (typeof HUE_ORDER)[number]);
    const next = at < 0 || at >= HUES.length ? HUES[0] : HUES[at % HUES.length];
    if (!next || next === card.hue) return card;
    return { ...card, hue: next, audit: "hue" };
  });
}

export function setCartouchePin(cards: readonly Cartouche[], id: string, pinned: boolean): Cartouche[] {
  return readCartouches(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setCartoucheStamp(cards: readonly Cartouche[], id: string, stamped: boolean): Cartouche[] {
  return readCartouches(cards).map((card) => (card.id === id ? { ...card, stamped, audit: stamped ? "stamp" : "lift" } : card));
}

export function setCartoucheFiled(cards: readonly Cartouche[], id: string, filed: boolean): Cartouche[] {
  return readCartouches(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "restore" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editCartouche(cards: readonly Cartouche[], id: string, title: string): Cartouche[] {
  const current = readCartouches(cards);
  const next = cartoucheLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editCartoucheNote(cards: readonly Cartouche[], id: string, note: string): Cartouche[] {
  const current = readCartouches(cards);
  const next = cartoucheNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkCartouchePin(cards: readonly Cartouche[], ids: readonly string[], pinned: boolean): Cartouche[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readCartouches(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkCartoucheFile(cards: readonly Cartouche[], ids: readonly string[], filed: boolean): Cartouche[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readCartouches(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "restore" } : card));
}

/** A blank or unknown face is left out. A cartouche already at that face is left as it is. */
export function bulkCartoucheFace(cards: readonly Cartouche[], ids: readonly string[], face: string): Cartouche[] {
  const name = faceName(face);
  const current = readCartouches(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.face !== name ? { ...card, face: name, audit: "shift" } : card));
}

export function resetCartouches(): Cartouche[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function cartoucheCopy(raw: unknown): string {
  return cartoucheLine(raw);
}

function inTray(card: Cartouche, tray: CartoucheTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "stamped") return card.stamped && !card.filed;
  return !card.stamped && !card.filed;
}

function slotHit(slot: number | null, exact: number | null, pick: SlotPick | null): boolean {
  if (exact !== null) return slot === exact;
  if (pick === null) return true;
  if (pick === "blank") return slot === null;
  if (pick === "peak") return peakSlot(slot);
  if (pick === "quiet") return quietSlot(slot);
  return slotBand(slot) === pick;
}

function hueScore(hue: string): number {
  if (hue === "pitch") return 3;
  if (hue === "sand") return 2;
  if (hue === "mist") return 1;
  return 0;
}

function waitingPeak(card: Cartouche): boolean {
  return peakSlot(card.slot) && inTray(card, "open");
}

function haystack(card: Cartouche): string {
  return `${card.title}\n${card.note}\n${card.code}`.toLowerCase();
}

/** An open cartouche is late when the desk slot is more than one step ahead. */
export function lateCartouche(card: Cartouche, desk: unknown): boolean {
  const gap = slotGap(card.slot, desk);
  return inTray(card, "open") && gap !== null && gap > 1;
}

/** An open cartouche with a span of 3 is due soon. A stamped or filed cartouche is not. */
export function soonCartouche(card: Cartouche): boolean {
  return inTray(card, "open") && card.span === 3;
}

/** Search matches the title, the note, and the code. The clerk, the slot, and the face are not part of the query. */
export function visibleCartouches(
  cards: readonly Cartouche[],
  tray: CartoucheTray,
  query: string,
  clerk: string | null,
  face: CartoucheFace | null,
  code: string | null,
  hue: CartoucheHue | null,
  exact: number | null,
  pick: SlotPick | null,
  rank: number | "blank" | null,
  span: number | "blank" | null,
  pitchOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): Cartouche[] {
  const text = query.trim().toLowerCase();
  const wantClerk = clerk === null ? null : clerkLabel(clerk);
  const wantCode = code === null ? null : cartoucheCode(code);
  return readCartouches(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (pitchOnly && card.hue !== "pitch") return false;
      if (wantClerk !== null && clerkLabel(card.clerk) !== wantClerk) return false;
      if (face !== null && faceOf(card.face) !== face) return false;
      if (wantCode !== null && cartoucheCode(card.code) !== wantCode) return false;
      if (hue !== null && hueOf(card.hue) !== hue) return false;
      if (!slotHit(card.slot, exact, pick)) return false;
      if (rank === "blank" && card.rank !== null) return false;
      if (typeof rank === "number" && card.rank !== rank) return false;
      if (span === "blank" && card.span !== null) return false;
      if (typeof span === "number" && card.span !== span) return false;
      if (peakOnly && !waitingPeak(card)) return false;
      if (homeOnly && !homeCode(card.code)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (hueScore(a.hue) !== hueScore(b.hue)) return hueScore(b.hue) - hueScore(a.hue);
      return a.title.localeCompare(b.title);
    });
}

/** The slot orders the desk. An unset slot stays at the end. Search matches the title, the note, and the code. */
export function slotTimeline(cards: readonly Cartouche[], query: string): Cartouche[] {
  const text = query.trim().toLowerCase();
  return readCartouches(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.slot === null && b.slot !== null) return 1;
      if (a.slot !== null && b.slot === null) return -1;
      if (a.slot !== null && b.slot !== null && a.slot !== b.slot) return a.slot - b.slot;
      return a.title.localeCompare(b.title);
    });
}

export function cartoucheCounts(cards: readonly Cartouche[], desk: unknown): CartoucheCounts {
  const rows = readCartouches(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    stamped: rows.filter((card) => inTray(card, "stamped")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => waitingPeak(card)).length,
    late: rows.filter((card) => lateCartouche(card, desk)).length,
    soon: rows.filter((card) => soonCartouche(card)).length,
    home: rows.filter((card) => homeCode(card.code)).length,
  };
}

/** How many distinct slots the saved cartouches already use. An unset slot is not counted. */
export function usedSlots(cards: readonly Cartouche[]): number {
  const seen = new Set<number>();
  for (const card of readCartouches(cards)) if (card.slot !== null) seen.add(card.slot);
  return seen.size;
}

/** Share of the saved cartouches. A zero total stays at zero. */
export function cartoucheShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function cartoucheClerks(cards: readonly Cartouche[]): string[] {
  const out: string[] = [];
  for (const card of readCartouches(cards)) {
    if (card.clerk && !out.includes(card.clerk)) out.push(card.clerk);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function cartoucheCodes(cards: readonly Cartouche[]): string[] {
  const out: string[] = [];
  for (const card of readCartouches(cards)) {
    if (card.code && !out.includes(card.code)) out.push(card.code);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function cartoucheFaces(cards: readonly Cartouche[]): Exclude<CartoucheFace, "blank">[] {
  const seen = new Set<string>();
  for (const card of readCartouches(cards)) if (card.face) seen.add(card.face);
  return FACES.filter((face) => seen.has(face));
}

export function cartoucheHues(cards: readonly Cartouche[]): Exclude<CartoucheHue, "blank">[] {
  const seen = new Set<string>();
  for (const card of readCartouches(cards)) if (card.hue) seen.add(card.hue);
  return HUES.filter((hue) => seen.has(hue));
}

/** Open cartouches already assigned to this clerk. A blank clerk is not a load. */
export function clerkLoad(cards: readonly Cartouche[], clerk: string): number {
  const name = clerkLabel(clerk);
  if (!name) return 0;
  return readCartouches(cards).filter((card) => card.clerk === name && inTray(card, "open")).length;
}

/** Three faces. Index 0 is cut. Index 2 is blind. */
export function faceCounts(cards: readonly Cartouche[]): number[] {
  const rows = readCartouches(cards);
  return FACES.map((face) => rows.filter((card) => faceOf(card.face) === face).length);
}

/** "all" and "blank" stay. A clerk that is no longer on a cartouche falls back to all. */
export function activeClerk(filter: string, clerks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const clerk = clerkLabel(filter);
  return clerk && clerks.includes(clerk) ? clerk : "all";
}

export function clerkArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return clerkLabel(filter) || null;
}

/** "all" and "blank" stay. A face that is no longer on a cartouche falls back to all. */
export function activeFace(filter: string, faces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const face = faceName(filter);
  return face && faces.includes(face) ? face : "all";
}

export function faceArg(filter: string): CartoucheFace | null {
  if (filter === "blank") return "blank";
  return faceName(filter) || null;
}

/** "all" and "blank" stay. A code that is no longer on a cartouche falls back to all. */
export function activeCode(filter: string, codes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const code = cartoucheCode(filter);
  return code && codes.includes(code) ? code : "all";
}

export function codeArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return cartoucheCode(filter) || null;
}

/** "all" and "blank" stay. A hue that is no longer on a cartouche falls back to all. */
export function activeHue(filter: string, hues: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const hue = hueName(filter);
  return hue && hues.includes(hue) ? hue : "all";
}

export function hueArg(filter: string): CartoucheHue | null {
  if (filter === "blank") return "blank";
  return hueName(filter) || null;
}

/** All, blank, the bands, peak, quiet, and the slots 1 through 6 stay. Anything else is all. */
export function activeSlot(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const slot = slotOf(filter);
  return slot === null ? "all" : String(slot);
}

export function slotArg(filter: string): { exact: number | null; pick: SlotPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as SlotPick };
  const slot = slotOf(filter);
  return slot === null ? { exact: null, pick: null } : { exact: slot, pick: null };
}

/** All, blank, and the ranks 1, 2, and 4 stay. Anything else is all. */
export function activeRank(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const rank = rankOf(filter);
  return rank === null ? "all" : String(rank);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

/** All, blank, and the spans 3, 6, and 9 stay. Anything else is all. */
export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const span = spanOf(filter);
  return span === null ? "all" : String(span);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

/** Other cartouches with the same face and the same slot. A blank face or a blank slot clashes with nothing. */
export function slotClashIds(cards: readonly Cartouche[], id: string): string[] {
  const rows = readCartouches(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.face || card.slot === null) return [];
  return rows
    .filter((item) => item.id !== id && item.face === card.face && item.slot === card.slot)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved cartouches share a face and a slot with another cartouche. */
export function clashSlotCount(cards: readonly Cartouche[]): number {
  const rows = readCartouches(cards);
  return rows.filter((card) => slotClashIds(rows, card.id).length > 0).length;
}

/** Other cartouches with the same face and the same rank. A blank face or a blank rank clashes with nothing. */
export function rankClashIds(cards: readonly Cartouche[], id: string): string[] {
  const rows = readCartouches(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.face || card.rank === null) return [];
  return rows
    .filter((item) => item.id !== id && item.face === card.face && item.rank === card.rank)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved cartouches share a face and a rank with another cartouche. */
export function rankClashCount(cards: readonly Cartouche[]): number {
  const rows = readCartouches(cards);
  return rows.filter((card) => rankClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open cartouche at or after the slot you type, skipping pitch.
 * After 6, the ring wraps to the earliest open cartouche that is not pitch.
 */
export function nextCartouche(cards: readonly Cartouche[], desk: unknown): string {
  const now = slotOf(desk);
  if (now === null) return "";
  const waiting = readCartouches(cards).filter((card) => inTray(card, "open") && card.slot !== null && card.hue !== "pitch");
  if (!waiting.length) return "";
  const bySlot = (a: Cartouche, b: Cartouche) => (a.slot ?? 0) - (b.slot ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.slot ?? 0) >= now).sort(bySlot);
  if (later.length) return later[0].id;
  return waiting.slice().sort(bySlot)[0].id;
}

/**
 * The face with the fewest open cartouches.
 * A tie keeps the earlier face: cut, then gilt, then blind.
 * Cartouches with no face are not a load. An empty desk still suggests cut.
 */
export function suggestFace(cards: readonly Cartouche[]): Exclude<CartoucheFace, "blank"> {
  const rows = readCartouches(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<CartoucheFace, "blank"> = "cut";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const face of FACES) {
    const count = rows.filter((card) => card.face === face).length;
    if (count < bestCount) {
      best = face;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The clerk with the fewest open cartouches.
 * A tie keeps the earlier name. A blank clerk is not a candidate.
 * A desk with no named clerk suggests nothing.
 */
export function suggestClerk(cards: readonly Cartouche[]): string {
  const rows = readCartouches(cards).filter((card) => inTray(card, "open") && card.clerk);
  const clerks: string[] = [];
  for (const card of rows) {
    if (!clerks.includes(card.clerk)) clerks.push(card.clerk);
  }
  clerks.sort((a, b) => a.localeCompare(b));
  if (!clerks.length) return "";
  let best = clerks[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const clerk of clerks) {
    const count = rows.filter((card) => card.clerk === clerk).length;
    if (count < bestCount) {
      best = clerk;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open cartouches.
 * A tie keeps 6, then 3, then 9, so a span of 3 is not the first choice.
 * An empty desk still suggests 6.
 */
export function suggestSpan(cards: readonly Cartouche[]): (typeof SPANS)[number] {
  const rows = readCartouches(cards).filter((card) => inTray(card, "open"));
  const order = [6, 3, 9] as const;
  let best: (typeof SPANS)[number] = 6;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const span of order) {
    const count = rows.filter((card) => card.span === span).length;
    if (count < bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cartouches saved in this browser. The gap and the late mark use the slot you pass. */
export function cartouchesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,clerk,slot,face,code,hue,rank,span,band,pinned,stamped,filed,gap,late,soon,home,note,audit"];
  for (const card of readCartouches(raw)) {
    const gap = slotGap(card.slot, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.clerk),
      card.slot === null ? "" : String(card.slot),
      card.face,
      csvCell(card.code),
      card.hue,
      card.rank === null ? "" : String(card.rank),
      card.span === null ? "" : String(card.span),
      slotBand(card.slot),
      card.pinned ? "1" : "0",
      card.stamped ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCartouche(card, desk) ? "1" : "0",
      soonCartouche(card) ? "1" : "0",
      homeCode(card.code) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function clerkSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return clerkLabel(raw) || "all";
}

function faceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return faceName(raw) || "all";
}

function codeSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return cartoucheCode(raw) || "all";
}

function hueSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return hueName(raw) || "all";
}

export function readCartoucheViews(raw: unknown): CartoucheView[] {
  if (!Array.isArray(raw)) return [];
  const out: CartoucheView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CartoucheView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      clerk: clerkSlot(row.clerk),
      face: faceSlot(row.face),
      code: codeSlot(row.code),
      hue: hueSlot(row.hue),
      slot: activeSlot(String(row.slot || "all")),
      rank: activeRank(String(row.rank || "all")),
      span: activeSpan(String(row.span || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCartoucheView(views: readonly CartoucheView[], view: CartoucheView): CartoucheView[] {
  const current = readCartoucheViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    clerk: clerkSlot(view.clerk),
    face: faceSlot(view.face),
    code: codeSlot(view.code),
    hue: hueSlot(view.hue),
    slot: activeSlot(view.slot),
    rank: activeRank(view.rank),
    span: activeSpan(view.span),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropCartoucheView(views: readonly CartoucheView[], id: string): CartoucheView[] {
  return readCartoucheViews(views).filter((view) => view.id !== id);
}

function markText(raw: unknown): string {
  return clip(raw, 48);
}

function markBody(value: MarkValue): { text: string; explicit: boolean } | null {
  if (typeof value === "number") return { text: "", explicit: false };
  if (typeof value === "string") return { text: markText(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: "", explicit: false };
  if (MARK_BLOCK.some((key) => key in value)) return null;
  if (!("registrationCountry" in value)) return { text: "", explicit: false };
  const inner = value.registrationCountry;
  if (inner === null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: "", explicit: false };
  return { text: markText(inner), explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set country is text. A clear country is an explicit blank. A missing field stays unmarked.
 * A phone, an address, and the other blocked fields are not a registration country.
 */
export function markState(value: MarkValue): MarkState {
  const body = markBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/** The clipped registration country. A clear or unmarked value stays blank. */
export function markCopy(value: MarkValue): string {
  const body = markBody(value);
  return body?.text || "";
}

/** Digits in the country text, capped at 8. A clear or unmarked value stays unset. */
export function markDigits(value: MarkValue): string {
  const body = markBody(value);
  if (!body || !body.text) return "";
  return body.text.replace(/\D/g, "").slice(0, 8);
}

/**
 * Iso is exactly 2 characters. Name is 1 or 3–12. Title is 13–32. Thirty-three and above is scroll.
 * A blank country has no band.
 */
export function markBand(value: MarkValue): MarkBand {
  const text = markCopy(value);
  if (!text) return "";
  const length = text.length;
  if (length === 2) return "iso";
  if (length <= 12) return "name";
  if (length <= 32) return "title";
  return "scroll";
}

/**
 * Cipher is any digit. Stack is three words or more. Pair is two words. One word is plain.
 * A blank country has no depth.
 */
export function markDepth(value: MarkValue): MarkDepth {
  const text = markCopy(value);
  if (!text) return "";
  if (/\d/.test(text)) return "cipher";
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 3) return "stack";
  if (words === 2) return "pair";
  return "plain";
}

/** How many words the country text carries. A blank country stays at zero. */
export function markWords(value: MarkValue): number {
  const text = markCopy(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** A country that contains # is a hash mark. Other marks are not. */
export function hashMark(value: MarkValue): boolean {
  return markCopy(value).includes("#");
}

/** A set country with an odd letter count. An even count is not odd. */
export function oddMark(value: MarkValue): boolean {
  const letters = markCopy(value).replace(/[^A-Za-z]/g, "");
  return Boolean(letters) && letters.length % 2 === 1;
}

export function markBands(rows: readonly MarkRow[]): MarkBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = markState(row.note);
    if (state === "") continue;
    const band = state === "set" ? markBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: MarkBandLine[] = [];
  for (const band of ["", ...MARK_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function markDepths(rows: readonly MarkRow[]): MarkDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = markDepth(row.note);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: MarkDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps iso, then name, title, and scroll. An unmarked field is not a lead. */
export function leadingMark(rows: readonly MarkRow[]): string {
  const named = markBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const tie = ["iso", "name", "title", "scroll"];
  const order = (band: string) => tie.indexOf(band);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps plain, then pair, stack, and cipher. A blank country is not a lead. */
export function leadingMarkDepth(rows: readonly MarkRow[]): string {
  const named = markDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** How many set countries have an odd letter count. */
export function oddMarkCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => markState(row.note) === "set" && oddMark(row.note)).length;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function markShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((MARK_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentMarks(rows: readonly MarkRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = markState(row.note);
    const token = state === "set" ? markBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenMarks(raw: unknown, present: readonly string[]): string[] {
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

export function toggleMark(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandToken(band);
  if (!token || !present.includes(token)) return readHiddenMarks(hidden, present);
  const current = readHiddenMarks(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleMarkBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenMarks(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeMark(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (MARK_BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function markArg(filter: string): MarkBand | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (MARK_BANDS as readonly string[]).includes(filter) ? (filter as MarkBand) : null;
}

/** "all" and "blank" stay. A depth that is no longer loaded falls back to all. */
export function activeMarkDepth(filter: string, depths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (DEPTHS as readonly string[]).includes(filter) && depths.includes(filter) ? filter : "all";
}

export function markDepthArg(filter: string): MarkDepth | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (DEPTHS as readonly string[]).includes(filter) ? (filter as MarkDepth) : null;
}

function rowId(row: MarkRow): string {
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
  return out.slice(0, 40);
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
    return next.slice(0, 40);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the depth, and the country are not part of the query. */
export function visibleMarkCustomers<T extends MarkRow>(
  rows: readonly T[],
  band: MarkBand | "blank" | null,
  depth: MarkDepth | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: MarkShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = markState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && markBand(row.note) !== band) return false;
    if (depth !== null && markDepth(row.note) !== depth) return false;
    if (shape === "hash" && !hashMark(row.note)) return false;
    if (shape === "odd" && (state !== "set" || !oddMark(row.note))) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function marksCsv(rows: readonly MarkRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = markState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of markBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of markDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  lines.push(["shape", "odd", String(oddMarkCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function markRowsCsv(rows: readonly MarkRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,depth,words,hash,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(markBand(row.note)),
      csvCell(markDepth(row.note)),
      String(markWords(row.note)),
      hashMark(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}

export const CARTOUCHE_FACES = FACES;
export const MARK_BAND_NAMES = ["iso", "name", "title", "scroll"] as const;
