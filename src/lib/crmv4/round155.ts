/**
 * Local docket slips for document review, and family names already on each loaded row.
 * Persistence stays in this browser. A future table is a proposal only and is not applied:
 * CREATE TABLE crm_docket_slip (
 *   id text primary key,
 *   note text not null,
 *   clerk text not null default '',
 *   docket integer,
 *   cloth text not null default '',
 *   mark text not null default '',
 *   wax text not null default '',
 *   pinned boolean not null default false,
 *   parked boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 */

export const DOCKET_KEY = "crmv4-docket-slips";
export const DOCKET_VIEW_KEY = "crmv4-docket-views";
export const FAMILY_KEY = "crmv4-family-hide";

export type DocketWax = "blank" | "soft" | "firm" | "hard";

export type DocketCloth = "blank" | "linen" | "silk" | "wool" | "canvas";

export type DocketTray = "open" | "parked" | "filed";

export type NumberPick = "blank" | "dawn" | "noon" | "dusk" | "night" | "inner" | "outer";

export type DocketCard = {
  id: string;
  text: string;
  clerk: string;
  docket: number | null;
  cloth: string;
  mark: string;
  wax: string;
  pinned: boolean;
  parked: boolean;
  filed: boolean;
  audit: string;
};

export type DocketView = {
  id: string;
  name: string;
  tray: DocketTray;
  query: string;
  clerk: string;
  cloth: string;
  mark: string;
  wax: string;
  docket: string;
};

export type DocketCounts = {
  open: number;
  parked: number;
  filed: number;
  pinned: number;
  late: number;
};

export type FamilySpan = "" | "short" | "mid" | "long";

export type FamilyShape = "" | "plain" | "joined" | "stacked";

export type FamilyValue =
  | {
      lastName?: unknown;
      firstName?: unknown;
      name?: unknown;
      email?: unknown;
      username?: unknown;
      phone?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type FamilyRow = { family?: FamilyValue; label?: string | null };

export type InitialLine = { initial: string; count: number };

export type SpanLine = { span: string; count: number };

export type ShapeLine = { shape: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "park", "release", "file", "unfile"] as const;

const CLOTHS = ["linen", "silk", "wool", "canvas"] as const;

const WAXES = ["soft", "firm", "hard"] as const;

const WAX_ORDER = ["", "soft", "firm", "hard"] as const;

const PICKS = ["blank", "dawn", "noon", "dusk", "night", "inner", "outer"] as const;

const WATCHES = ["dawn", "noon", "dusk", "night"] as const;

const SPANS = ["", "short", "mid", "long"] as const;

const SHAPES = ["", "plain", "joined", "stacked"] as const;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const FAMILY_BLOCK = ["firstName", "name", "email", "username", "phone"] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): DocketTray {
  return raw === "parked" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<DocketCloth, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<DocketCloth, "blank">) : "";
}

