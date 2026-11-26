/**
 * Ciselé strokes kept in this browser,
 * and intaglio plates read the account login already stored on the account.
 * Strokes are trace, bevel, point, and flare. Glazes are pearl, ink, and gilt.
 * Spans are 8, 16, 32, or 64 minutes. Beads are 2, 4, or 6.
 * Trace and bevel are the warm half. Point and flare are the cool half.
 * Mark, live, open, ready, yes, and clear are the mark. Wait, hold, ask, and pend sit the desk.
 * Later, next, and week wait. Bad, void, fail, and lost are returned.
 * Twin and ext are paired. None, nil, blank, and empty stay bare.
 * A plus of four to fourteen digits is the mark. Any other plus joins two marks.
 * A colon that is not a date marks a scoped mark.
 * A date today is the mark. Within three days is the desk. Within nine days waits. Older is returned.
 * A brief mark is exactly five characters. A digit mark starts with a digit and is not a date or a desk number.
 * A span mark is fourteen characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * The words login and user are the mark when they are not a known title. Hidden, sealed, or private is shut.
 * Five to twelve digits sit the desk.
 * A true login reads as MARK. A false login reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved login.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cisele_stroke (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   chisel text not null default '',
 *   stroke text not null default '',
 *   sla_min integer,
 *   glaze text not null default '',
 *   bead integer not null default 2,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   clamped boolean not null default false,
 *   chested boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_intaglio_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_intaglio_review (
 *   trader_id text primary key
 * );
 */

export const CIS_KEY = "crmv4-cisele-379";
export const CIS_VIEW_KEY = "crmv4-cisele-views-379";
export const CIS_DENSITY_KEY = "crmv4-cisele-density-379";
export const CIS_STROKES = ["trace", "bevel", "point", "flare"] as const;

export type CiseleStroke = (typeof CIS_STROKES)[number];
export type CiseleGlaze = "blank" | "pearl" | "ink" | "gilt";
export type CiseleTray = "bench" | "clamp" | "chest";
export type CiseleDensity = "open" | "tight";
export type CiseleSort = "stroke" | "chisel";

export type Cisele = {
  id: string;
  title: string;
  note: string;
  chisel: string;
  stroke: string;
  sla: number | null;
  glaze: string;
  bead: number;
  tags: string[];
  raised: boolean;
  clamped: boolean;
  chested: boolean;
  starred: boolean;
  audit: string;
};

export type CiseleView = {
  id: string;
  name: string;
  tray: CiseleTray;
  query: string;
  chisel: string;
  glaze: string;
  stroke: string;
  sla: string;
  bead: string;
};

