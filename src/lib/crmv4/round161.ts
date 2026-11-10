/**
 * Local press proofs for document review, and affiliate ribbons already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_press_proof (
 *   id text primary key,
 *   note text not null,
 *   reviewer text not null default '',
 *   folio integer,
 *   ink text not null default '',
 *   docket text not null default '',
 *   weight text not null default '',
 *   pinned boolean not null default false,
 *   proofed boolean not null default false,
 *   issued boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_ribbon_hide (
 *   ribbon text primary key
 * );
 */

export const PROOF_KEY = "crmv4-press-proofs";
export const PROOF_VIEW_KEY = "crmv4-press-views";
export const RIBBON_KEY = "crmv4-ribbon-hide";

export type ProofWeight = "blank" | "light" | "firm" | "heavy";

export type ProofInk = "blank" | "carbon" | "iron" | "walnut" | "soot";

export type ProofTray = "open" | "proofed" | "issued";

export type SheetPick = "blank" | "cover" | "leaf" | "spine" | "end" | "inner" | "outer";

export type ProofCard = {
  id: string;
  text: string;
  reviewer: string;
  folio: number | null;
  ink: string;
  docket: string;
  weight: string;
  pinned: boolean;
  proofed: boolean;
  issued: boolean;
  audit: string;
};

export type ProofView = {
  id: string;
  name: string;
  tray: ProofTray;
  query: string;
  reviewer: string;
  ink: string;
  docket: string;
  weight: string;
  folio: string;
};

export type ProofCounts = {
  open: number;
  proofed: number;
  issued: number;
  pinned: number;
  late: number;
};

export type RibbonSpan = "" | "short" | "pair" | "chain";

export type RibbonCut = "" | "vowel" | "consonant" | "other";

export type RibbonWeave = "" | "solo" | "joined" | "spaced";

export type RibbonValue =
  | {
      affiliateB?: unknown;
      affiliateA?: unknown;
      affiliateC?: unknown;
      campaign?: unknown;
      lastLoginAt?: unknown;
      lastSeenAt?: unknown;
      timezone?: unknown;
      language?: unknown;
      country?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      desk?: unknown;
      address?: unknown;
      city?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      lastCountryName?: unknown;
      createdAt?: unknown;
      username?: unknown;
      accountLoginId?: unknown;
      retentionNote?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type RibbonRow = { affiliateB?: RibbonValue; label?: string | null };

export type SpanLine = { span: string; count: number };

export type CutLine = { cut: string; count: number };

export type WeaveLine = { weave: string; count: number };

export type RibbonLine = { ribbon: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "proof", "lift", "issue", "recall"] as const;

const INKS = ["carbon", "iron", "walnut", "soot"] as const;

const WEIGHTS = ["light", "firm", "heavy"] as const;

const WEIGHT_ORDER = ["", "light", "firm", "heavy"] as const;

const PICKS = ["blank", "cover", "leaf", "spine", "end", "inner", "outer"] as const;

const SHEETS = ["cover", "leaf", "spine", "end"] as const;

const SPANS = ["short", "pair", "chain"] as const;

const CUTS = ["", "vowel", "consonant", "other"] as const;

const WEAVES = ["", "solo", "joined", "spaced"] as const;

const RIBBON_BLOCK = ["affiliateA", "affiliateC", "campaign", "lastLoginAt", "lastSeenAt", "timezone", "language", "country", "name", "email", "phone", "desk", "address", "city", "firstName", "lastName", "lastCountryName", "createdAt", "username", "accountLoginId", "retentionNote"] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ProofTray {
  return raw === "proofed" || raw === "issued" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<ProofInk, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<ProofInk, "blank">) : "";
}

