/**
 * Local press proofs for document review, and given names already on each loaded row.
 * Persistence stays in this browser. A future table is a proposal only and is not applied:
 * CREATE TABLE crm_press_proof (
 *   id text primary key,
 *   note text not null,
 *   reader text not null default '',
 *   sheet integer,
 *   stock text not null default '',
 *   mark text not null default '',
 *   ink text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   bound boolean not null default false,
 *   audit text not null default ''
 * );
 */

export const PROOF_KEY = "crmv4-press-proofs";
export const PROOF_VIEW_KEY = "crmv4-press-views";
export const GIVEN_KEY = "crmv4-given-hide";

export type ProofInk = "blank" | "pale" | "set" | "dry";

export type ProofStock = "blank" | "rag" | "laid" | "wove" | "bond";

export type ProofTray = "open" | "held" | "bound";

export type SheetPick = "blank" | "quire" | "section" | "signature" | "volume" | "odd" | "even";

export type ProofCard = {
  id: string;
  text: string;
  reader: string;
  sheet: number | null;
  stock: string;
  mark: string;
  ink: string;
  pinned: boolean;
  bound: boolean;
  held: boolean;
  audit: string;
};

export type ProofView = {
  id: string;
  name: string;
  tray: ProofTray;
  query: string;
  reader: string;
  stock: string;
  mark: string;
  ink: string;
  sheet: string;
};

export type ProofCounts = {
  open: number;
  held: number;
  bound: number;
  pinned: number;
  late: number;
};

export type GivenLength = "" | "brief" | "settled" | "ample";

export type GivenEnding = "" | "vowel" | "consonant";