export type CiseleCounts = {
  bench: number;
  clamp: number;
  chest: number;
  raised: number;
  warm: number;
  cool: number;
  long: number;
  quiet: number;
  minutes: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND379_FEATURES = [
  "cisele-save",
  "cisele-reminders",
  "cisele-strokes",
  "cisele-search",
  "cisele-span-sla",
  "cisele-chest",
  "cisele-star",
  "cisele-inline-title",
  "cisele-filters",
  "saved-cisele-views",
  "cisele-density",
  "cisele-focus",
  "cisele-kpis",
  "cisele-chart",
  "cisele-timeline",
  "cisele-bulk",
  "cisele-csv",
  "cisele-keys",
  "cisele-audit",
  "least-open-chisel",
  "cisele-viewer",
  "suggest-stroke",
  "overdue-flare",
  "intaglio-logins",
  "intaglio-csv",
] as const;

const AUDITS = ["save", "edit", "note", "glaze", "raise", "free", "pin", "return", "vault", "open", "tag", "bead", "sla", "lower", "star"] as const;
const GLAZES = ["pearl", "ink", "gilt"] as const;
const SLA_CYCLE = [8, 16, 32, 64] as const;
const BEAD_CYCLE = [2, 4, 6] as const;
const WARM = new Set(["trace", "bevel"]);
const COOL = new Set(["point", "flare"]);
const QUIET_GLAZE = new Set(["INK"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "babevel"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CiseleTray {
  return raw === "clamp" || raw === "chest" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glazeName(raw: unknown): Exclude<CiseleGlaze, "blank"> | "" {
  const text = snip(raw, 12).toLowerCase();
  return (GLAZES as readonly string[]).includes(text) ? (text as Exclude<CiseleGlaze, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[ef]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Cisele, tray: CiseleTray): boolean {
  if (tray === "clamp") return card.clamped && !card.chested;
  if (tray === "chest") return card.chested;
  return !card.clamped && !card.chested;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function strokeIndex(stroke: string): number {
  return CIS_STROKES.indexOf(stroke as CiseleStroke);
}

function slaIndex(sla: number): number {
  return SLA_CYCLE.indexOf(sla as (typeof SLA_CYCLE)[number]);
}

function beadIndex(bead: number): number {
  return BEAD_CYCLE.indexOf(bead as (typeof BEAD_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return snip(raw, 48);
}

function noteOf(raw: unknown): string {
  return snip(raw, 80);
}

function wholeToken(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function strokePoint(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  return (CIS_STROKES as readonly string[]).includes(text) ? text : "";
}

/** A minute mark is 8, 16, 32, or 64. Anything else stays blank. */
export function strokeSpan(raw: unknown): 8 | 16 | 32 | 64 | null {
  const text = wholeToken(raw);
  if (text !== "8" && text !== "16" && text !== "32" && text !== "64") return null;
  return Number(text) as 8 | 16 | 32 | 64;
}

/** A bead count is 2, 4, or 6. Anything else stays blank. */
export function strokeBead(raw: unknown): 2 | 4 | 6 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "6") return null;
  return Number(text) as 2 | 4 | 6;
}

/** A glaze is pearl, ink, or gilt. The saved name is the upper token. */
export function strokeGlaze(raw: unknown): string {
  const text = glazeName(raw);
  return text ? text.toUpperCase() : "";
}

export function strokeWarm(stroke: unknown): boolean {
  return WARM.has(snip(stroke, 12).toLowerCase());
}

export function strokeCool(stroke: unknown): boolean {
  return COOL.has(snip(stroke, 12).toLowerCase());
}

/** Pomme is first. Lance is second. Feuille is third. Alpha is fourth. */
export function strokeBand(stroke: unknown): string {
  const text = strokePoint(stroke);
  if (!text) return "";
  if (text === "trace") return "first";
  if (text === "bevel") return "second";
  if (text === "point") return "third";
  return "fourth";
}

/** Signed distance from one stroke to another along the cisele. */
export function strokeGap(from: unknown, to: unknown): number | null {
  const left = strokeIndex(strokePoint(from));
  const right = strokeIndex(strokePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function inkQuiet(glaze: unknown): boolean {
  return QUIET_GLAZE.has(strokeGlaze(glaze));
}

/** A pair bead is 4. Two and six are not a pair. */
export function pairBead(bead: unknown): boolean {
  return strokeBead(bead) === 4;
}

/** A full bead is 6. */
export function fullBead(bead: unknown): boolean {
  return strokeBead(bead) === 6;
}

export function activeStroke(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return strokePoint(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const sla = strokeSpan(raw);
  return sla === null ? "all" : String(sla);
}

export function activeGlaze(raw: unknown, allow: readonly string[]): string {
  const text = strokeGlaze(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeBead(raw: unknown): string {
  const bead = strokeBead(raw);
  return bead === null ? "all" : String(bead);
}

export function moveCiseleFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The glaze the bench uses least. A tie keeps pearl, then ink, then gilt. */
export function suggestGlaze(cards: readonly Cisele[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.glaze) continue;
    counts.set(card.glaze, (counts.get(card.glaze) || 0) + 1);
  }
  let best = "PEARL";
  let score = Number.POSITIVE_INFINITY;
  for (const glaze of ["PEARL", "INK", "GILT"]) {
    const count = counts.get(glaze) || 0;
    if (count < score) {
      best = glaze;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest ten. Before twelve, suggest twenty. Before eighteen, suggest forty. Later, suggest eighty. A saved minute on the bench wins, and a tie keeps the shorter minute. */
export function suggestSpan(cards: readonly Cisele[], hour: number): 8 | 16 | 32 | 64 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.sla === null) continue;
    seen = true;
    counts.set(card.sla, (counts.get(card.sla) || 0) + 1);
  }
  if (seen) {
    let best: 8 | 16 | 32 | 64 = 8;
    let score = Number.POSITIVE_INFINITY;
    for (const sla of SLA_CYCLE) {
      const count = counts.get(sla) || 0;
      if (count < score) {
        best = sla;
        score = count;
      }
    }
    return best;
  }
  if (hour < 5) return 8;
  if (hour < 11) return 16;
  if (hour < 17) return 32;
  return 64;
}

export function suggestStroke(hour: number): CiseleStroke {
  if (hour < 5) return "trace";
  if (hour < 11) return "bevel";
  if (hour < 17) return "point";
  return "flare";
}

/** The chisel with the fewest unraised ciseles on the bench. A tie keeps the roster order. */
export function fairChisel(cards: readonly Cisele[], roster: string): string {
  const names = roster.split(",").map((item) => snip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.raised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.chisel.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readCiseles(raw: unknown): Cisele[] {
  if (!Array.isArray(raw)) return [];
  const out: Cisele[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Cisele>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      chisel: snip(row.chisel, 24),
      stroke: strokePoint(row.stroke),
      sla: strokeSpan(row.sla),
      glaze: strokeGlaze(row.glaze),
      bead: strokeBead(row.bead) ?? 2,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      clamped: row.clamped === true,
      chested: row.chested === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addCisele(
  cards: readonly Cisele[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    chisel?: string;
    stroke?: string;
    sla?: unknown;
    glaze?: string;
    bead?: unknown;
    tags?: unknown;
  },
): Cisele[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `c${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCiseles([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      chisel: snip(card.chisel, 24),
      stroke: strokePoint(card.stroke),
      sla: strokeSpan(card.sla),
      glaze: strokeGlaze(card.glaze),
      bead: strokeBead(card.bead) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      clamped: false,
      chested: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Cisele[], id: string, edit: (card: Cisele) => Cisele): Cisele[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCisele(cards: readonly Cisele[], id: string, title: string): Cisele[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCiseleNote(cards: readonly Cisele[], id: string, note: string): Cisele[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleGlaze(glaze: string): string {
  const order = ["", "PEARL", "INK", "GILT"];
  const index = order.indexOf(strokeGlaze(glaze));
  return order[(index + 1) % order.length] || "PEARL";
}

export function setCiseleGlaze(cards: readonly Cisele[], id: string, glaze: string): Cisele[] {
  const next = strokeGlaze(glaze);
  return mapCard(cards, id, (card) => (card.glaze === next ? card : { ...card, glaze: next, audit: "glaze" }));
}

export function setCiseleRaised(cards: readonly Cisele[], id: string, raised: boolean): Cisele[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setCiseleClip(cards: readonly Cisele[], id: string, clamped: boolean): Cisele[] {
  return mapCard(cards, id, (card) => (card.clamped === clamped ? card : { ...card, clamped, chested: clamped ? false : card.chested, audit: clamped ? "pin" : "return" }));
}

export function setCiseleChest(cards: readonly Cisele[], id: string, chested: boolean): Cisele[] {
  return mapCard(cards, id, (card) => (card.chested === chested ? card : { ...card, chested, clamped: chested ? false : card.clamped, audit: chested ? "vault" : "open" }));
}

export function setCiseleStar(cards: readonly Cisele[], id: string, starred: boolean): Cisele[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addCiseleTag(cards: readonly Cisele[], id: string, tag: string): Cisele[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpan(sla: number | null, dir: 1 | -1): 8 | 16 | 32 | 64 {
  if (sla === null) return dir > 0 ? 8 : 64;
  const index = slaIndex(sla);
  const next = index < 0 ? 0 : (index + dir + SLA_CYCLE.length) % SLA_CYCLE.length;
  return SLA_CYCLE[next];
}

function stepBead(bead: number, dir: 1 | -1): 2 | 4 | 6 {
  const index = beadIndex(bead);
  const next = index < 0 ? 0 : (index + dir + BEAD_CYCLE.length) % BEAD_CYCLE.length;
  return BEAD_CYCLE[next];
}

export function raiseSpanFocused(cards: readonly Cisele[], id: string): Cisele[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSpan(card.sla, 1), audit: "sla" }));
}

export function lowerSpanFocused(cards: readonly Cisele[], id: string): Cisele[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSpan(card.sla, -1), audit: "lower" }));
}

export function raiseBeadFocused(cards: readonly Cisele[], id: string): Cisele[] {
  return mapCard(cards, id, (card) => ({ ...card, bead: stepBead(card.bead, 1), audit: "bead" }));
}

export function lowerBeadFocused(cards: readonly Cisele[], id: string): Cisele[] {
  return mapCard(cards, id, (card) => ({ ...card, bead: stepBead(card.bead, -1), audit: "bead" }));
}

export function setCiseleFocused(cards: readonly Cisele[], id: string): Cisele[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function clampCiseleFocused(cards: readonly Cisele[], id: string): Cisele[] {
  return setCiseleClip(cards, id, !cards.find((card) => card.id === id)?.clamped);
}

export function starCiseleFocused(cards: readonly Cisele[], id: string): Cisele[] {
  return setCiseleStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function glazeFocused(cards: readonly Cisele[], id: string): Cisele[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCiseleGlaze(cards, id, cycleGlaze(card.glaze)) : [...cards];
}

function bulk(cards: readonly Cisele[], ids: readonly string[], edit: (card: Cisele) => Cisele): Cisele[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCiseleInk(cards: readonly Cisele[], ids: readonly string[]): Cisele[] {
  return bulk(cards, ids, (card) => (card.glaze === "INK" ? card : { ...card, glaze: "INK", audit: "glaze" }));
}

export function bulkCiseleRaise(cards: readonly Cisele[], ids: readonly string[]): Cisele[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkCiseleChest(cards: readonly Cisele[], ids: readonly string[]): Cisele[] {
  return bulk(cards, ids, (card) => (card.chested ? card : { ...card, chested: true, clamped: false, audit: "vault" }));
}

export function bulkCiseleTag(cards: readonly Cisele[], ids: readonly string[]): Cisele[] {
  return bulk(cards, ids, (card) => (card.tags.includes("e") ? card : { ...card, tags: tagsOf([...card.tags, "e"]), audit: "tag" }));
}

export function readCiseleViews(raw: unknown): CiseleView[] {
  if (!Array.isArray(raw)) return [];
  const out: CiseleView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CiseleView>;
    const id = snip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: snip(row.query, 40),
      chisel: snip(row.chisel, 24),
      glaze: activeGlaze(row.glaze, ["PEARL", "INK", "GILT"]),
      stroke: activeStroke(row.stroke),
      sla: activeSpan(row.sla),
      bead: activeBead(row.bead),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCiseleView(views: readonly CiseleView[], view: CiseleView): CiseleView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCiseleViews([...views, { ...view, name }]);
}

export function dropCiseleView(views: readonly CiseleView[], id: string): CiseleView[] {
  return views.filter((view) => view.id !== id);
}

export function ciseleDensity(raw: unknown): CiseleDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortCiseles(cards: readonly Cisele[], sort: CiseleSort): Cisele[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "chisel") {
      const chisel = a.chisel.localeCompare(b.chisel);
      if (chisel) return chisel;
    } else {
      const stroke = strokeIndex(a.stroke) - strokeIndex(b.stroke);
      if (stroke) return stroke;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleCiseles(
  cards: readonly Cisele[],
  tray: CiseleTray,
  query: string,
  chisel: string,
  glaze: string,
  stroke: string,
  sla: string,
  bead: string,
): Cisele[] {
  const text = query.trim().toLowerCase();
  const wantChisel = snip(chisel, 24).toLowerCase();
  const wantGlaze = glaze === "all" ? "" : strokeGlaze(glaze);
  const wantStroke = activeStroke(stroke);
  const wantSla = activeSpan(sla);
  const wantBead = activeBead(bead);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.chisel}`.toLowerCase().includes(text)) return false;
    if (wantChisel && card.chisel.toLowerCase() !== wantChisel) return false;
    if (wantGlaze && card.glaze !== wantGlaze) return false;
    if (wantStroke === "warm" && !strokeWarm(card.stroke)) return false;
    if (wantStroke === "cool" && !strokeCool(card.stroke)) return false;
    if (wantStroke !== "all" && wantStroke !== "warm" && wantStroke !== "cool" && card.stroke !== wantStroke) return false;
    if (wantSla !== "all" && String(card.sla ?? "") !== wantSla) return false;
    if (wantBead !== "all" && String(card.bead) !== wantBead) return false;
    return true;
  });
}

/** Alpha on bead three, still not raised and not in the chest, is overdue. */
export function overdueCisele(card: Cisele): boolean {
  return card.stroke === "flare" && card.bead === 2 && !card.raised && !card.chested;
}

/** No glaze, ten minutes, bead three, and still on the bench. */
export function idleCisele(card: Cisele): boolean {
  return !card.glaze && card.sla === 8 && card.bead === 2 && !card.raised && !card.clamped && !card.chested;
}

/** Gilt, eighty minutes, and a full bead, still out of the chest. */
export function briskCisele(card: Cisele): boolean {
  return card.glaze === "GILT" && card.sla === 64 && card.bead === 6 && !card.chested;
}

/** Alpha, pearl, and twenty minutes. */
export function restingCisele(card: Cisele): boolean {
  return card.stroke === "flare" && card.glaze === "PEARL" && card.sla === 16;
}

/** A trace cisele is late when the station is already flare. */
export function lateCisele(card: Cisele, station: string): boolean {
  return card.stroke === "trace" && strokePoint(station) === "flare" && !card.raised;
}

export function ciseleCounts(cards: readonly Cisele[], shown: readonly Cisele[], station: string): CiseleCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    clamp: cards.filter((card) => inTray(card, "clamp")).length,
    chest: cards.filter((card) => inTray(card, "chest")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => strokeWarm(card.stroke)).length,
    cool: cards.filter((card) => strokeCool(card.stroke)).length,
    long: cards.filter((card) => card.sla === 64).length,
    quiet: cards.filter((card) => inkQuiet(card.glaze)).length,
    minutes: cards.reduce((sum, card) => sum + (card.sla || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleCisele).length,
    brisk: cards.filter(briskCisele).length,
    resting: cards.filter(restingCisele).length,
    overdue: cards.filter(overdueCisele).length,
    pair: cards.filter((card) => pairBead(card.bead) && lateCisele(card, station)).length,
  };
}

export function ciseleBars(cards: readonly Cisele[]): { stroke: string; count: number }[] {
  return CIS_STROKES.map((stroke) => ({ stroke, count: cards.filter((card) => card.stroke === stroke && !card.chested).length }));
}

export function ciseleTimeline(cards: readonly Cisele[]): { sla: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return SLA_CYCLE.map((sla) => ({ sla, titles: open.filter((card) => card.sla === sla).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function ciseleChisels(cards: readonly Cisele[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.chisel && !out.some((name) => name.toLowerCase() === card.chisel.toLowerCase())) out.push(card.chisel);
  }
  return out;
}

export function busiestChisel(cards: readonly Cisele[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.raised && card.chisel);
  let best = "";
  let score = 0;
  for (const name of ciseleChisels(open)) {
    const count = open.filter((card) => card.chisel.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCiseles(cards: readonly Cisele[]): string[] {
  return cards.filter(overdueCisele).map((card) => card.title);
}

export function ciseleCopy(card: Cisele): string {
  return [card.title, card.chisel, card.stroke, card.glaze, card.sla ?? "", card.bead, card.note].filter((item) => item !== "").join(" · ");
}

export function ciseleCsv(cards: readonly Cisele[], station: string): string {
  const lines = ["title,chisel,stroke,glaze,minutes,bead,tags,raised,clamp,chest,starred,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.chisel),
        card.stroke,
        card.glaze,
        card.sla ?? "",
        card.bead,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.clamped ? "1" : "0",
        card.chested ? "1" : "0",
        card.starred ? "1" : "0",
        strokeCool(card.stroke) ? "1" : "0",
        lateCisele(card, station) ? "1" : "0",
        idleCisele(card) ? "1" : "0",
        briskCisele(card) ? "1" : "0",
        restingCisele(card) ? "1" : "0",
        overdueCisele(card) ? "1" : "0",
        strokeWarm(card.stroke) ? "1" : "0",
        inkQuiet(card.glaze) ? "1" : "0",
        strokeBand(card.stroke),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const ITG_HIDE_KEY = "crmv4-intaglio-hide-379";
export const ITG_REVIEW_KEY = "crmv4-intaglio-review-379";

export type ItgLane = "" | "mark" | "shut" | "later" | "desk" | "return" | "pair" | "scope" | "brief" | "span" | "digit" | "openv" | "bare";
export type ItgHue = "" | "pearl" | "ink" | "gilt";
export type ItgState = "" | "clear" | "set";
export type ItgReview = "all" | "reviewed" | "fresh";
export type ItgShape =
  | "all"
  | "mark"
  | "shut"
  | "later"
  | "return"
  | "pair"
  | "scope"
  | "brief"
  | "span"
  | "digit"
  | "openv"
  | "bare"
  | "open"
  | "soon"
  | "letter"
  | "mixed"
  | "upper"
  | "lower"
  | "space"
  | "even"
  | "odd"
  | "tail"
  | "first"
  | "held";

export type ItgValue = string | { accountLoginId?: unknown; [key: string]: unknown } | null | undefined;
export type ItgRow = { id: string; label: string; code: ItgValue; userId?: string };
export type ItgLaneLine = { mail: string; count: number };

const ITG_LANES = ["mark", "shut", "later", "desk", "return", "pair", "scope", "brief", "span", "digit", "openv", "bare"] as const;
const ITG_HUES = ["gilt", "pearl", "ink"] as const;

function codeRecord(raw: ItgValue): { accountLoginId?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: ItgValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: ItgValue): string {
  const row = codeRecord(raw);
  if (row && !("accountLoginId" in row)) return "";
  const value = row ? row.accountLoginId : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "MARK";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return snip(value, 48);
}

function codeReadable(raw: ItgValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("accountLoginId" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

function isoAt(text: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(text)) return null;
  const at = Date.parse(text);
  return Number.isNaN(at) ? null : at;
}

export function itgState(raw: ItgValue): ItgState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LINE_TITLES = new Set(["MARK", "LIVE", "OPEN", "READY", "YES", "CLEAR"]);
const DESK_TITLES = new Set(["WAIT", "HOLD", "ASK", "PEND"]);
const LATER_TITLES = new Set(["LATER", "NEXT", "WEEK"]);
const RETURN_TITLES = new Set(["BAD", "VOID", "FAIL", "LOST"]);
const PAIR_TITLES = new Set(["TWIN", "EXT"]);
const BARE_TITLES = new Set(["NONE", "NIL", "BLANK", "EMPTY"]);

/** A known login maps first. A plus of four to fourteen digits is the mark. Any other plus is paired. A date today is the mark. Within three days is the desk. Within nine days waits. Older is returned. A colon that is not a date is scoped. Five to twelve digits sit the desk. A digit start that is not a desk number is a digit mark. A brief mark is five characters. Hidden, sealed, or private is shut. The words login and user are the mark. A span mark is fourteen characters or longer. A vowel mark starts with a vowel. */
export function itgLane(raw: ItgValue, now = Date.now()): ItgLane {
  if (itgState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LINE_TITLES.has(upper)) return "mark";
  if (DESK_TITLES.has(upper)) return "desk";
  if (LATER_TITLES.has(upper)) return "later";
  if (RETURN_TITLES.has(upper)) return "return";
  if (PAIR_TITLES.has(upper)) return "pair";
  if (BARE_TITLES.has(upper)) return "bare";
  if (/hidden|sealed|private/i.test(text)) return "shut";
  if (/^\+\d{4,14}$/.test(text)) return "mark";
  if (text.includes("+")) return "pair";
  const at = isoAt(text);
  if (at !== null) {
    if (at > now) return "mark";
    const day = 86400000;
    const left = new Date(at);
    const right = new Date(now);
    const sameDay = left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
    if (sameDay) return "mark";
    const age = now - at;
    if (age < 3 * day) return "desk";
    if (age < 9 * day) return "later";
    return "return";
  }
  if (text.includes(":")) return "scope";
  if (/^\d{5,12}$/.test(text)) return "desk";
  if (/^[0-9]/.test(text)) return "digit";
  if (text.length === 5) return "brief";
  if (/\blogin\b|\buser\b/i.test(text)) return "mark";
  if (text.length >= 14) return "span";
  if (/^[aeiou]/i.test(text)) return "openv";
  return "bare";
}

export function itgHue(raw: ItgValue, now = Date.now()): ItgHue {
  const mail = itgLane(raw, now);
  if (!mail) return "";
  if (mail === "mark" || mail === "pair") return "gilt";
  if (mail === "desk" || mail === "return" || mail === "scope" || mail === "span") return "ink";
  return "pearl";
}

export function itgLine(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "mark";
}

export function itgShut(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "shut";
}

export function itgLater(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "later";
}

export function itgReturn(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "return";
}

export function itgDesk(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "desk";
}

export function itgPair(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "pair";
}

export function itgScope(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "scope";
}

export function itgBrief(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "brief";
}

export function itgSpanLane(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "span";
}

export function itgStampLane(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "digit";
}

export function itgVowelLane(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "openv";
}

export function itgBare(raw: ItgValue, now = Date.now()): boolean {
  return itgLane(raw, now) === "bare";
}

export function itgOpen(raw: ItgValue): boolean {
  return itgState(raw) === "clear";
}

/** A long phone or a digit phone can stay as written. */
export function itgHeld(raw: ItgValue): boolean {
  const mail = itgLane(raw);
  return mail === "span" || mail === "digit";
}

/** A brief phone, or a six-character phone that is not a known title, still wants a fuller number. */
export function itgSoon(raw: ItgValue, now = Date.now()): boolean {
  if (itgState(raw) !== "set") return false;
  if (itgBrief(raw, now)) return true;
  if (itgLine(raw, now) || itgShut(raw, now) || itgLater(raw, now) || itgReturn(raw, now)) return false;
  return codeGiven(raw).length === 5;
}

export function itgLength(raw: ItgValue): number | null {
  if (itgState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function itgEven(raw: ItgValue): boolean {
  const length = itgLength(raw);
  return length !== null && length % 2 === 0;
}

export function itgOdd(raw: ItgValue): boolean {
  const length = itgLength(raw);
  return length !== null && length % 2 === 1;
}

export function itgFirst(raw: ItgValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function itgTail(raw: ItgValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function itgSpace(raw: ItgValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function itgVowel(raw: ItgValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function itgDigit(raw: ItgValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function itgLetter(raw: ItgValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function itgMixed(raw: ItgValue): boolean {
  return itgDigit(raw) && itgLetter(raw);
}

export function itgLower(raw: ItgValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital phone note is four letters or more, written entirely in capitals. */
export function itgUpper(raw: ItgValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function itgStamp(raw: ItgValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function itgCopy(raw: ItgValue): string {
  return codeGiven(raw);
}

export function itgFamily(raw: ItgValue): string {
  if (itgState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function itgLanes(rows: readonly ItgRow[]): ItgLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of ITG_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = itgLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return ITG_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingItg(rows: readonly ItgRow[]): string {
  const lines = itgLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || ITG_LANES.indexOf(a.mail as (typeof ITG_LANES)[number]) - ITG_LANES.indexOf(b.mail as (typeof ITG_LANES)[number]))[0].mail;
}

export function leadingItgHue(rows: readonly ItgRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of ITG_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = itgHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = ITG_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || ITG_HUES.indexOf(a.hue) - ITG_HUES.indexOf(b.hue))[0].hue;
}

export function laneItgCount(rows: readonly ItgRow[], mail: ItgLane): number {
  return rows.filter((row) => itgLane(row.code) === mail).length;
}

export function itgShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentItgLanes(rows: readonly ItgRow[]): string[] {
  return itgLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenItg(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mail = snip(item, 12);
    if (!allow.has(mail) || out.includes(mail)) continue;
    out.push(mail);
  }
  return out;
}

export function readReviewedItg(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = snip(item, 40);
    if (!allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function toggleItg(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleItgReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkItgReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleItgLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: ItgRow, shape: ItgShape): boolean {
  if (shape === "all") return true;
  if (shape === "mark") return itgLine(row.code);
  if (shape === "shut") return itgShut(row.code);
  if (shape === "later") return itgLater(row.code);
  if (shape === "return") return itgReturn(row.code);
  if (shape === "pair") return itgPair(row.code);
  if (shape === "scope") return itgScope(row.code);
  if (shape === "brief") return itgBrief(row.code);
  if (shape === "span") return itgSpanLane(row.code);
  if (shape === "digit") return itgStampLane(row.code);
  if (shape === "openv") return itgVowelLane(row.code);
  if (shape === "bare") return itgBare(row.code);
  if (shape === "open") return itgOpen(row.code);
  if (shape === "soon") return itgSoon(row.code);
  if (shape === "letter") return itgLetter(row.code);
  if (shape === "mixed") return itgMixed(row.code);
  if (shape === "upper") return itgUpper(row.code);
  if (shape === "lower") return itgLower(row.code);
  if (shape === "space") return itgSpace(row.code);
  if (shape === "even") return itgEven(row.code);
  if (shape === "odd") return itgOdd(row.code);
  if (shape === "tail") return itgTail(row.code);
  if (shape === "first") return itgFirst(row.code);
  if (shape === "held") return itgHeld(row.code);
  return itgLane(row.code) === shape;
}

export function visibleItg(
  rows: readonly ItgRow[],
  mail: string,
  hue: string,
  query: string,
  review: ItgReview,
  reviewed: readonly string[],
  shape: ItgShape,
): ItgRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (itgState(row.code) === "") return false;
    const found = itgLane(row.code);
    const hueName = itgHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${itgStamp(row.code)} ${itgFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function itgLanesCsv(rows: readonly ItgRow[]): string {
  const lines = ["lane,count"];
  for (const line of itgLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function itgRowsCsv(rows: readonly ItgRow[], reviewed: readonly string[]): string {
  const lines = ["name,login,stamp,family,lane,hue,length,line,shut,later,desk,return,pair,scope,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(itgCopy(row.code)),
        itgStamp(row.code),
        csvCell(itgFamily(row.code)),
        itgLane(row.code),
        itgHue(row.code),
        itgLength(row.code) ?? "",
        itgLine(row.code) ? "1" : "0",
        itgShut(row.code) ? "1" : "0",
        itgLater(row.code) ? "1" : "0",
        itgDesk(row.code) ? "1" : "0",
        itgReturn(row.code) ? "1" : "0",
        itgPair(row.code) ? "1" : "0",
        itgScope(row.code) ? "1" : "0",
        itgBrief(row.code) ? "1" : "0",
        itgEven(row.code) ? "1" : "0",
        itgDigit(row.code) ? "1" : "0",
        itgMixed(row.code) ? "1" : "0",
        itgUpper(row.code) ? "1" : "0",
        itgVowel(row.code) ? "1" : "0",
        itgTail(row.code) ? "1" : "0",
        itgHeld(row.code) ? "1" : "0",
        itgSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