function weightName(raw: unknown): Exclude<ProofWeight, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WEIGHTS as readonly string[]).includes(text) ? (text as Exclude<ProofWeight, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function proofText(raw: unknown): string {
  return clip(raw, 56);
}

/** A blank reviewer stays blank. It is not filled in. */
export function reviewerLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A blank docket stays blank. It is not filled in. */
export function proofDocket(raw: unknown): string {
  return clip(raw, 8);
}

/**
 * A folio is 1 through 8.
 * A blank value stays unset. 0 and 9 are not folios.
 * A leading zero is still a folio: 01 is 1, and 08 is 8.
 * 00 and 09 are not folios.
 */
export function folioOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 8) return raw;
  if (typeof raw === "string" && /^(?:0?[1-8])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Carbon, iron, walnut, soot, or blank. Anything else is blank. */
export function inkOf(raw: unknown): ProofInk {
  return inkName(raw) || "blank";
}

/** Light, firm, heavy, or blank. Anything else is blank. */
export function weightOf(raw: unknown): ProofWeight {
  return weightName(raw) || "blank";
}

/** Cover is 1–2. Leaf is 3–4. Spine is 5–6. End is 7–8. An unset folio is blank. */
export function sheetOf(folio: unknown): "blank" | "cover" | "leaf" | "spine" | "end" {
  const count = folioOf(folio);
  if (count === null) return "blank";
  if (count <= 2) return "cover";
  if (count <= 4) return "leaf";
  if (count <= 6) return "spine";
  return "end";
}

/** Inner is 1–4. Outer is 5–8. An unset folio is blank. */
export function sideOf(folio: unknown): "blank" | "inner" | "outer" {
  const count = folioOf(folio);
  if (count === null) return "blank";
  return count <= 4 ? "inner" : "outer";
}

/** The typed folio minus the slip folio. A positive gap is past the folio. */
export function proofGap(folio: unknown, desk: unknown): number | null {
  const from = folioOf(folio);
  const at = folioOf(desk);
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
      reviewer: reviewerLabel(row.reviewer),
      folio: folioOf(row.folio),
      ink: inkName(row.ink),
      docket: proofDocket(row.docket),
      weight: weightName(row.weight),
      pinned: row.pinned === true,
      proofed: row.proofed === true,
      issued: row.issued === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 10);
}

export function addProof(
  cards: readonly ProofCard[],
  card: { id: string; text: string; reviewer?: string; folio?: unknown; ink?: string; docket?: string; weight?: string },
): ProofCard[] {
  const current = readProofs(cards);
  const id = String(card.id || "").trim();
  const text = proofText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: ProofCard = {
    id,
    text,
    reviewer: reviewerLabel(card.reviewer),
    folio: folioOf(card.folio),
    ink: inkName(card.ink),
    docket: proofDocket(card.docket),
    weight: weightName(card.weight),
    pinned: false,
    proofed: false,
    issued: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 10);
}