export type GivenValue =
  | {
      firstName?: unknown;
      lastName?: unknown;
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

export type GivenRow = { given?: GivenValue; label?: string | null };

export type InitialLine = { initial: string; count: number };

export type LengthLine = { length: string; count: number };

export type EndingLine = { ending: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "bind", "unbind"] as const;

const STOCKS = ["rag", "laid", "wove", "bond"] as const;

const INKS = ["pale", "set", "dry"] as const;

const INK_ORDER = ["", "pale", "set", "dry"] as const;

const PICKS = ["blank", "quire", "section", "signature", "volume", "odd", "even"] as const;

const GATHERINGS = ["quire", "section", "signature", "volume"] as const;

const LENGTHS = ["", "brief", "settled", "ample"] as const;

const ENDINGS = ["", "vowel", "consonant"] as const;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const GIVEN_BLOCK = ["lastName", "name", "email", "username", "phone"] as const;

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ProofTray {
  return raw === "held" || raw === "bound" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function stockName(raw: unknown): Exclude<ProofStock, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (STOCKS as readonly string[]).includes(text) ? (text as Exclude<ProofStock, "blank">) : "";
}

function inkName(raw: unknown): Exclude<ProofInk, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<ProofInk, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function proofText(raw: unknown): string {
  return clip(raw, 68);
}

/** A blank reader stays blank. It is not filled in. */
export function readerLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A blank mark stays blank. It is not filled in. */
export function proofMark(raw: unknown): string {
  return clip(raw, 12);
}

/**
 * A sheet is 1 through 36.
 * A blank value stays unset. 0 and 37 are not sheets.
 * A leading zero is still a sheet: 01 is 1, and 09 is 9.
 * 00 is not a sheet.
 */
export function sheetOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 36) return raw;
  if (typeof raw === "string" && /^(?:0?[1-9]|[12]\d|3[0-6])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Rag, laid, wove, bond, or blank. Anything else is blank. */
export function stockOf(raw: unknown): ProofStock {
  return stockName(raw) || "blank";
}

/** Pale, set, dry, or blank. Anything else is blank. */
export function inkOf(raw: unknown): ProofInk {
  return inkName(raw) || "blank";
}

/** Quire is 1–9. Section is 10–18. Signature is 19–27. Volume is 28–36. An unset sheet is blank. */
export function gatheringOf(sheet: unknown): "blank" | "quire" | "section" | "signature" | "volume" {
  const count = sheetOf(sheet);
  if (count === null) return "blank";
  if (count <= 9) return "quire";
  if (count <= 18) return "section";
  if (count <= 27) return "signature";
  return "volume";
}

/** Odd sheets and even sheets. An unset sheet is blank. */
export function sheetPair(sheet: unknown): "blank" | "odd" | "even" {
  const count = sheetOf(sheet);
  if (count === null) return "blank";
  return count % 2 === 1 ? "odd" : "even";
}

/** The typed sheet minus the proof sheet. A positive gap is past the sheet. */
export function sheetGap(sheet: unknown, desk: unknown): number | null {
  const from = sheetOf(sheet);
  const at = sheetOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readProofs(raw: unknown): ProofCard[] {
  if (!Array.isArray(raw)) return [];
  const out: ProofCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ProofCard>;
    const id = String(row.id || "").trim();
    const text = proofText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      reader: readerLabel(row.reader),
      sheet: sheetOf(row.sheet),
      stock: stockName(row.stock),
      mark: proofMark(row.mark),
      ink: inkName(row.ink),
      pinned: row.pinned === true,
      bound: row.bound === true,
      held: row.held === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 16);
}

export function addProof(
  cards: readonly ProofCard[],
  card: { id: string; text: string; reader?: string; sheet?: unknown; stock?: string; mark?: string; ink?: string },
): ProofCard[] {
  const current = readProofs(cards);
  const id = String(card.id || "").trim();
  const text = proofText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: ProofCard = {
    id,
    text,
    reader: readerLabel(card.reader),
    sheet: sheetOf(card.sheet),
    stock: stockName(card.stock),
    mark: proofMark(card.mark),
    ink: inkName(card.ink),
    pinned: false,
    bound: false,
    held: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 16);
}

export function stepProofInk(cards: readonly ProofCard[], id: string, dir: 1 | -1): ProofCard[] {
  return readProofs(cards).map((card) => {
    if (card.id !== id) return card;
    const at = INK_ORDER.indexOf(card.ink as (typeof INK_ORDER)[number]);
    const next = INK_ORDER[Math.min(INKS.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.ink) return card;
    return { ...card, ink: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setProofPinned(cards: readonly ProofCard[], id: string, pinned: boolean): ProofCard[] {
  return readProofs(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setProofHeld(cards: readonly ProofCard[], id: string, held: boolean): ProofCard[] {
  return readProofs(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setProofBound(cards: readonly ProofCard[], id: string, bound: boolean): ProofCard[] {
  return readProofs(cards).map((card) => (card.id === id ? { ...card, bound, audit: bound ? "bind" : "unbind" } : card));
}

/** A blank edit is left out. A duplicate of another proof is left out. */
export function editProof(cards: readonly ProofCard[], id: string, text: string): ProofCard[] {
  const current = readProofs(cards);
  const next = proofText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkProofPinned(cards: readonly ProofCard[], ids: readonly string[], pinned: boolean): ProofCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readProofs(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkProofBound(cards: readonly ProofCard[], ids: readonly string[], bound: boolean): ProofCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readProofs(cards).map((card) => (want.has(card.id) ? { ...card, bound, audit: bound ? "bind" : "unbind" } : card));
}

export function resetProofs(): ProofCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function proofCopy(raw: unknown): string {
  return proofText(raw);
}

function inTray(card: ProofCard, tray: ProofTray): boolean {
  if (tray === "bound") return card.bound;
  if (tray === "held") return card.held && !card.bound;
  return !card.held && !card.bound;
}

function sheetHit(sheet: number | null, exact: number | null, band: SheetPick | null): boolean {
  if (exact !== null) return sheet === exact;
  if (band === null) return true;
  if (band === "blank") return sheet === null;
  if (band === "odd" || band === "even") return sheetPair(sheet) === band;
  return gatheringOf(sheet) === band;
}

function inkScore(ink: string): number {
  if (ink === "dry") return 3;
  if (ink === "set") return 2;
  if (ink === "pale") return 1;
  return 0;
}

function paleLate(card: ProofCard, desk: unknown): boolean {
  const gap = sheetGap(card.sheet, desk);
  return gap !== null && gap > 0 && card.ink === "pale" && inTray(card, "open");
}

/** Search stays on the note. The reader, the sheet, the stock, the mark, and the ink are not part of the query. */
export function visibleProofs(
  cards: readonly ProofCard[],
  tray: ProofTray,
  query: string,
  reader: string | null,
  stock: ProofStock | null,
  mark: string | null,
  ink: ProofInk | null,
  exact: number | null,
  band: SheetPick | null,
  dryOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): ProofCard[] {
  const text = query.trim().toLowerCase();
  const wantReader = reader === null ? null : readerLabel(reader);
  const wantMark = mark === null ? null : proofMark(mark);
  return readProofs(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (dryOnly && card.ink !== "dry") return false;
      if (wantReader !== null && readerLabel(card.reader) !== wantReader) return false;
      if (stock !== null && stockOf(card.stock) !== stock) return false;
      if (wantMark !== null && proofMark(card.mark) !== wantMark) return false;
      if (ink !== null && inkOf(card.ink) !== ink) return false;
      if (!sheetHit(card.sheet, exact, band)) return false;
      if (lateOnly && !paleLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (inkScore(a.ink) !== inkScore(b.ink)) return inkScore(b.ink) - inkScore(a.ink);
      return a.text.localeCompare(b.text);
    });
}

/** The sheet orders the desk. An unset sheet stays at the end. Search stays on the note. */
export function proofTimeline(cards: readonly ProofCard[], query: string): ProofCard[] {
  const text = query.trim().toLowerCase();
  return readProofs(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.sheet === null && b.sheet !== null) return 1;
      if (a.sheet !== null && b.sheet === null) return -1;
      if (a.sheet !== null && b.sheet !== null && a.sheet !== b.sheet) return a.sheet - b.sheet;
      return a.text.localeCompare(b.text);
    });
}

export function proofCounts(cards: readonly ProofCard[], desk: unknown): ProofCounts {
  const rows = readProofs(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    bound: rows.filter((card) => inTray(card, "bound")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => paleLate(card, desk)).length,
  };
}

/** Share of the saved proofs. A zero total stays at zero. */
export function proofShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function proofReaders(cards: readonly ProofCard[]): string[] {
  const out: string[] = [];
  for (const card of readProofs(cards)) {
    if (card.reader && !out.includes(card.reader)) out.push(card.reader);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function proofMarks(cards: readonly ProofCard[]): string[] {
  const out: string[] = [];
  for (const card of readProofs(cards)) {
    if (card.mark && !out.includes(card.mark)) out.push(card.mark);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function proofStocks(cards: readonly ProofCard[]): Exclude<ProofStock, "blank">[] {
  const seen = new Set<string>();
  for (const card of readProofs(cards)) if (card.stock) seen.add(card.stock);
  return STOCKS.filter((stock) => seen.has(stock));
}

export function proofInks(cards: readonly ProofCard[]): Exclude<ProofInk, "blank">[] {
  const seen = new Set<string>();
  for (const card of readProofs(cards)) if (card.ink) seen.add(card.ink);
  return INKS.filter((ink) => seen.has(ink));
}

/** Four gatherings. Index 0 is quire. Index 3 is volume. */
export function gatheringCounts(cards: readonly ProofCard[]): number[] {
  const rows = readProofs(cards);
  return GATHERINGS.map((band) => rows.filter((card) => gatheringOf(card.sheet) === band).length);
}

/** "all" and "blank" stay. A reader that is no longer on a proof falls back to all. */
export function activeReader(filter: string, readers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const reader = readerLabel(filter);
  return reader && readers.includes(reader) ? reader : "all";
}

export function readerArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return readerLabel(filter);
}

/** "all" and "blank" stay. A stock that is no longer on a proof falls back to all. */
export function activeStock(filter: string, stocks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const stock = stockName(filter);
  return stock && stocks.includes(stock) ? stock : "all";
}

export function stockArg(filter: string): ProofStock | null {
  if (filter === "blank") return "blank";
  return stockName(filter) || null;
}

/** "all" and "blank" stay. A mark that is no longer on a proof falls back to all. */
export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = proofMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return proofMark(filter);
}

/** "all" and "blank" stay. An ink that is no longer on a proof falls back to all. */
export function activeInk(filter: string, inks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ink = inkName(filter);
  return ink && inks.includes(ink) ? ink : "all";
}

export function inkArg(filter: string): ProofInk | null {
  if (filter === "blank") return "blank";
  return inkName(filter) || null;
}

/** All, blank, the four gatherings, the two pairs, and the sheets 1 through 36 stay. Anything else is all. */
export function activeSheet(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const sheet = sheetOf(filter);
  return sheet === null ? "all" : String(sheet);
}

export function sheetArg(filter: string): { exact: number | null; band: SheetPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, band: filter as SheetPick };
  const sheet = sheetOf(filter);
  return sheet === null ? { exact: null, band: null } : { exact: sheet, band: null };
}

/** Other proofs with the same stock and the same sheet. A blank stock or an unset sheet clashes with nothing. */
export function proofClashIds(cards: readonly ProofCard[], id: string): string[] {
  const rows = readProofs(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.stock || card.sheet === null) return [];
  return rows
    .filter((item) => item.id !== id && item.stock === card.stock && item.sheet === card.sheet)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/**
 * The next open proof at or after the sheet you type, skipping dry ink.
 * After the last sheet, the desk wraps to the earliest open sheet that is not dry.
 */
export function nextProof(cards: readonly ProofCard[], desk: unknown): string {
  const now = sheetOf(desk);
  if (now === null) return "";
  const waiting = readProofs(cards).filter((card) => inTray(card, "open") && card.sheet !== null && card.ink !== "dry");
  if (!waiting.length) return "";
  const bySheet = (a: ProofCard, b: ProofCard) => (a.sheet ?? 0) - (b.sheet ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.sheet ?? 0) >= now).sort(bySheet);
  if (later.length) return later[0].id;
  return waiting.slice().sort(bySheet)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the proofs saved in this browser. The gap uses the sheet you pass. */
export function proofsCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,reader,sheet,stock,mark,ink,gathering,pinned,held,bound,gap,audit"];
  for (const card of readProofs(raw)) {
    const gap = sheetGap(card.sheet, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.reader),
      card.sheet === null ? "" : String(card.sheet),
      card.stock,
      csvCell(card.mark),
      card.ink,
      gatheringOf(card.sheet),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.bound ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function readerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return readerLabel(raw) || "all";
}

function stockSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stockName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return proofMark(raw) || "all";
}

function inkSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return inkName(raw) || "all";
}

export function readProofViews(raw: unknown): ProofView[] {
  if (!Array.isArray(raw)) return [];
  const out: ProofView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ProofView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 68),
      reader: readerSlot(row.reader),
      stock: stockSlot(row.stock),
      mark: markSlot(row.mark),
      ink: inkSlot(row.ink),
      sheet: activeSheet(String(row.sheet ?? "")),
    });
  }
  return out.slice(0, 5);
}

export function addProofView(
  views: readonly ProofView[],
  view: { id: string; name: string; tray: ProofTray; query: string; reader: string; stock: string; mark: string; ink: string; sheet: string },
): ProofView[] {
  const current = readProofViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 68),
    reader: readerSlot(view.reader),
    stock: stockSlot(view.stock),
    mark: markSlot(view.mark),
    ink: inkSlot(view.ink),
    sheet: activeSheet(view.sheet),
  }].slice(0, 5);
}

export function dropProofView(views: readonly ProofView[], id: string): ProofView[] {
  return readProofViews(views).filter((view) => view.id !== id);
}

function resolvedGiven(value: GivenValue): string {
  if (typeof value === "string") return clip(value, 24);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (GIVEN_BLOCK.some((key) => key in value)) return "";
  return clip(value.firstName, 24);
}

/**
 * A given name from the first-name field, or blank.
 * A last name, a full name, an email, a username, and a phone are not a given name.
 * A missing given name stays unmarked and is not filled in.
 */
export function assignedGiven(value: GivenValue): string {
  return resolvedGiven(value);
}

/** The first letter when the given name starts with a letter. Anything else stays blank. */
export function initialOf(value: GivenValue): string {
  const given = resolvedGiven(value);
  if (!/^[A-Za-z]/.test(given)) return "";
  return given[0].toUpperCase();
}

/** Brief is 1–4 characters. Settled is 5–7. Ample is 8 or more. A blank name stays blank. */
export function lengthOf(value: GivenValue): GivenLength {
  const given = resolvedGiven(value);
  if (!given) return "";
  if (given.length <= 4) return "brief";
  if (given.length <= 7) return "settled";
  return "ample";
}

/** Vowel or consonant from the last letter. A blank name and a non-letter ending stay blank. */
export function endingOf(value: GivenValue): GivenEnding {
  const given = resolvedGiven(value);
  const last = given.slice(-1).toUpperCase();
  if (!/^[A-Z]$/.test(last)) return "";
  return VOWELS.has(last) ? "vowel" : "consonant";
}

export function initialLines(rows: readonly GivenRow[]): InitialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const initial = initialOf(row.given);
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

export function namedInitials(rows: readonly GivenRow[]): string[] {
  return initialLines(rows).map((line) => line.initial).filter(Boolean);
}

export function lengthLines(rows: readonly GivenRow[]): LengthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const length = lengthOf(row.given);
    map.set(length, (map.get(length) || 0) + 1);
  }
  const out: LengthLine[] = [];
  for (const length of LENGTHS) {
    const count = map.get(length);
    if (count) out.push({ length, count });
  }
  return out;
}