function waxName(raw: unknown): Exclude<DocketWax, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WAXES as readonly string[]).includes(text) ? (text as Exclude<DocketWax, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function docketText(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank clerk stays blank. It is not filled in. */
export function clerkLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank mark stays blank. It is not filled in. */
export function docketMark(raw: unknown): string {
  return clip(raw, 10);
}

/**
 * A docket is 1 through 40.
 * A blank value stays unset. 0 and 41 are not dockets.
 * A leading zero is still a docket: 01 is 1, and 09 is 9.
 * 00 is not a docket.
 */
export function docketOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 40) return raw;
  if (typeof raw === "string" && /^(?:0?[1-9]|[1-3]\d|40)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Linen, silk, wool, canvas, or blank. Anything else is blank. */
export function clothOf(raw: unknown): DocketCloth {
  return clothName(raw) || "blank";
}

/** Soft, firm, hard, or blank. Anything else is blank. */
export function waxOf(raw: unknown): DocketWax {
  return waxName(raw) || "blank";
}

/** Dawn is 1–10. Noon is 11–20. Dusk is 21–30. Night is 31–40. An unset docket is blank. */
export function watchOf(docket: unknown): "blank" | "dawn" | "noon" | "dusk" | "night" {
  const count = docketOf(docket);
  if (count === null) return "blank";
  if (count <= 10) return "dawn";
  if (count <= 20) return "noon";
  if (count <= 30) return "dusk";
  return "night";
}

/** Inner is 1–20. Outer is 21–40. An unset docket is blank. */
export function ringOf(docket: unknown): "blank" | "inner" | "outer" {
  const count = docketOf(docket);
  if (count === null) return "blank";
  return count <= 20 ? "inner" : "outer";
}

/** The typed docket minus the slip docket. A positive gap is past the docket. */
export function docketGap(docket: unknown, desk: unknown): number | null {
  const from = docketOf(docket);
  const at = docketOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readDockets(raw: unknown): DocketCard[] {
  if (!Array.isArray(raw)) return [];
  const out: DocketCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DocketCard>;
    const id = String(row.id || "").trim();
    const text = docketText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      clerk: clerkLabel(row.clerk),
      docket: docketOf(row.docket),
      cloth: clothName(row.cloth),
      mark: docketMark(row.mark),
      wax: waxName(row.wax),
      pinned: row.pinned === true,
      parked: row.parked === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 16);
}

export function addDocket(
  cards: readonly DocketCard[],
  card: { id: string; text: string; clerk?: string; docket?: unknown; cloth?: string; mark?: string; wax?: string },
): DocketCard[] {
  const current = readDockets(cards);
  const id = String(card.id || "").trim();
  const text = docketText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: DocketCard = {
    id,
    text,
    clerk: clerkLabel(card.clerk),
    docket: docketOf(card.docket),
    cloth: clothName(card.cloth),
    mark: docketMark(card.mark),
    wax: waxName(card.wax),
    pinned: false,
    parked: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 16);
}

export function stepDocketWax(cards: readonly DocketCard[], id: string, dir: 1 | -1): DocketCard[] {
  return readDockets(cards).map((card) => {
    if (card.id !== id) return card;
    const at = WAX_ORDER.indexOf(card.wax as (typeof WAX_ORDER)[number]);
    const next = WAX_ORDER[Math.min(WAXES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.wax) return card;
    return { ...card, wax: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setDocketPinned(cards: readonly DocketCard[], id: string, pinned: boolean): DocketCard[] {
  return readDockets(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setDocketParked(cards: readonly DocketCard[], id: string, parked: boolean): DocketCard[] {
  return readDockets(cards).map((card) => (card.id === id ? { ...card, parked, audit: parked ? "park" : "release" } : card));
}

export function setDocketFiled(cards: readonly DocketCard[], id: string, filed: boolean): DocketCard[] {
  return readDockets(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "unfile" } : card));
}

/** A blank edit is left out. A duplicate of another docket is left out. */
export function editDocket(cards: readonly DocketCard[], id: string, text: string): DocketCard[] {
  const current = readDockets(cards);
  const next = docketText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkDocketPinned(cards: readonly DocketCard[], ids: readonly string[], pinned: boolean): DocketCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readDockets(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkDocketFiled(cards: readonly DocketCard[], ids: readonly string[], filed: boolean): DocketCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readDockets(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "unfile" } : card));
}

export function resetDockets(): DocketCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function docketCopy(raw: unknown): string {
  return docketText(raw);
}

function inTray(card: DocketCard, tray: DocketTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "parked") return card.parked && !card.filed;
  return !card.parked && !card.filed;
}

function numberHit(docket: number | null, exact: number | null, band: NumberPick | null): boolean {
  if (exact !== null) return docket === exact;
  if (band === null) return true;
  if (band === "blank") return docket === null;
  if (band === "inner" || band === "outer") return ringOf(docket) === band;
  return watchOf(docket) === band;
}

function waxScore(wax: string): number {
  if (wax === "hard") return 3;
  if (wax === "firm") return 2;
  if (wax === "soft") return 1;
  return 0;
}

function softLate(card: DocketCard, desk: unknown): boolean {
  const gap = docketGap(card.docket, desk);
  return gap !== null && gap > 0 && card.wax === "soft" && inTray(card, "open");
}

/** Search stays on the note. The clerk, the docket, the cloth, the mark, and the wax are not part of the query. */
export function visibleDockets(
  cards: readonly DocketCard[],
  tray: DocketTray,
  query: string,
  clerk: string | null,
  cloth: DocketCloth | null,
  mark: string | null,
  wax: DocketWax | null,
  exact: number | null,
  band: NumberPick | null,
  hardOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): DocketCard[] {
  const text = query.trim().toLowerCase();
  const wantClerk = clerk === null ? null : clerkLabel(clerk);
  const wantMark = mark === null ? null : docketMark(mark);
  return readDockets(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (hardOnly && card.wax !== "hard") return false;
      if (wantClerk !== null && clerkLabel(card.clerk) !== wantClerk) return false;
      if (cloth !== null && clothOf(card.cloth) !== cloth) return false;
      if (wantMark !== null && docketMark(card.mark) !== wantMark) return false;
      if (wax !== null && waxOf(card.wax) !== wax) return false;
      if (!numberHit(card.docket, exact, band)) return false;
      if (lateOnly && !softLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (waxScore(a.wax) !== waxScore(b.wax)) return waxScore(b.wax) - waxScore(a.wax);
      return a.text.localeCompare(b.text);
    });
}

/** The docket orders the desk. An unset docket stays at the end. Search stays on the note. */
export function docketTimeline(cards: readonly DocketCard[], query: string): DocketCard[] {
  const text = query.trim().toLowerCase();
  return readDockets(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.docket === null && b.docket !== null) return 1;
      if (a.docket !== null && b.docket === null) return -1;
      if (a.docket !== null && b.docket !== null && a.docket !== b.docket) return a.docket - b.docket;
      return a.text.localeCompare(b.text);
    });
}

export function docketCounts(cards: readonly DocketCard[], desk: unknown): DocketCounts {
  const rows = readDockets(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    parked: rows.filter((card) => inTray(card, "parked")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => softLate(card, desk)).length,
  };
}

/** Share of the saved dockets. A zero total stays at zero. */
export function docketShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function docketClerks(cards: readonly DocketCard[]): string[] {
  const out: string[] = [];
  for (const card of readDockets(cards)) {
    if (card.clerk && !out.includes(card.clerk)) out.push(card.clerk);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function docketMarks(cards: readonly DocketCard[]): string[] {
  const out: string[] = [];
  for (const card of readDockets(cards)) {
    if (card.mark && !out.includes(card.mark)) out.push(card.mark);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function docketCloths(cards: readonly DocketCard[]): Exclude<DocketCloth, "blank">[] {
  const seen = new Set<string>();
  for (const card of readDockets(cards)) if (card.cloth) seen.add(card.cloth);
  return CLOTHS.filter((cloth) => seen.has(cloth));
}

export function docketWaxes(cards: readonly DocketCard[]): Exclude<DocketWax, "blank">[] {
  const seen = new Set<string>();
  for (const card of readDockets(cards)) if (card.wax) seen.add(card.wax);
  return WAXES.filter((wax) => seen.has(wax));
}

/** Four watches. Index 0 is dawn. Index 3 is night. */
export function watchCounts(cards: readonly DocketCard[]): number[] {
  const rows = readDockets(cards);
  return WATCHES.map((band) => rows.filter((card) => watchOf(card.docket) === band).length);
}

/** "all" and "blank" stay. A clerk that is no longer on a docket falls back to all. */
export function activeClerk(filter: string, clerks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const clerk = clerkLabel(filter);
  return clerk && clerks.includes(clerk) ? clerk : "all";
}

export function clerkArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return clerkLabel(filter);
}

/** "all" and "blank" stay. A cloth that is no longer on a docket falls back to all. */
export function activeCloth(filter: string, cloths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cloth = clothName(filter);
  return cloth && cloths.includes(cloth) ? cloth : "all";
}

export function clothArg(filter: string): DocketCloth | null {
  if (filter === "blank") return "blank";
  return clothName(filter) || null;
}

/** "all" and "blank" stay. A mark that is no longer on a docket falls back to all. */
export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = docketMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return docketMark(filter);
}

/** "all" and "blank" stay. A wax that is no longer on a docket falls back to all. */
export function activeWax(filter: string, waxes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const wax = waxName(filter);
  return wax && waxes.includes(wax) ? wax : "all";
}

export function waxArg(filter: string): DocketWax | null {
  if (filter === "blank") return "blank";
  return waxName(filter) || null;
}

/** All, blank, the four watches, the two rings, and the dockets 1 through 40 stay. Anything else is all. */
export function activeNumber(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const docket = docketOf(filter);
  return docket === null ? "all" : String(docket);
}

export function numberArg(filter: string): { exact: number | null; band: NumberPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, band: filter as NumberPick };
  const docket = docketOf(filter);
  return docket === null ? { exact: null, band: null } : { exact: docket, band: null };
}

/** Other dockets with the same cloth and the same number. A blank cloth or an unset docket clashes with nothing. */
export function docketClashIds(cards: readonly DocketCard[], id: string): string[] {
  const rows = readDockets(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.cloth || card.docket === null) return [];
  return rows
    .filter((item) => item.id !== id && item.cloth === card.cloth && item.docket === card.docket)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/**
 * The next open docket at or after the number you type, skipping hard wax.
 * After the last number, the desk wraps to the earliest open number that is not hard.
 */
export function nextDocket(cards: readonly DocketCard[], desk: unknown): string {
  const now = docketOf(desk);
  if (now === null) return "";
  const waiting = readDockets(cards).filter((card) => inTray(card, "open") && card.docket !== null && card.wax !== "hard");
  if (!waiting.length) return "";
  const byNumber = (a: DocketCard, b: DocketCard) => (a.docket ?? 0) - (b.docket ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.docket ?? 0) >= now).sort(byNumber);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byNumber)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the dockets saved in this browser. The gap uses the docket you pass. */
export function docketsCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,clerk,docket,cloth,mark,wax,watch,pinned,parked,filed,gap,audit"];
  for (const card of readDockets(raw)) {
    const gap = docketGap(card.docket, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.clerk),
      card.docket === null ? "" : String(card.docket),
      card.cloth,
      csvCell(card.mark),
      card.wax,
      watchOf(card.docket),
      card.pinned ? "1" : "0",
      card.parked ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function clerkSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return clerkLabel(raw) || "all";
}

function clothSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return clothName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return docketMark(raw) || "all";
}

function waxSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return waxName(raw) || "all";
}

export function readDocketViews(raw: unknown): DocketView[] {
  if (!Array.isArray(raw)) return [];
  const out: DocketView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DocketView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 64),
      clerk: clerkSlot(row.clerk),
      cloth: clothSlot(row.cloth),
      mark: markSlot(row.mark),
      wax: waxSlot(row.wax),
      docket: activeNumber(String(row.docket ?? "")),
    });
  }
  return out.slice(0, 5);
}