export function stepProofWeight(cards: readonly ProofCard[], id: string, dir: 1 | -1): ProofCard[] {
  return readProofs(cards).map((card) => {
    if (card.id !== id) return card;
    const at = WEIGHT_ORDER.indexOf(card.weight as (typeof WEIGHT_ORDER)[number]);
    const next = WEIGHT_ORDER[Math.min(WEIGHTS.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.weight) return card;
    return { ...card, weight: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setProofPinned(cards: readonly ProofCard[], id: string, pinned: boolean): ProofCard[] {
  return readProofs(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setProofProofed(cards: readonly ProofCard[], id: string, proofed: boolean): ProofCard[] {
  return readProofs(cards).map((card) => (card.id === id ? { ...card, proofed, audit: proofed ? "proof" : "lift" } : card));
}

export function setProofIssued(cards: readonly ProofCard[], id: string, issued: boolean): ProofCard[] {
  return readProofs(cards).map((card) => (card.id === id ? { ...card, issued, audit: issued ? "issue" : "recall" } : card));
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

export function bulkProofIssued(cards: readonly ProofCard[], ids: readonly string[], issued: boolean): ProofCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readProofs(cards).map((card) => (want.has(card.id) ? { ...card, issued, audit: issued ? "issue" : "recall" } : card));
}

export function resetProofs(): ProofCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function proofCopy(raw: unknown): string {
  return proofText(raw);
}

function inTray(card: ProofCard, tray: ProofTray): boolean {
  if (tray === "issued") return card.issued;
  if (tray === "proofed") return card.proofed && !card.issued;
  return !card.proofed && !card.issued;
}

function folioHit(folio: number | null, exact: number | null, sheet: SheetPick | null): boolean {
  if (exact !== null) return folio === exact;
  if (sheet === null) return true;
  if (sheet === "blank") return folio === null;
  if (sheet === "inner" || sheet === "outer") return sideOf(folio) === sheet;
  return sheetOf(folio) === sheet;
}

function weightScore(weight: string): number {
  if (weight === "heavy") return 3;
  if (weight === "firm") return 2;
  if (weight === "light") return 1;
  return 0;
}

function lightLate(card: ProofCard, desk: unknown): boolean {
  const gap = proofGap(card.folio, desk);
  return gap !== null && gap > 0 && card.weight === "light" && inTray(card, "open");
}

/** Search stays on the note. The reviewer, the folio, the ink, the docket, and the weight are not part of the query. */
export function visibleProofs(
  cards: readonly ProofCard[],
  tray: ProofTray,
  query: string,
  reviewer: string | null,
  ink: ProofInk | null,
  docket: string | null,
  weight: ProofWeight | null,
  exact: number | null,
  sheet: SheetPick | null,
  heavyOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): ProofCard[] {
  const text = query.trim().toLowerCase();
  const wantReviewer = reviewer === null ? null : reviewerLabel(reviewer);
  const wantDocket = docket === null ? null : proofDocket(docket);
  return readProofs(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (heavyOnly && card.weight !== "heavy") return false;
      if (wantReviewer !== null && reviewerLabel(card.reviewer) !== wantReviewer) return false;
      if (ink !== null && inkOf(card.ink) !== ink) return false;
      if (wantDocket !== null && proofDocket(card.docket) !== wantDocket) return false;
      if (weight !== null && weightOf(card.weight) !== weight) return false;
      if (!folioHit(card.folio, exact, sheet)) return false;
      if (lateOnly && !lightLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (weightScore(a.weight) !== weightScore(b.weight)) return weightScore(b.weight) - weightScore(a.weight);
      return a.text.localeCompare(b.text);
    });
}

/** The folio orders the desk. An unset folio stays at the end. Search stays on the note. */
export function proofTimeline(cards: readonly ProofCard[], query: string): ProofCard[] {
  const text = query.trim().toLowerCase();
  return readProofs(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.folio === null && b.folio !== null) return 1;
      if (a.folio !== null && b.folio === null) return -1;
      if (a.folio !== null && b.folio !== null && a.folio !== b.folio) return a.folio - b.folio;
      return a.text.localeCompare(b.text);
    });
}

export function proofCounts(cards: readonly ProofCard[], desk: unknown): ProofCounts {
  const rows = readProofs(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    proofed: rows.filter((card) => inTray(card, "proofed")).length,
    issued: rows.filter((card) => inTray(card, "issued")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => lightLate(card, desk)).length,
  };
}

/** Share of the saved proofs. A zero total stays at zero. */
export function proofShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function proofReviewers(cards: readonly ProofCard[]): string[] {
  const out: string[] = [];
  for (const card of readProofs(cards)) {
    if (card.reviewer && !out.includes(card.reviewer)) out.push(card.reviewer);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function proofDockets(cards: readonly ProofCard[]): string[] {
  const out: string[] = [];
  for (const card of readProofs(cards)) {
    if (card.docket && !out.includes(card.docket)) out.push(card.docket);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function proofInks(cards: readonly ProofCard[]): Exclude<ProofInk, "blank">[] {
  const seen = new Set<string>();
  for (const card of readProofs(cards)) if (card.ink) seen.add(card.ink);
  return INKS.filter((ink) => seen.has(ink));
}

export function proofWeights(cards: readonly ProofCard[]): Exclude<ProofWeight, "blank">[] {
  const seen = new Set<string>();
  for (const card of readProofs(cards)) if (card.weight) seen.add(card.weight);
  return WEIGHTS.filter((weight) => seen.has(weight));
}

/** Four sheets. Index 0 is cover. Index 3 is end. */
export function sheetCounts(cards: readonly ProofCard[]): number[] {
  const rows = readProofs(cards);
  return SHEETS.map((sheet) => rows.filter((card) => sheetOf(card.folio) === sheet).length);
}

/** "all" and "blank" stay. A reviewer that is no longer on a proof falls back to all. */
export function activeReviewer(filter: string, reviewers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const reviewer = reviewerLabel(filter);
  return reviewer && reviewers.includes(reviewer) ? reviewer : "all";
}

export function reviewerArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return reviewerLabel(filter);
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

/** "all" and "blank" stay. A docket that is no longer on a proof falls back to all. */
export function activeDocket(filter: string, dockets: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const docket = proofDocket(filter);
  return docket && dockets.includes(docket) ? docket : "all";
}

export function docketArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return proofDocket(filter);
}

/** "all" and "blank" stay. A weight that is no longer on a proof falls back to all. */
export function activeWeight(filter: string, weights: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const weight = weightName(filter);
  return weight && weights.includes(weight) ? weight : "all";
}

export function weightArg(filter: string): ProofWeight | null {
  if (filter === "blank") return "blank";
  return weightName(filter) || null;
}

/** All, blank, the four sheets, the two sides, and the folios 1 through 8 stay. Anything else is all. */
export function activeFolio(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const folio = folioOf(filter);
  return folio === null ? "all" : String(folio);
}

export function folioArg(filter: string): { exact: number | null; sheet: SheetPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, sheet: filter as SheetPick };
  const folio = folioOf(filter);
  return folio === null ? { exact: null, sheet: null } : { exact: folio, sheet: null };
}

/** Other proofs with the same ink and the same docket. A blank ink or a blank docket clashes with nothing. */
export function proofClashIds(cards: readonly ProofCard[], id: string): string[] {
  const rows = readProofs(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.ink || !card.docket) return [];
  return rows
    .filter((item) => item.id !== id && item.ink === card.ink && item.docket === card.docket)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** How many saved proofs share an ink and a docket with another proof. */
export function clashProofCount(cards: readonly ProofCard[]): number {
  const rows = readProofs(cards);
  return rows.filter((card) => proofClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open proof at or after the folio you type, skipping heavy.
 * After the last folio, the desk wraps to the earliest open proof that is not heavy.
 */
export function nextProof(cards: readonly ProofCard[], desk: unknown): string {
  const now = folioOf(desk);
  if (now === null) return "";
  const waiting = readProofs(cards).filter((card) => inTray(card, "open") && card.folio !== null && card.weight !== "heavy");
  if (!waiting.length) return "";
  const byFolio = (a: ProofCard, b: ProofCard) => (a.folio ?? 0) - (b.folio ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.folio ?? 0) >= now).sort(byFolio);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byFolio)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the proofs saved in this browser. The gap uses the folio you pass. */
export function proofsCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,reviewer,folio,ink,docket,weight,sheet,pinned,proofed,issued,gap,audit"];
  for (const card of readProofs(raw)) {
    const gap = proofGap(card.folio, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.reviewer),
      card.folio === null ? "" : String(card.folio),
      card.ink,
      csvCell(card.docket),
      card.weight,
      sheetOf(card.folio),
      card.pinned ? "1" : "0",
      card.proofed ? "1" : "0",
      card.issued ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function reviewerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return reviewerLabel(raw) || "all";
}

function inkSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return inkName(raw) || "all";
}

function docketSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return proofDocket(raw) || "all";
}

function weightSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return weightName(raw) || "all";
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
      query: clip(row.query, 56),
      reviewer: reviewerSlot(row.reviewer),
      ink: inkSlot(row.ink),
      docket: docketSlot(row.docket),
      weight: weightSlot(row.weight),
      folio: activeFolio(String(row.folio ?? "")),
    });
  }
  return out.slice(0, 5);
}

export function addProofView(
  views: readonly ProofView[],
  view: { id: string; name: string; tray: ProofTray; query: string; reviewer: string; ink: string; docket: string; weight: string; folio: string },
): ProofView[] {
  const current = readProofViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 56),
    reviewer: reviewerSlot(view.reviewer),
    ink: inkSlot(view.ink),
    docket: docketSlot(view.docket),
    weight: weightSlot(view.weight),
    folio: activeFolio(view.folio),
  }].slice(0, 5);
}

