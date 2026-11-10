/**
 * Local winter trellises for the garden desk, and the phone already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_winter_trellis (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   weaver text not null default '',
 *   height integer,
 *   weave text not null default '',
 *   bay text not null default '',
 *   stain text not null default '',
 *   lean integer,
 *   span integer,
 *   pinned boolean not null default false,
 *   trained boolean not null default false,
 *   stored boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_phone_stem_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_phone_stem_review (
 *   customer_id text primary key
 * );
 */

export const TRELLIS_KEY = "crmv4-winter-trellises";
export const TRELLIS_VIEW_KEY = "crmv4-winter-views";
export const STEM_KEY = "crmv4-phone-stem-hide";
export const STEM_REVIEW_KEY = "crmv4-phone-stem-review";

export type TrellisStain = "blank" | "mist" | "honey" | "ink";

export type TrellisWeave = "blank" | "plain" | "twist" | "braid";

export type TrellisTray = "open" | "trained" | "stored";

export type TrellisPick = "blank" | "low" | "mid" | "high" | "tip" | "cane";

export type Trellis = {
  id: string;
  title: string;
  note: string;
  weaver: string;
  height: number | null;
  weave: string;
  bay: string;
  stain: string;
  lean: number | null;
  span: number | null;
  pinned: boolean;
  trained: boolean;
  stored: boolean;
  audit: string;
};

export type TrellisView = {
  id: string;
  name: string;
  tray: TrellisTray;
  query: string;
  weaver: string;
  weave: string;
  bay: string;
  stain: string;
  height: string;
  lean: string;
  span: string;
};

export type TrellisCounts = {
  open: number;
  trained: number;
  stored: number;
  pinned: number;
  tip: number;
  late: number;
  soon: number;
};

export type StemState = "" | "set" | "clear";

export type StemBand = "" | "short" | "local" | "trunk" | "long";

export type StemDepth = "" | "near" | "mid" | "far";

export type StemShape = "all" | "plus" | "odd";

export type StemValue =
  | {
      phone?: unknown;
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
      address?: unknown;
      lastCountry?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type StemRow = { id?: string; note?: StemValue; label?: string | null };

export type StemBandLine = { band: string; count: number };

export type StemDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "stain", "pin", "unpin", "train", "release", "store", "restore", "shift"] as const;

const WEAVES = ["plain", "twist", "braid"] as const;

const STAINS = ["mist", "honey", "ink"] as const;

const STAIN_ORDER = ["", "mist", "honey", "ink"] as const;

const PICKS = ["blank", "low", "mid", "high", "tip", "cane"] as const;

const TIPS = new Set([1, 8]);

const CANES = new Set([3, 4, 5, 6]);

const LEANS = [1, 2, 3, 4] as const;

const SPANS = [4, 8, 16, 32] as const;

const STEM_BANDS = ["short", "local", "trunk", "long"] as const;

const DEPTHS = ["near", "mid", "far"] as const;

const STATES = ["set", "clear"] as const;

const STEM_BLOCK = [
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
  "address",
  "lastCountry",
] as const;

const TRELLIS_CAP = 8;

const VIEW_CAP = 5;

const DIGIT_CAP = 18;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TrellisTray {
  return raw === "trained" || raw === "stored" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function weaveName(raw: unknown): Exclude<TrellisWeave, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WEAVES as readonly string[]).includes(text) ? (text as Exclude<TrellisWeave, "blank">) : "";
}