export function addDocketView(
  views: readonly DocketView[],
  view: { id: string; name: string; tray: DocketTray; query: string; clerk: string; cloth: string; mark: string; wax: string; docket: string },
): DocketView[] {
  const current = readDocketViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 64),
    clerk: clerkSlot(view.clerk),
    cloth: clothSlot(view.cloth),
    mark: markSlot(view.mark),
    wax: waxSlot(view.wax),
    docket: activeNumber(view.docket),
  }].slice(0, 5);
}

export function dropDocketView(views: readonly DocketView[], id: string): DocketView[] {
  return readDocketViews(views).filter((view) => view.id !== id);
}

function resolvedFamily(value: FamilyValue): string {
  if (typeof value === "string") return clip(value, 28);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (FAMILY_BLOCK.some((key) => key in value)) return "";
  return clip(value.lastName, 28);
}

/**
 * A family name from the last-name field, or blank.
 * A first name, a full name, an email, a username, and a phone are not a family name.
 * A missing family name stays unmarked and is not filled in.
 */
export function assignedFamily(value: FamilyValue): string {
  return resolvedFamily(value);
}

/** The first letter when the family name starts with a letter. Anything else stays blank. */
export function initialOf(value: FamilyValue): string {
  const family = resolvedFamily(value);
  if (!/^[A-Za-z]/.test(family)) return "";
  return family[0].toUpperCase();
}