export function dropProofView(views: readonly ProofView[], id: string): ProofView[] {
  return readProofViews(views).filter((view) => view.id !== id);
}

function ribbonRaw(value: RibbonValue): string {
  if (typeof value === "string") return clip(value, 32);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (RIBBON_BLOCK.some((key) => key in value)) return "";
  return clip(value.affiliateB, 32);
}

/** The affiliate B code already on the row. A campaign, affiliate A, affiliate C, and the other blocked fields are not a ribbon. */
export function ribbonName(value: RibbonValue): string {
  return ribbonRaw(value);
}

/**
 * A span from the affiliate B field, or blank.
 * A campaign, a login, a name, an email, and the other blocked fields are not a ribbon.
 * A missing affiliate B stays unmarked and is not filled in.
 */
export function assignedRibbon(value: RibbonValue): string {
  return spanOf(value);
}

/** Short is 1–3 letters. Pair is 4–6. Chain is 7 or more. An unmarked code stays blank. */
export function spanOf(value: RibbonValue): RibbonSpan {
  const text = ribbonRaw(value);
  if (!text) return "";
  if (text.length <= 3) return "short";
  if (text.length <= 6) return "pair";
  return "chain";
}

function codePoint(ch: string): number {
  return ch.codePointAt(0) || 0;
}