export function namedLengths(rows: readonly GivenRow[]): string[] {
  return lengthLines(rows).map((line) => line.length).filter(Boolean);
}

export function endingLines(rows: readonly GivenRow[]): EndingLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const ending = endingOf(row.given);
    map.set(ending, (map.get(ending) || 0) + 1);
  }
  const out: EndingLine[] = [];
  for (const ending of ENDINGS) {
    const count = map.get(ending);
    if (count) out.push({ ending, count });
  }
  return out;
}

export function namedEndings(rows: readonly GivenRow[]): string[] {
  return endingLines(rows).map((line) => line.ending).filter(Boolean);
}

/** The initial with the most loaded rows. A tie keeps the earlier letter. An unmarked name is not a lead. */
export function leadingInitial(rows: readonly GivenRow[]): string {
  const named = initialLines(rows).filter((line) => line.initial);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.initial.localeCompare(b.initial))[0].initial;
}

/** The named length with the most loaded rows. A tie keeps the earlier length. A blank length is not a lead. */
export function leadingLength(rows: readonly GivenRow[]): string {
  const named = lengthLines(rows).filter((line) => line.length);
  if (!named.length) return "";
  const order = (length: string) => LENGTHS.indexOf(length as (typeof LENGTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.length) - order(b.length))[0].length;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function givenShare(count: number, total: number): number {
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

/** "all" and "blank" stay. A length that is no longer loaded falls back to all. */
export function activeLength(filter: string, lengths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (LENGTHS as readonly string[]).includes(filter) && lengths.includes(filter) ? filter : "all";
}

export function lengthArg(filter: string): GivenLength | null {
  if (filter === "blank") return "";
  if ((LENGTHS as readonly string[]).includes(filter) && filter !== "") return filter as GivenLength;
  return null;
}

/** "all" and "blank" stay. An ending that is no longer loaded falls back to all. */
export function activeEnding(filter: string, endings: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (ENDINGS as readonly string[]).includes(filter) && endings.includes(filter) ? filter : "all";
}

export function endingArg(filter: string): GivenEnding | null {
  if (filter === "blank") return "";
  if ((ENDINGS as readonly string[]).includes(filter) && filter !== "") return filter as GivenEnding;
  return null;
}

/** Search stays on the name. The given name is not part of the query. */
export function visibleGivenCustomers<T extends GivenRow>(
  rows: readonly T[],
  initial: string | null,
  ending: GivenEnding | null,
  length: GivenLength | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (initial !== null && initialOf(row.given) !== initial) return false;
    if (ending !== null && endingOf(row.given) !== ending) return false;
    if (length !== null && lengthOf(row.given) !== length) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the initials, lengths, and endings on this page. */
export function givensCsv(rows: readonly GivenRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of initialLines(rows)) lines.push(["initial", csvCell(line.initial), String(line.count)].join(","));
  for (const line of lengthLines(rows)) lines.push(["length", line.length, String(line.count)].join(","));
  for (const line of endingLines(rows)) lines.push(["ending", line.ending, String(line.count)].join(","));
  return lines.join("\n");
}