/** Short is 1–5 characters. Mid is 6–10. Long is 11 or more. A blank name stays blank. */
export function spanOf(value: FamilyValue): FamilySpan {
  const family = resolvedFamily(value);
  if (!family) return "";
  if (family.length <= 5) return "short";
  if (family.length <= 10) return "mid";
  return "long";
}

/**
 * Plain is one word. Joined contains a hyphen. Stacked contains a space.
 * A blank name and a name that does not start with a letter stay blank.
 */
export function shapeOf(value: FamilyValue): FamilyShape {
  const family = resolvedFamily(value);
  if (!/^[A-Za-z]/.test(family)) return "";
  if (family.includes("-")) return "joined";
  if (family.includes(" ")) return "stacked";
  return "plain";
}

export function initialLines(rows: readonly FamilyRow[]): InitialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const initial = initialOf(row.family);
    map.set(initial, (map.get(initial) || 0) + 1);
  }
  const out: InitialLine[] = [];
  if (map.get("")) out.push({ initial: "", count: map.get("") || 0 });
  for (const initial of LETTERS) {
    const count = map.get(initial);
    if (count) out.push({ initial, count });
  }
  return out;
}

export function namedInitials(rows: readonly FamilyRow[]): string[] {
  return initialLines(rows).map((line) => line.initial).filter(Boolean);
}