function letterStart(ch: string): boolean {
  if (/[A-Za-z]/.test(ch)) return true;
  const code = codePoint(ch);
  return (code >= 0x00c0 && code <= 0x024f) || (code >= 0x0370 && code <= 0x03ff) || (code >= 0x0400 && code <= 0x052f) || (code >= 0x0600 && code <= 0x06ff);
}

const VOWEL = /[AEIOUaeiouÀÁÂÄÆÃÅĀÈÉÊËĒÌÍÎÏĪÒÓÔÖÕØŌÙÚÛÜŪıİÖÜаеёиоуыэюяАЕЁИОУЫЭЮЯاأإآوي]/;

/** Vowel starts with a vowel. Consonant starts with another letter. Other is anything else. An unmarked code stays blank. */
export function cutOf(value: RibbonValue): RibbonCut {
  const text = ribbonRaw(value);
  if (!text) return "";
  const first = Array.from(text)[0] || "";
  if (letterStart(first) && VOWEL.test(first)) return "vowel";
  if (letterStart(first)) return "consonant";
  return "other";
}

/** Joined holds an underscore, a dot, or a slash. Spaced holds a space or a hyphen and none of those. Solo is the rest. */
export function weaveOf(value: RibbonValue): RibbonWeave {
  const text = ribbonRaw(value);
  if (!text) return "";
  if (/[_.\/]/.test(text)) return "joined";
  if (/[\s-]/.test(text)) return "spaced";
  return "solo";
}

export function spanLines(rows: readonly RibbonRow[]): SpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = spanOf(row.affiliateB);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: SpanLine[] = [];
  for (const span of ["", ...SPANS]) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly RibbonRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

export function cutLines(rows: readonly RibbonRow[]): CutLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const cut = cutOf(row.affiliateB);
    map.set(cut, (map.get(cut) || 0) + 1);
  }
  const out: CutLine[] = [];
  for (const cut of CUTS) {
    const count = map.get(cut);
    if (count) out.push({ cut, count });
  }
  return out;
}

export function namedCuts(rows: readonly RibbonRow[]): string[] {
  return cutLines(rows).map((line) => line.cut).filter(Boolean);
}

export function weaveLines(rows: readonly RibbonRow[]): WeaveLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const weave = weaveOf(row.affiliateB);
    map.set(weave, (map.get(weave) || 0) + 1);
  }
  const out: WeaveLine[] = [];
  for (const weave of WEAVES) {
    const count = map.get(weave);
    if (count) out.push({ weave, count });
  }
  return out;
}

export function namedWeaves(rows: readonly RibbonRow[]): string[] {
  return weaveLines(rows).map((line) => line.weave).filter(Boolean);
}

export function ribbonLines(rows: readonly RibbonRow[]): RibbonLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const ribbon = ribbonName(row.affiliateB);
    map.set(ribbon, (map.get(ribbon) || 0) + 1);
  }
  const out: RibbonLine[] = [];
  const names: string[] = [];
  map.forEach((_count, ribbon) => {
    if (ribbon) names.push(ribbon);
  });
  names.sort((a, b) => a.localeCompare(b));
  if (map.get("")) out.push({ ribbon: "", count: map.get("") || 0 });
  for (const ribbon of names) out.push({ ribbon, count: map.get(ribbon) || 0 });
  return out;
}