function stainName(raw: unknown): Exclude<TrellisStain, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (STAINS as readonly string[]).includes(text) ? (text as Exclude<TrellisStain, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function trellisLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function trellisNote(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank weaver stays blank. It is not filled in. */
export function weaverLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank bay stays blank. It is not filled in. */
export function trellisBay(raw: unknown): string {
  return clip(raw, 5);
}

/**
 * A height is an integer from 1 through 8.
 * A blank value stays unset. 0 and 9 are not heights.
 * A leading zero is the same height: 01 is 1, and 08 is 8. 09 is not a height.
 */
export function heightOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 8) return raw;
  if (typeof raw === "string" && /^(?:[1-8]|0[1-8])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A lean is an integer from 1 through 4.
 * A blank value stays unset. 0 and 5 are not leans.
 * A leading zero is the same lean: 01 is 1.
 */
export function leanOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && (LEANS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:[1-4]|0[1-4])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A span is 4, 8, 16, or 32. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): number | null {
  if (typeof raw === "number" && (SPANS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:4|8|16|32)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Plain, twist, braid, or blank. Anything else is blank. */
export function weaveOf(raw: unknown): TrellisWeave {
  return weaveName(raw) || "blank";
}

/** Mist, honey, ink, or blank. Anything else is blank. */
export function stainOf(raw: unknown): TrellisStain {
  return stainName(raw) || "blank";
}

/** Low is 1–2. Mid is 3–5. High is 6–8. An unset height is blank. */
export function heightBand(height: unknown): "blank" | "low" | "mid" | "high" {
  const value = heightOf(height);
  if (value === null) return "blank";
  if (value <= 2) return "low";
  if (value <= 5) return "mid";
  return "high";
}

/** Tip heights are 1 and 8. An unset height is not a tip. */
export function tipHeight(height: unknown): boolean {
  const value = heightOf(height);
  return value !== null && TIPS.has(value);
}

/** Cane heights are 3 through 6. 2 and 7 are not cane. An unset height is not cane. */
export function caneHeight(height: unknown): boolean {
  const value = heightOf(height);
  return value !== null && CANES.has(value);
}

/**
 * The shortest signed step from the saved height to the typed height.
 * The garden wraps at 8. A step of 4 stays. A step of -4 stays.
 * A positive step means the typed height is ahead of the trellis.
 */
export function heightGap(height: unknown, desk: unknown): number | null {
  const from = heightOf(height);
  const at = heightOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 4) diff -= 8;
  if (diff < -4) diff += 8;
  return diff;
}

export function readTrellises(raw: unknown): Trellis[] {
  if (!Array.isArray(raw)) return [];
  const out: Trellis[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Trellis>;
    const id = String(row.id || "").trim();
    const title = trellisLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: trellisNote(row.note),
      weaver: weaverLabel(row.weaver),
      height: heightOf(row.height),
      weave: weaveName(row.weave),
      bay: trellisBay(row.bay),
      stain: stainName(row.stain),
      lean: leanOf(row.lean),
      span: spanOf(row.span),
      pinned: row.pinned === true,
      trained: row.trained === true,
      stored: row.stored === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, TRELLIS_CAP);
}

export function addTrellis(
  cards: readonly Trellis[],
  card: {
    id: string;
    title: string;
    note?: string;
    weaver?: string;
    height?: unknown;
    weave?: string;
    bay?: string;
    stain?: string;
    lean?: unknown;
    span?: unknown;
  },
): Trellis[] {
  const current = readTrellises(cards);
  const id = String(card.id || "").trim();
  const title = trellisLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Trellis = {
    id,
    title,
    note: trellisNote(card.note),
    weaver: weaverLabel(card.weaver),
    height: heightOf(card.height),
    weave: weaveName(card.weave),
    bay: trellisBay(card.bay),
    stain: stainName(card.stain),
    lean: leanOf(card.lean),
    span: spanOf(card.span),
    pinned: false,
    trained: false,
    stored: false,
    audit: "save",
  };
  return [next, ...current].slice(0, TRELLIS_CAP);
}

/** Blank becomes mist. Mist becomes honey, honey becomes ink, and ink returns to mist. */
export function cycleStain(cards: readonly Trellis[], id: string): Trellis[] {
  return readTrellises(cards).map((card) => {
    if (card.id !== id) return card;
    const at = STAIN_ORDER.indexOf(card.stain as (typeof STAIN_ORDER)[number]);
    const next = at < 0 || at >= STAINS.length ? STAINS[0] : STAINS[at % STAINS.length];
    if (!next || next === card.stain) return card;
    return { ...card, stain: next, audit: "stain" };
  });
}

export function setTrellisPin(cards: readonly Trellis[], id: string, pinned: boolean): Trellis[] {
  return readTrellises(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setTrellisTrain(cards: readonly Trellis[], id: string, trained: boolean): Trellis[] {
  return readTrellises(cards).map((card) => (card.id === id ? { ...card, trained, audit: trained ? "train" : "release" } : card));
}

export function setTrellisStored(cards: readonly Trellis[], id: string, stored: boolean): Trellis[] {
  return readTrellises(cards).map((card) => (card.id === id ? { ...card, stored, audit: stored ? "store" : "restore" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editTrellis(cards: readonly Trellis[], id: string, title: string): Trellis[] {
  const current = readTrellises(cards);
  const next = trellisLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editTrellisNote(cards: readonly Trellis[], id: string, note: string): Trellis[] {
  const current = readTrellises(cards);
  const next = trellisNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkTrellisPin(cards: readonly Trellis[], ids: readonly string[], pinned: boolean): Trellis[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readTrellises(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkTrellisStore(cards: readonly Trellis[], ids: readonly string[], stored: boolean): Trellis[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readTrellises(cards).map((card) => (want.has(card.id) ? { ...card, stored, audit: stored ? "store" : "restore" } : card));
}

/** A blank or unknown weave is left out. A trellis already at that weave is left as it is. */
export function bulkTrellisWeave(cards: readonly Trellis[], ids: readonly string[], weave: string): Trellis[] {
  const name = weaveName(weave);
  const current = readTrellises(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.weave !== name ? { ...card, weave: name, audit: "shift" } : card));
}

export function resetTrellises(): Trellis[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function trellisCopy(raw: unknown): string {
  return trellisLine(raw);
}

function inTray(card: Trellis, tray: TrellisTray): boolean {
  if (tray === "stored") return card.stored;
  if (tray === "trained") return card.trained && !card.stored;
  return !card.trained && !card.stored;
}

function heightHit(height: number | null, exact: number | null, pick: TrellisPick | null): boolean {
  if (exact !== null) return height === exact;
  if (pick === null) return true;
  if (pick === "blank") return height === null;
  if (pick === "tip") return tipHeight(height);
  if (pick === "cane") return caneHeight(height);
  return heightBand(height) === pick;
}

function stainScore(stain: string): number {
  if (stain === "ink") return 3;
  if (stain === "honey") return 2;
  if (stain === "mist") return 1;
  return 0;
}

function waitingTip(card: Trellis): boolean {
  return tipHeight(card.height) && inTray(card, "open");
}

function haystack(card: Trellis): string {
  return `${card.title}\n${card.note}\n${card.bay}`.toLowerCase();
}

/** An open trellis is late when the desk height is more than one step ahead. */
export function lateTrellis(card: Trellis, desk: unknown): boolean {
  const gap = heightGap(card.height, desk);
  return inTray(card, "open") && gap !== null && gap > 1;
}

/** An open trellis with a span of 4 is due soon. A trained or stored trellis is not. */
export function soonTrellis(card: Trellis): boolean {
  return inTray(card, "open") && card.span === 4;
}

/** Search matches the title, the note, and the bay. The weaver, the height, and the weave are not part of the query. */
export function visibleTrellises(
  cards: readonly Trellis[],
  tray: TrellisTray,
  query: string,
  weaver: string | null,
  weave: TrellisWeave | null,
  bay: string | null,
  stain: TrellisStain | null,
  exact: number | null,
  pick: TrellisPick | null,
  lean: number | "blank" | null,
  span: number | "blank" | null,
  inkOnly: boolean,
  tipOnly: boolean,
): Trellis[] {
  const text = query.trim().toLowerCase();
  const wantWeaver = weaver === null ? null : weaverLabel(weaver);
  const wantBay = bay === null ? null : trellisBay(bay);
  return readTrellises(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (inkOnly && card.stain !== "ink") return false;
      if (wantWeaver !== null && weaverLabel(card.weaver) !== wantWeaver) return false;
      if (weave !== null && weaveOf(card.weave) !== weave) return false;
      if (wantBay !== null && trellisBay(card.bay) !== wantBay) return false;
      if (stain !== null && stainOf(card.stain) !== stain) return false;
      if (!heightHit(card.height, exact, pick)) return false;
      if (lean === "blank" && card.lean !== null) return false;
      if (typeof lean === "number" && card.lean !== lean) return false;
      if (span === "blank" && card.span !== null) return false;
      if (typeof span === "number" && card.span !== span) return false;
      if (tipOnly && !waitingTip(card)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (stainScore(a.stain) !== stainScore(b.stain)) return stainScore(b.stain) - stainScore(a.stain);
      return a.title.localeCompare(b.title);
    });
}

/** The height orders the garden. An unset height stays at the end. Search matches the title, the note, and the bay. */
export function heightTimeline(cards: readonly Trellis[], query: string): Trellis[] {
  const text = query.trim().toLowerCase();
  return readTrellises(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.height === null && b.height !== null) return 1;
      if (a.height !== null && b.height === null) return -1;
      if (a.height !== null && b.height !== null && a.height !== b.height) return a.height - b.height;
      return a.title.localeCompare(b.title);
    });
}

export function trellisCounts(cards: readonly Trellis[], desk: unknown): TrellisCounts {
  const rows = readTrellises(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    trained: rows.filter((card) => inTray(card, "trained")).length,
    stored: rows.filter((card) => inTray(card, "stored")).length,
    pinned: rows.filter((card) => card.pinned).length,
    tip: rows.filter((card) => waitingTip(card)).length,
    late: rows.filter((card) => lateTrellis(card, desk)).length,
    soon: rows.filter((card) => soonTrellis(card)).length,
  };
}

/** How many distinct heights the saved trellises already use. An unset height is not a span. */
export function usedHeights(cards: readonly Trellis[]): number {
  const seen = new Set<number>();
  for (const card of readTrellises(cards)) if (card.height !== null) seen.add(card.height);
  return seen.size;
}

/** Share of the saved trellises. A zero total stays at zero. */
export function trellisShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function trellisWeavers(cards: readonly Trellis[]): string[] {
  const out: string[] = [];
  for (const card of readTrellises(cards)) {
    if (card.weaver && !out.includes(card.weaver)) out.push(card.weaver);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function trellisBays(cards: readonly Trellis[]): string[] {
  const out: string[] = [];
  for (const card of readTrellises(cards)) {
    if (card.bay && !out.includes(card.bay)) out.push(card.bay);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function trellisWeaves(cards: readonly Trellis[]): Exclude<TrellisWeave, "blank">[] {
  const seen = new Set<string>();
  for (const card of readTrellises(cards)) if (card.weave) seen.add(card.weave);
  return WEAVES.filter((weave) => seen.has(weave));
}

export function trellisStains(cards: readonly Trellis[]): Exclude<TrellisStain, "blank">[] {
  const seen = new Set<string>();
  for (const card of readTrellises(cards)) if (card.stain) seen.add(card.stain);
  return STAINS.filter((stain) => seen.has(stain));
}

/** How many open trellises a weaver still holds. A blank weaver is not a load. */
export function weaverLoad(cards: readonly Trellis[], weaver: string): number {
  const name = weaverLabel(weaver);
  if (!name) return 0;
  return readTrellises(cards).filter((card) => card.weaver === name && inTray(card, "open")).length;
}

/** Three weaves. Index 0 is plain. Index 2 is braid. */
export function weaveCounts(cards: readonly Trellis[]): number[] {
  const rows = readTrellises(cards);
  return WEAVES.map((weave) => rows.filter((card) => weaveOf(card.weave) === weave).length);
}

/** "all" and "blank" stay. A weaver that is no longer on a trellis falls back to all. */
export function activeWeaver(filter: string, weavers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const weaver = weaverLabel(filter);
  return weaver && weavers.includes(weaver) ? weaver : "all";
}

export function weaverArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return weaverLabel(filter);
}

/** "all" and "blank" stay. A weave that is no longer on a trellis falls back to all. */
export function activeWeave(filter: string, weaves: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const weave = weaveName(filter);
  return weave && weaves.includes(weave) ? weave : "all";
}

export function weaveArg(filter: string): TrellisWeave | null {
  if (filter === "blank") return "blank";
  return weaveName(filter) || null;
}

/** "all" and "blank" stay. A bay that is no longer on a trellis falls back to all. */
export function activeBay(filter: string, bays: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const bay = trellisBay(filter);
  return bay && bays.includes(bay) ? bay : "all";
}

export function bayArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return trellisBay(filter);
}

/** "all" and "blank" stay. A stain that is no longer on a trellis falls back to all. */
export function activeStain(filter: string, stains: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const stain = stainName(filter);
  return stain && stains.includes(stain) ? stain : "all";
}

export function stainArg(filter: string): TrellisStain | null {
  if (filter === "blank") return "blank";
  return stainName(filter) || null;
}

/** All, blank, the bands, tip, cane, and the heights 1 through 8 stay. Anything else is all. */
export function activeHeight(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const height = heightOf(filter);
  return height === null ? "all" : String(height);
}

export function heightArg(filter: string): { exact: number | null; pick: TrellisPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as TrellisPick };
  const height = heightOf(filter);
  return height === null ? { exact: null, pick: null } : { exact: height, pick: null };
}

/** All, blank, and the leans 1 through 4 stay. Anything else is all. */
export function activeLean(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const lean = leanOf(filter);
  return lean === null ? "all" : String(lean);
}

export function leanArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return leanOf(filter);
}

/** All, blank, and the spans 4, 8, 16, and 32 stay. Anything else is all. */
export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const span = spanOf(filter);
  return span === null ? "all" : String(span);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

/** Other trellises with the same weave and the same height. A blank weave or a blank height clashes with nothing. */
export function heightClashIds(cards: readonly Trellis[], id: string): string[] {
  const rows = readTrellises(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.weave || card.height === null) return [];
  return rows
    .filter((item) => item.id !== id && item.weave === card.weave && item.height === card.height)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved trellises share a weave and a height with another trellis. */
export function clashHeightCount(cards: readonly Trellis[]): number {
  const rows = readTrellises(cards);
  return rows.filter((card) => heightClashIds(rows, card.id).length > 0).length;
}

/** Other trellises with the same weave and the same lean. A blank weave or a blank lean clashes with nothing. */
export function leanClashIds(cards: readonly Trellis[], id: string): string[] {
  const rows = readTrellises(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.weave || card.lean === null) return [];
  return rows
    .filter((item) => item.id !== id && item.weave === card.weave && item.lean === card.lean)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved trellises share a weave and a lean with another trellis. */
export function leanClashCount(cards: readonly Trellis[]): number {
  const rows = readTrellises(cards);
  return rows.filter((card) => leanClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open trellis at or after the height you type, skipping ink.
 * After 8, the garden wraps to the earliest open trellis that is not ink.
 */
export function nextTrellis(cards: readonly Trellis[], desk: unknown): string {
  const now = heightOf(desk);
  if (now === null) return "";
  const waiting = readTrellises(cards).filter((card) => inTray(card, "open") && card.height !== null && card.stain !== "ink");
  if (!waiting.length) return "";
  const byHeight = (a: Trellis, b: Trellis) => (a.height ?? 0) - (b.height ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.height ?? 0) >= now).sort(byHeight);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHeight)[0].id;
}

/**
 * The weave with the fewest open trellises.
 * A tie keeps the earlier weave: plain, then twist, then braid.
 * Trellises with no weave are not a load. An empty desk still suggests plain.
 */
export function suggestWeave(cards: readonly Trellis[]): Exclude<TrellisWeave, "blank"> {
  const rows = readTrellises(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<TrellisWeave, "blank"> = "plain";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const weave of WEAVES) {
    const count = rows.filter((card) => card.weave === weave).length;
    if (count < bestCount) {
      best = weave;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The weaver with the fewest open trellises.
 * A tie keeps the earlier name. A blank weaver is not a candidate.
 * A desk with no named weaver suggests nothing.
 */
export function suggestWeaver(cards: readonly Trellis[]): string {
  const rows = readTrellises(cards).filter((card) => inTray(card, "open") && card.weaver);
  const weavers: string[] = [];
  for (const card of rows) {
    if (!weavers.includes(card.weaver)) weavers.push(card.weaver);
  }
  weavers.sort((a, b) => a.localeCompare(b));
  if (!weavers.length) return "";
  let best = weavers[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const weaver of weavers) {
    const count = rows.filter((card) => card.weaver === weaver).length;
    if (count < bestCount) {
      best = weaver;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open trellises.
 * A tie keeps 8, then 16, then 32, then 4, so a span of 4 is the last resort.
 * An empty desk still suggests 8.
 */
export function suggestSpan(cards: readonly Trellis[]): (typeof SPANS)[number] {
  const rows = readTrellises(cards).filter((card) => inTray(card, "open"));
  const order = [8, 16, 32, 4] as const;
  let best: (typeof SPANS)[number] = 8;
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

/** The CSV is the trellises saved in this browser. The gap and the late mark use the height you pass. */
export function trellisesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,weaver,height,weave,bay,stain,lean,span,band,pinned,trained,stored,gap,late,soon,note,audit"];
  for (const card of readTrellises(raw)) {
    const gap = heightGap(card.height, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.weaver),
      card.height === null ? "" : String(card.height),
      card.weave,
      csvCell(card.bay),
      card.stain,
      card.lean === null ? "" : String(card.lean),
      card.span === null ? "" : String(card.span),
      heightBand(card.height),
      card.pinned ? "1" : "0",
      card.trained ? "1" : "0",
      card.stored ? "1" : "0",
      gap === null ? "" : String(gap),
      lateTrellis(card, desk) ? "1" : "0",
      soonTrellis(card) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function weaverSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return weaverLabel(raw) || "all";
}

function weaveSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return weaveName(raw) || "all";
}

function baySlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return trellisBay(raw) || "all";
}

function stainSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stainName(raw) || "all";
}

export function readTrellisViews(raw: unknown): TrellisView[] {
  if (!Array.isArray(raw)) return [];
  const out: TrellisView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TrellisView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      weaver: weaverSlot(row.weaver),
      weave: weaveSlot(row.weave),
      bay: baySlot(row.bay),
      stain: stainSlot(row.stain),
      height: activeHeight(String(row.height ?? "")),
      lean: activeLean(String(row.lean ?? "")),
      span: activeSpan(String(row.span ?? "")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addTrellisView(
  views: readonly TrellisView[],
  view: {
    id: string;
    name: string;
    tray: TrellisTray;
    query: string;
    weaver: string;
    weave: string;
    bay: string;
    stain: string;
    height: string;
    lean: string;
    span: string;
  },
): TrellisView[] {
  const current = readTrellisViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    weaver: weaverSlot(view.weaver),
    weave: weaveSlot(view.weave),
    bay: baySlot(view.bay),
    stain: stainSlot(view.stain),
    height: activeHeight(view.height),
    lean: activeLean(view.lean),
    span: activeSpan(view.span),
  }].slice(0, VIEW_CAP);
}

export function dropTrellisView(views: readonly TrellisView[], id: string): TrellisView[] {
  return readTrellisViews(views).filter((view) => view.id !== id);
}

function stemText(raw: unknown): string {
  return clip(raw, 24);
}

function stemBody(value: StemValue): { text: string; explicit: boolean } | null {
  if (typeof value === "number") return { text: "", explicit: false };
  if (typeof value === "string") return { text: stemText(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: "", explicit: false };
  if (STEM_BLOCK.some((key) => key in value)) return null;
  if (!("phone" in value)) return { text: "", explicit: false };
  const inner = value.phone;
  if (inner === null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: "", explicit: false };
  return { text: stemText(inner), explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set phone is text. A clear phone is an explicit blank. A missing field stays unmarked.
 * A name, a country, and the other blocked fields are not a phone.
 */
export function stemState(value: StemValue): StemState {
  const body = stemBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/** Digits only, capped at 18. A clear or unmarked value stays unset. */
export function stemDigits(value: StemValue): string {
  const body = stemBody(value);
  if (!body || !body.text) return "";
  return body.text.replace(/\D/g, "").slice(0, DIGIT_CAP);
}

/** The clipped phone. A clear or unmarked value stays blank. */
export function stemCopy(value: StemValue): string {
  const body = stemBody(value);
  return body?.text || "";
}

/**
 * Short is 1–6 digits. Local is 7–10. Trunk is 11–13. Fourteen and above is long.
 * A blank phone has no band.
 */
export function stemBand(value: StemValue): StemBand {
  const digits = stemDigits(value);
  if (!digits) return "";
  const length = digits.length;
  if (length <= 6) return "short";
  if (length <= 10) return "local";
  if (length <= 13) return "trunk";
  return "long";
}

/**
 * Near is 1–4 digits, mid is 5–10, and 11 and above is far.
 * A blank phone has no depth.
 */
export function stemDepth(value: StemValue): StemDepth {
  const digits = stemDigits(value);
  if (!digits) return "";
  if (digits.length <= 4) return "near";
  if (digits.length <= 10) return "mid";
  return "far";
}

/** A phone that starts with + is a plus stem. Digits and other marks are not. */
export function plusStem(value: StemValue): boolean {
  return stemCopy(value).startsWith("+");
}

/** A set phone with an odd digit count. An even count is not odd. */
export function oddStem(value: StemValue): boolean {
  const digits = stemDigits(value);
  return Boolean(digits) && digits.length % 2 === 1;
}

export function stemBands(rows: readonly StemRow[]): StemBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = stemState(row.note);
    if (state === "") continue;
    const band = state === "set" ? stemBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: StemBandLine[] = [];
  for (const band of ["", ...STEM_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function stemDepths(rows: readonly StemRow[]): StemDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = stemDepth(row.note);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: StemDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps short, then local, trunk, and long. An unmarked field is not a lead. */
export function leadingStem(rows: readonly StemRow[]): string {
  const named = stemBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const tie = ["short", "local", "trunk", "long"];
  const order = (band: string) => tie.indexOf(band);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps near, then mid, then far. A blank phone is not a lead. */
export function leadingStemDepth(rows: readonly StemRow[]): string {
  const named = stemDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** How many set phones have an odd digit count. */
export function oddStemCount(rows: readonly StemRow[]): number {
  return rows.filter((row) => stemState(row.note) === "set" && oddStem(row.note)).length;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function stemShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((STEM_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentStems(rows: readonly StemRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = stemState(row.note);
    const token = state === "set" ? stemBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenStems(raw: unknown, present: readonly string[]): string[] {
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

export function toggleStem(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandToken(band);
  if (!token || !present.includes(token)) return readHiddenStems(hidden, present);
  const current = readHiddenStems(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleStemBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenStems(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeStem(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (STEM_BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function stemArg(filter: string): StemBand | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (STEM_BANDS as readonly string[]).includes(filter) ? (filter as StemBand) : null;
}

/** "all" and "blank" stay. A depth that is no longer loaded falls back to all. */
export function activeStemDepth(filter: string, depths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (DEPTHS as readonly string[]).includes(filter) && depths.includes(filter) ? filter : "all";
}

export function stemDepthArg(filter: string): StemDepth | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (DEPTHS as readonly string[]).includes(filter) ? (filter as StemDepth) : null;
}

function rowId(row: StemRow): string {
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

/** Search stays on the name. The band, the depth, and the phone are not part of the query. */
export function visibleStemCustomers<T extends StemRow>(
  rows: readonly T[],
  band: StemBand | "blank" | null,
  depth: StemDepth | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: StemShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = stemState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && stemBand(row.note) !== band) return false;
    if (depth !== null && stemDepth(row.note) !== depth) return false;
    if (shape === "plus" && !plusStem(row.note)) return false;
    if (shape === "odd" && (state !== "set" || !oddStem(row.note))) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function stemsCsv(rows: readonly StemRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = stemState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of stemBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of stemDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  lines.push(["shape", "odd", String(oddStemCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function stemRowsCsv(rows: readonly StemRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,depth,digits,plus,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const digits = stemDigits(row.note);
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(stemBand(row.note)),
      csvCell(stemDepth(row.note)),
      digits,
      plusStem(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}

export const TRELLIS_WEAVES = WEAVES;
export const STEM_BAND_NAMES = ["short", "local", "trunk", "long"] as const;