export function spanLines(rows: readonly FamilyRow[]): SpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = spanOf(row.family);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: SpanLine[] = [];
  for (const span of SPANS) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly FamilyRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

export function shapeLines(rows: readonly FamilyRow[]): ShapeLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const shape = shapeOf(row.family);
    map.set(shape, (map.get(shape) || 0) + 1);
  }
  const out: ShapeLine[] = [];
  for (const shape of SHAPES) {
    const count = map.get(shape);
    if (count) out.push({ shape, count });
  }
  return out;
}

export function namedShapes(rows: readonly FamilyRow[]): string[] {
  return shapeLines(rows).map((line) => line.shape).filter(Boolean);
}

/** The initial with the most loaded rows. A tie keeps the earlier letter. An unmarked name is not a lead. */
export function leadingInitial(rows: readonly FamilyRow[]): string {
  const named = initialLines(rows).filter((line) => line.initial);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.initial.localeCompare(b.initial))[0].initial;
}

/** The named shape with the most loaded rows. A tie keeps the earlier shape. A blank shape is not a lead. */
export function leadingShape(rows: readonly FamilyRow[]): string {
  const named = shapeLines(rows).filter((line) => line.shape);
  if (!named.length) return "";
  const order = (shape: string) => SHAPES.indexOf(shape as (typeof SHAPES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.shape) - order(b.shape))[0].shape;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function familyShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenInitials(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = clip(item, 1).toUpperCase();
    if (!/^[A-Z]$/.test(mark) || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleInitial(hidden: readonly string[], initial: string, present: readonly string[]): string[] {
  const mark = initialOf(initial);
  if (!mark || !present.includes(mark)) return readHiddenInitials(hidden, present);
  const current = readHiddenInitials(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleInitials(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenInitials(hidden, present));
  return present.filter((initial) => (showHidden ? gone.has(initial) : !gone.has(initial)));
}

/** "all" and "blank" stay. An initial that is no longer loaded falls back to all. */
export function activeInitial(filter: string, initials: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const initial = initialOf(filter);
  return initial && initials.includes(initial) ? initial : "all";
}

export function initialArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const initial = initialOf(filter);
  return initial || null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SPANS as readonly string[]).includes(filter) && spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): FamilySpan | null {
  if (filter === "blank") return "";
  if ((SPANS as readonly string[]).includes(filter) && filter !== "") return filter as FamilySpan;
  return null;
}

/** "all" and "blank" stay. A shape that is no longer loaded falls back to all. */
export function activeShape(filter: string, shapes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SHAPES as readonly string[]).includes(filter) && shapes.includes(filter) ? filter : "all";
}

export function shapeArg(filter: string): FamilyShape | null {
  if (filter === "blank") return "";
  if ((SHAPES as readonly string[]).includes(filter) && filter !== "") return filter as FamilyShape;
  return null;
}

/** Search stays on the name. The family name is not part of the query. */
export function visibleFamilyCustomers<T extends FamilyRow>(
  rows: readonly T[],
  initial: string | null,
  shape: FamilyShape | null,
  span: FamilySpan | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (initial !== null && initialOf(row.family) !== initial) return false;
    if (shape !== null && shapeOf(row.family) !== shape) return false;
    if (span !== null && spanOf(row.family) !== span) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the initials, spans, and shapes on this page. */
export function familyCsv(rows: readonly FamilyRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of initialLines(rows)) lines.push(["initial", csvCell(line.initial), String(line.count)].join(","));
  for (const line of spanLines(rows)) lines.push(["span", line.span, String(line.count)].join(","));
  for (const line of shapeLines(rows)) lines.push(["shape", line.shape, String(line.count)].join(","));
  return lines.join("\n");
}