export function namedRibbons(rows: readonly RibbonRow[]): string[] {
  return ribbonLines(rows).map((line) => line.ribbon).filter(Boolean);
}

/** The named ribbon with the most loaded rows. A tie keeps the earlier ribbon. A blank ribbon is not a lead. */
export function leadingRibbon(rows: readonly RibbonRow[]): string {
  const named = ribbonLines(rows).filter((line) => line.ribbon);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.ribbon.localeCompare(b.ribbon))[0].ribbon;
}

/** The span with the most loaded rows. A tie keeps the earlier span. An unmarked code is not a lead. */
export function leadingSpan(rows: readonly RibbonRow[]): string {
  const named = spanLines(rows).filter((line) => line.span);
  if (!named.length) return "";
  const order = (span: string) => SPANS.indexOf(span as (typeof SPANS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.span) - order(b.span))[0].span;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function ribbonShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenRibbons(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = clip(item, 32);
    if (!mark || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleRibbon(hidden: readonly string[], ribbon: string, present: readonly string[]): string[] {
  const mark = ribbonName(ribbon);
  if (!mark || !present.includes(mark)) return readHiddenRibbons(hidden, present);
  const current = readHiddenRibbons(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleRibbons(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenRibbons(hidden, present));
  return present.filter((ribbon) => (showHidden ? gone.has(ribbon) : !gone.has(ribbon)));
}

/** "all" and "blank" stay. A ribbon that is no longer loaded falls back to all. */
export function activeRibbon(filter: string, ribbons: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ribbon = ribbonName(filter);
  return ribbon && ribbons.includes(ribbon) ? ribbon : "all";
}

export function ribbonArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const ribbon = ribbonName(filter);
  return ribbon || null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SPANS as readonly string[]).includes(filter) && spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): RibbonSpan | null {
  if (filter === "blank") return "";
  if ((SPANS as readonly string[]).includes(filter)) return filter as RibbonSpan;
  return null;
}

/** "all" and "blank" stay. A cut that is no longer loaded falls back to all. */
export function activeCut(filter: string, cuts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (CUTS as readonly string[]).includes(filter) && cuts.includes(filter) ? filter : "all";
}

export function cutArg(filter: string): RibbonCut | null {
  if (filter === "blank") return "";
  if ((CUTS as readonly string[]).includes(filter) && filter !== "") return filter as RibbonCut;
  return null;
}

/** "all" and "blank" stay. A weave that is no longer loaded falls back to all. */
export function activeWeave(filter: string, weaves: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (WEAVES as readonly string[]).includes(filter) && weaves.includes(filter) ? filter : "all";
}

export function weaveArg(filter: string): RibbonWeave | null {
  if (filter === "blank") return "";
  if ((WEAVES as readonly string[]).includes(filter) && filter !== "") return filter as RibbonWeave;
  return null;
}

/** Search stays on the name. The ribbon is not part of the query. */
export function visibleRibbonCustomers<T extends RibbonRow>(
  rows: readonly T[],
  span: RibbonSpan | null,
  cut: RibbonCut | null,
  weave: RibbonWeave | null,
  ribbon: string | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (span !== null && spanOf(row.affiliateB) !== span) return false;
    if (cut !== null && cutOf(row.affiliateB) !== cut) return false;
    if (weave !== null && weaveOf(row.affiliateB) !== weave) return false;
    if (ribbon !== null && ribbonName(row.affiliateB) !== ribbon) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the spans, cuts, weaves, and ribbons on this page. */
export function ribbonsCsv(rows: readonly RibbonRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of spanLines(rows)) lines.push(["span", csvCell(line.span), String(line.count)].join(","));
  for (const line of cutLines(rows)) lines.push(["cut", line.cut, String(line.count)].join(","));
  for (const line of weaveLines(rows)) lines.push(["weave", line.weave, String(line.count)].join(","));
  for (const line of ribbonLines(rows)) lines.push(["ribbon", csvCell(line.ribbon), String(line.count)].join(","));
  return lines.join("\n");
}
