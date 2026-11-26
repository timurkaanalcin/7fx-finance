/**
 * Vignette frames kept in this browser,
 * and document marks read the document status already stored on the account.
 * Shifts are morning, afternoon, evening, and grave. Films are brass, paper, and soot.
 * Spans are 15, 30, 45, or 60 minutes. Layers are 2, 4, or 8.
 * Morning and afternoon are the warm half. Evening and grave are the cool half.
 * Ready, clear, filed, valid, live, open, approved, passed, and review are the court.
 * Ask, wait, hold, pend, and pending sit the bench.
 * Later, month, next, and defer wait. Reject, rejected, deny, denied, fail, failed, void, and voided are returned.
 * Twin and both are paired. None, nil, blank, empty, and missing stay bare.
 * A plus joins two marks. A colon that is not a time marks a scoped mark.
 * A time today is the court. Within two days is the bench. Within ten days waits. Older is returned.
 * A short mark is exactly four characters. A digit mark starts with a digit and is not a time.
 * A span mark is twelve characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * The words approve and review are the court when they are not a known title. Hidden, sealed, or private is shut.
 * A true mark reads as READY. A false mark reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved status.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_vignette_frame (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   framer text not null default '',
 *   shift text not null default '',
 *   sla_min integer,
 *   film text not null default '',
 *   layer integer not null default 2,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   clipped boolean not null default false,
 *   drawn boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_docmark_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_docmark_review (
 *   trader_id text primary key
 * );
 */

export const VGN_KEY = "crmv4-vignette-377";
export const VGN_VIEW_KEY = "crmv4-vignette-views-377";
export const VGN_DENSITY_KEY = "crmv4-vignette-density-377";
export const VGN_SHIFTS = ["morning", "afternoon", "evening", "grave"] as const;

export type FrameShift = (typeof VGN_SHIFTS)[number];
export type FrameFilm = "blank" | "brass" | "paper" | "soot";
export type FrameTray = "deck" | "clip" | "drawer";
export type FrameDensity = "open" | "tight";
export type FrameSort = "shift" | "framer";

export type Frame = {
  id: string;
  title: string;
  note: string;
  framer: string;
  shift: string;
  sla: number | null;
  film: string;
  layer: number;
  tags: string[];
  raised: boolean;
  clipped: boolean;
  drawn: boolean;
  starred: boolean;
  audit: string;
};

export type FrameView = {
  id: string;
  name: string;
  tray: FrameTray;
  query: string;
  framer: string;
  film: string;
  shift: string;
  sla: string;
  layer: string;
};

export type FrameCounts = {
  deck: number;
  clip: number;
  drawer: number;
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

export const ROUND377_FEATURES = [
  "vignette-save",
  "frame-reminders",
  "vignette-shifts",
  "vignette-search",
  "frame-span-sla",
  "frame-drawer",
  "vignette-star",
  "vignette-inline-title",
  "vignette-filters",
  "saved-vignette-views",
  "vignette-density",
  "frame-focus",
  "vignette-kpis",
  "frame-chart",
  "frame-timeline",
  "vignette-bulk",
  "vignette-csv",
  "vignette-keys",
  "vignette-audit",
  "least-open-framer",
  "vignette-viewer",
  "suggest-shift",
  "overdue-grave",
  "document-marks",
  "document-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "raise", "free", "pin", "return", "vault", "open", "tag", "bead", "sla", "lower", "star"] as const;
const FILMS = ["brass", "paper", "soot"] as const;
const SLA_CYCLE = [15, 30, 45, 60] as const;
const LAYER_CYCLE = [2, 4, 8] as const;
const WARM = new Set(["morning", "afternoon"]);
const COOL = new Set(["evening", "grave"]);
const QUIET_FILM = new Set(["SOOT"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): FrameTray {
  return raw === "clip" || raw === "drawer" ? raw : "deck";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<FrameFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<FrameFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ab]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Frame, tray: FrameTray): boolean {
  if (tray === "clip") return card.clipped && !card.drawn;
  if (tray === "drawer") return card.drawn;
  return !card.clipped && !card.drawn;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function shiftIndex(shift: string): number {
  return VGN_SHIFTS.indexOf(shift as FrameShift);
}

function slaIndex(sla: number): number {
  return SLA_CYCLE.indexOf(sla as (typeof SLA_CYCLE)[number]);
}

function layerIndex(layer: number): number {
  return LAYER_CYCLE.indexOf(layer as (typeof LAYER_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

function wholeToken(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function framePoint(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (VGN_SHIFTS as readonly string[]).includes(text) ? text : "";
}

/** A minute mark is 15, 30, 45, or 60. Anything else stays blank. */
export function frameSpan(raw: unknown): 15 | 30 | 45 | 60 | null {
  const text = wholeToken(raw);
  if (text !== "15" && text !== "30" && text !== "45" && text !== "60") return null;
  return Number(text) as 15 | 30 | 45 | 60;
}

/** A layer count is 2, 4, or 8. Anything else stays blank. */
export function frameLayer(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A film is brass, paper, or soot. The saved name is the upper token. */
export function frameFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function frameWarm(shift: unknown): boolean {
  return WARM.has(clip(shift, 12).toLowerCase());
}

export function frameCool(shift: unknown): boolean {
  return COOL.has(clip(shift, 12).toLowerCase());
}

/** Morning is first. Afternoon is second. Evening is third. Grave is fourth. */
export function frameBand(shift: unknown): string {
  const text = framePoint(shift);
  if (!text) return "";
  if (text === "morning") return "first";
  if (text === "afternoon") return "second";
  if (text === "evening") return "third";
  return "fourth";
}

/** Signed distance from one shift to another along the day. */
export function frameGap(from: unknown, to: unknown): number | null {
  const left = shiftIndex(framePoint(from));
  const right = shiftIndex(framePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function sootQuiet(film: unknown): boolean {
  return QUIET_FILM.has(frameFilm(film));
}

/** A pair layer is 4. Two and eight are not a pair. */
export function pairLayer(layer: unknown): boolean {
  return frameLayer(layer) === 4;
}

/** A full layer is 8. */
export function fullLayer(layer: unknown): boolean {
  return frameLayer(layer) === 8;
}

export function activeShift(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return framePoint(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const sla = frameSpan(raw);
  return sla === null ? "all" : String(sla);
}

export function activeFilm(raw: unknown, allow: readonly string[]): string {
  const text = frameFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeLayer(raw: unknown): string {
  const layer = frameLayer(raw);
  return layer === null ? "all" : String(layer);
}

export function moveFrameFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the deck uses least. A tie keeps paper, then brass, then soot. */
export function suggestFilm(cards: readonly Frame[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "deck") || !card.film) continue;
    counts.set(card.film, (counts.get(card.film) || 0) + 1);
  }
  let best = "PAPER";
  let score = Number.POSITIVE_INFINITY;
  for (const film of ["PAPER", "BRASS", "SOOT"]) {
    const count = counts.get(film) || 0;
    if (count < score) {
      best = film;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest fifteen. Before twelve, suggest thirty. Before eighteen, suggest forty-five. Later, suggest sixty. A saved minute on the deck wins, and a tie keeps the shorter minute. */
export function suggestSpan(cards: readonly Frame[], hour: number): 15 | 30 | 45 | 60 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "deck") || card.sla === null) continue;
    seen = true;
    counts.set(card.sla, (counts.get(card.sla) || 0) + 1);
  }
  if (seen) {
    let best: 15 | 30 | 45 | 60 = 15;
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
  if (hour < 6) return 15;
  if (hour < 12) return 30;
  if (hour < 18) return 45;
  return 60;
}

export function suggestShift(hour: number): FrameShift {
  if (hour < 6) return "morning";
  if (hour < 12) return "afternoon";
  if (hour < 18) return "evening";
  return "grave";
}

/** The framer with the fewest unraised frames on the deck. A tie keeps the roster order. */
export function fairFramer(cards: readonly Frame[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "deck") && !card.raised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.framer.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readFrames(raw: unknown): Frame[] {
  if (!Array.isArray(raw)) return [];
  const out: Frame[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Frame>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      framer: clip(row.framer, 24),
      shift: framePoint(row.shift),
      sla: frameSpan(row.sla),
      film: frameFilm(row.film),
      layer: frameLayer(row.layer) ?? 2,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      clipped: row.clipped === true,
      drawn: row.drawn === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addFrame(
  cards: readonly Frame[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    framer?: string;
    shift?: string;
    sla?: unknown;
    film?: string;
    layer?: unknown;
    tags?: unknown;
  },
): Frame[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `g${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readFrames([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      framer: clip(card.framer, 24),
      shift: framePoint(card.shift),
      sla: frameSpan(card.sla),
      film: frameFilm(card.film),
      layer: frameLayer(card.layer) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      clipped: false,
      drawn: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Frame[], id: string, edit: (card: Frame) => Frame): Frame[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editFrame(cards: readonly Frame[], id: string, title: string): Frame[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editFrameNote(cards: readonly Frame[], id: string, note: string): Frame[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "BRASS", "PAPER", "SOOT"];
  const index = order.indexOf(frameFilm(film));
  return order[(index + 1) % order.length] || "BRASS";
}

export function setFrameFilm(cards: readonly Frame[], id: string, film: string): Frame[] {
  const next = frameFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setFrameRaised(cards: readonly Frame[], id: string, raised: boolean): Frame[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setFrameClip(cards: readonly Frame[], id: string, clipped: boolean): Frame[] {
  return mapCard(cards, id, (card) => (card.clipped === clipped ? card : { ...card, clipped, drawn: clipped ? false : card.drawn, audit: clipped ? "pin" : "return" }));
}

export function setFrameDrawer(cards: readonly Frame[], id: string, drawn: boolean): Frame[] {
  return mapCard(cards, id, (card) => (card.drawn === drawn ? card : { ...card, drawn, clipped: drawn ? false : card.clipped, audit: drawn ? "vault" : "open" }));
}

export function setFrameStar(cards: readonly Frame[], id: string, starred: boolean): Frame[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addFrameTag(cards: readonly Frame[], id: string, tag: string): Frame[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpan(sla: number | null, dir: 1 | -1): 15 | 30 | 45 | 60 {
  if (sla === null) return dir > 0 ? 15 : 60;
  const index = slaIndex(sla);
  const next = index < 0 ? 0 : (index + dir + SLA_CYCLE.length) % SLA_CYCLE.length;
  return SLA_CYCLE[next];
}

function stepLayer(layer: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = layerIndex(layer);
  const next = index < 0 ? 0 : (index + dir + LAYER_CYCLE.length) % LAYER_CYCLE.length;
  return LAYER_CYCLE[next];
}

export function raiseSpanFocused(cards: readonly Frame[], id: string): Frame[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSpan(card.sla, 1), audit: "sla" }));
}

export function lowerSpanFocused(cards: readonly Frame[], id: string): Frame[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSpan(card.sla, -1), audit: "lower" }));
}

export function raiseLayerFocused(cards: readonly Frame[], id: string): Frame[] {
  return mapCard(cards, id, (card) => ({ ...card, layer: stepLayer(card.layer, 1), audit: "bead" }));
}

export function lowerLayerFocused(cards: readonly Frame[], id: string): Frame[] {
  return mapCard(cards, id, (card) => ({ ...card, layer: stepLayer(card.layer, -1), audit: "bead" }));
}

export function setFrameFocused(cards: readonly Frame[], id: string): Frame[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function clipFrameFocused(cards: readonly Frame[], id: string): Frame[] {
  return setFrameClip(cards, id, !cards.find((card) => card.id === id)?.clipped);
}

export function starFrameFocused(cards: readonly Frame[], id: string): Frame[] {
  return setFrameStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly Frame[], id: string): Frame[] {
  const card = cards.find((item) => item.id === id);
  return card ? setFrameFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Frame[], ids: readonly string[], edit: (card: Frame) => Frame): Frame[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkFrameSoot(cards: readonly Frame[], ids: readonly string[]): Frame[] {
  return bulk(cards, ids, (card) => (card.film === "SOOT" ? card : { ...card, film: "SOOT", audit: "film" }));
}

export function bulkFrameRaise(cards: readonly Frame[], ids: readonly string[]): Frame[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkFrameDrawer(cards: readonly Frame[], ids: readonly string[]): Frame[] {
  return bulk(cards, ids, (card) => (card.drawn ? card : { ...card, drawn: true, clipped: false, audit: "vault" }));
}

export function bulkFrameTag(cards: readonly Frame[], ids: readonly string[]): Frame[] {
  return bulk(cards, ids, (card) => (card.tags.includes("a") ? card : { ...card, tags: tagsOf([...card.tags, "a"]), audit: "tag" }));
}

export function readFrameViews(raw: unknown): FrameView[] {
  if (!Array.isArray(raw)) return [];
  const out: FrameView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FrameView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      framer: clip(row.framer, 24),
      film: activeFilm(row.film, ["BRASS", "PAPER", "SOOT"]),
      shift: activeShift(row.shift),
      sla: activeSpan(row.sla),
      layer: activeLayer(row.layer),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addFrameView(views: readonly FrameView[], view: FrameView): FrameView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readFrameViews([...views, { ...view, id, name }]);
}

export function dropFrameView(views: readonly FrameView[], id: string): FrameView[] {
  return views.filter((view) => view.id !== id);
}

export function frameDensity(raw: unknown): FrameDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortFrames(cards: readonly Frame[], sort: FrameSort): Frame[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "framer") {
      const framer = a.framer.localeCompare(b.framer);
      if (framer) return framer;
    } else {
      const shift = shiftIndex(a.shift) - shiftIndex(b.shift);
      if (shift) return shift;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleFrames(
  cards: readonly Frame[],
  tray: FrameTray,
  query: string,
  framer: string,
  film: string,
  shift: string,
  sla: string,
  layer: string,
): Frame[] {
  const text = query.trim().toLowerCase();
  const wantFramer = clip(framer, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : frameFilm(film);
  const wantShift = activeShift(shift);
  const wantSla = activeSpan(sla);
  const wantLayer = activeLayer(layer);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.framer}`.toLowerCase().includes(text)) return false;
    if (wantFramer && card.framer.toLowerCase() !== wantFramer) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantShift === "warm" && !frameWarm(card.shift)) return false;
    if (wantShift === "cool" && !frameCool(card.shift)) return false;
    if (wantShift !== "all" && wantShift !== "warm" && wantShift !== "cool" && card.shift !== wantShift) return false;
    if (wantSla !== "all" && String(card.sla ?? "") !== wantSla) return false;
    if (wantLayer !== "all" && String(card.layer) !== wantLayer) return false;
    return true;
  });
}

/** Grave on layer two, still not raised and not in the drawer, is overdue. */
export function overdueFrame(card: Frame): boolean {
  return card.shift === "grave" && card.layer === 2 && !card.raised && !card.drawn;
}

/** No film, fifteen minutes, layer two, and still on the deck. */
export function idleFrame(card: Frame): boolean {
  return !card.film && card.sla === 15 && card.layer === 2 && !card.raised && !card.clipped && !card.drawn;
}

/** Brass, sixty minutes, and a full layer, still out of the drawer. */
export function briskFrame(card: Frame): boolean {
  return card.film === "BRASS" && card.sla === 60 && card.layer === 8 && !card.drawn;
}

/** Grave, paper, and thirty minutes. */
export function restingFrame(card: Frame): boolean {
  return card.shift === "grave" && card.film === "PAPER" && card.sla === 30;
}

/** A morning frame is late when the station is already grave. */
export function lateFrame(card: Frame, station: string): boolean {
  return card.shift === "morning" && framePoint(station) === "grave" && !card.raised;
}

export function frameCounts(cards: readonly Frame[], shown: readonly Frame[], station: string): FrameCounts {
  return {
    deck: cards.filter((card) => inTray(card, "deck")).length,
    clip: cards.filter((card) => inTray(card, "clip")).length,
    drawer: cards.filter((card) => inTray(card, "drawer")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => frameWarm(card.shift)).length,
    cool: cards.filter((card) => frameCool(card.shift)).length,
    long: cards.filter((card) => card.sla === 60).length,
    quiet: cards.filter((card) => sootQuiet(card.film)).length,
    minutes: cards.reduce((sum, card) => sum + (card.sla || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleFrame).length,
    brisk: cards.filter(briskFrame).length,
    resting: cards.filter(restingFrame).length,
    overdue: cards.filter(overdueFrame).length,
    pair: cards.filter((card) => pairLayer(card.layer) && lateFrame(card, station)).length,
  };
}

export function frameBars(cards: readonly Frame[]): { shift: string; count: number }[] {
  return VGN_SHIFTS.map((shift) => ({ shift, count: cards.filter((card) => card.shift === shift && !card.drawn).length }));
}

export function frameTimeline(cards: readonly Frame[]): { sla: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return SLA_CYCLE.map((sla) => ({ sla, titles: open.filter((card) => card.sla === sla).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function frameFramers(cards: readonly Frame[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.framer && !out.some((name) => name.toLowerCase() === card.framer.toLowerCase())) out.push(card.framer);
  }
  return out;
}

export function busiestFramer(cards: readonly Frame[]): string {
  const open = cards.filter((card) => inTray(card, "deck") && !card.raised && card.framer);
  let best = "";
  let score = 0;
  for (const name of frameFramers(open)) {
    const count = open.filter((card) => card.framer.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderFrames(cards: readonly Frame[]): string[] {
  return cards.filter(overdueFrame).map((card) => card.title);
}

export function frameCopy(card: Frame): string {
  return [card.title, card.framer, card.shift, card.film, card.sla ?? "", card.layer, card.note].filter((item) => item !== "").join(" · ");
}

export function frameCsv(cards: readonly Frame[], station: string): string {
  const lines = ["title,framer,shift,film,minutes,layer,tags,raised,clip,drawer,starred,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.framer),
        card.shift,
        card.film,
        card.sla ?? "",
        card.layer,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.clipped ? "1" : "0",
        card.drawn ? "1" : "0",
        card.starred ? "1" : "0",
        frameCool(card.shift) ? "1" : "0",
        lateFrame(card, station) ? "1" : "0",
        idleFrame(card) ? "1" : "0",
        briskFrame(card) ? "1" : "0",
        restingFrame(card) ? "1" : "0",
        overdueFrame(card) ? "1" : "0",
        frameWarm(card.shift) ? "1" : "0",
        sootQuiet(card.film) ? "1" : "0",
        frameBand(card.shift),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const DMK_HIDE_KEY = "crmv4-docmark-hide-377";
export const DMK_REVIEW_KEY = "crmv4-docmark-review-377";

export type DmkLane = "" | "court" | "shut" | "wait" | "bench" | "return" | "pair" | "scope" | "short" | "span" | "digit" | "openv" | "bare";
export type DmkHue = "" | "ivory" | "graphite" | "champagne";
export type DmkState = "" | "clear" | "set";
export type DmkReview = "all" | "reviewed" | "fresh";
export type DmkShape =
  | "all"
  | "court"
  | "shut"
  | "wait"
  | "return"
  | "pair"
  | "scope"
  | "short"
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

export type DmkValue = string | { documentsStatus?: unknown; [key: string]: unknown } | null | undefined;
export type DmkRow = { id: string; label: string; code: DmkValue; userId?: string };
export type DmkLaneLine = { mail: string; count: number };

const VOID_LANES = ["court", "shut", "wait", "bench", "return", "pair", "scope", "short", "span", "digit", "openv", "bare"] as const;
const VOID_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: DmkValue): { documentsStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: DmkValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: DmkValue): string {
  const row = codeRecord(raw);
  if (row && !("documentsStatus" in row)) return "";
  const value = row ? row.documentsStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "READY";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: DmkValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("documentsStatus" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function dmkState(raw: DmkValue): DmkState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["READY", "CLEAR", "FILED", "VALID", "LIVE", "OPEN", "APPROVED", "PASSED", "REVIEW"]);
const BENCH_TITLES = new Set(["ASK", "WAIT", "HOLD", "PEND", "PENDING"]);
const WAIT_TITLES = new Set(["LATER", "MONTH", "NEXT", "DEFER"]);
const RETURN_TITLES = new Set(["REJECT", "REJECTED", "DENY", "DENIED", "FAIL", "FAILED", "VOID", "VOIDED"]);
const PAIR_TITLES = new Set(["TWIN", "BOTH"]);
const BARE_TITLES = new Set(["NONE", "NIL", "BLANK", "EMPTY", "MISSING"]);

/** A known status maps first. A plus joins two marks. A colon that is not a time marks a scoped mark. A time today is the court. Within two days is the bench. Within ten days waits. Older is returned. Hidden, sealed, or private is shut. A short mark is exactly four characters. A digit mark starts with a digit and is not a time. A span mark is twelve characters or longer. A vowel mark starts with a vowel. The words approve and review are the court. */
export function dmkLane(raw: DmkValue, now = Date.now()): DmkLane {
  if (dmkState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "court";
  if (BENCH_TITLES.has(upper)) return "bench";
  if (WAIT_TITLES.has(upper)) return "wait";
  if (RETURN_TITLES.has(upper)) return "return";
  if (PAIR_TITLES.has(upper)) return "pair";
  if (BARE_TITLES.has(upper)) return "bare";
  if (/hidden|sealed|private/i.test(text)) return "shut";
  if (text.includes("+")) return "pair";
  const at = Date.parse(text);
  if (!Number.isNaN(at)) {
    if (at > now) return "court";
    const day = 86400000;
    const left = new Date(at);
    const right = new Date(now);
    const sameDay = left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
    if (sameDay) return "court";
    const age = now - at;
    if (age < 2 * day) return "bench";
    if (age < 10 * day) return "wait";
    return "return";
  }
  if (text.includes(":")) return "scope";
  if (/^[0-9]/.test(text)) return "digit";
  if (text.length === 4) return "short";
  if (/\bapprove\b|\breview\b/i.test(text)) return "court";
  if (text.length >= 12) return "span";
  if (/^[aeiou]/i.test(text)) return "openv";
  return "bare";
}

export function dmkHue(raw: DmkValue, now = Date.now()): DmkHue {
  const mail = dmkLane(raw, now);
  if (!mail) return "";
  if (mail === "court" || mail === "pair") return "champagne";
  if (mail === "bench" || mail === "return" || mail === "scope" || mail === "span") return "graphite";
  return "ivory";
}

export function dmkCourt(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "court";
}

export function dmkShut(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "shut";
}

export function dmkWait(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "wait";
}

export function dmkReturn(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "return";
}

export function dmkBench(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "bench";
}

export function dmkPair(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "pair";
}

export function dmkScope(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "scope";
}

export function dmkShort(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "short";
}

export function dmkSpan(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "span";
}

export function dmkStampLane(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "digit";
}

export function dmkVowelLane(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "openv";
}

export function dmkBare(raw: DmkValue, now = Date.now()): boolean {
  return dmkLane(raw, now) === "bare";
}

export function dmkOpen(raw: DmkValue): boolean {
  return dmkState(raw) === "clear";
}

/** A long caption or a digit caption can stay as written. */
export function dmkHeld(raw: DmkValue): boolean {
  const mail = dmkLane(raw);
  return mail === "span" || mail === "digit";
}

/** A brief caption, or a six-character caption that is not a known title, still wants a fuller name. */
export function dmkSoon(raw: DmkValue, now = Date.now()): boolean {
  if (dmkState(raw) !== "set") return false;
  if (dmkShort(raw, now)) return true;
  if (dmkCourt(raw, now) || dmkShut(raw, now) || dmkWait(raw, now) || dmkReturn(raw, now)) return false;
  return codeGiven(raw).length === 6;
}

export function dmkLength(raw: DmkValue): number | null {
  if (dmkState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function dmkEven(raw: DmkValue): boolean {
  const length = dmkLength(raw);
  return length !== null && length % 2 === 0;
}

export function dmkOdd(raw: DmkValue): boolean {
  const length = dmkLength(raw);
  return length !== null && length % 2 === 1;
}

export function dmkFirst(raw: DmkValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function dmkTail(raw: DmkValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function dmkSpace(raw: DmkValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function dmkVowel(raw: DmkValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function dmkDigit(raw: DmkValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function dmkLetter(raw: DmkValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function dmkMixed(raw: DmkValue): boolean {
  return dmkDigit(raw) && dmkLetter(raw);
}

export function dmkLower(raw: DmkValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital caption is four letters or more, written entirely in capitals. */
export function dmkUpper(raw: DmkValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function dmkStamp(raw: DmkValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function dmkCopy(raw: DmkValue): string {
  return codeGiven(raw);
}

export function dmkFamily(raw: DmkValue): string {
  if (dmkState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function dmkLanes(rows: readonly DmkRow[]): DmkLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of VOID_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = dmkLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return VOID_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingDmk(rows: readonly DmkRow[]): string {
  const lines = dmkLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || VOID_LANES.indexOf(a.mail as (typeof VOID_LANES)[number]) - VOID_LANES.indexOf(b.mail as (typeof VOID_LANES)[number]))[0].mail;
}

export function leadingDmkHue(rows: readonly DmkRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of VOID_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = dmkHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = VOID_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || VOID_HUES.indexOf(a.hue) - VOID_HUES.indexOf(b.hue))[0].hue;
}

export function laneDmkCount(rows: readonly DmkRow[], mail: DmkLane): number {
  return rows.filter((row) => dmkLane(row.code) === mail).length;
}

export function dmkShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentDmkLanes(rows: readonly DmkRow[]): string[] {
  return dmkLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenDmk(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mail = clip(item, 12);
    if (!allow.has(mail) || out.includes(mail)) continue;
    out.push(mail);
  }
  return out;
}

export function readReviewedDmk(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleDmk(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleDmkReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkDmkReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleDmkLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: DmkRow, shape: DmkShape): boolean {
  if (shape === "all") return true;
  if (shape === "court") return dmkCourt(row.code);
  if (shape === "shut") return dmkShut(row.code);
  if (shape === "wait") return dmkWait(row.code);
  if (shape === "return") return dmkReturn(row.code);
  if (shape === "pair") return dmkPair(row.code);
  if (shape === "scope") return dmkScope(row.code);
  if (shape === "short") return dmkShort(row.code);
  if (shape === "span") return dmkSpan(row.code);
  if (shape === "digit") return dmkStampLane(row.code);
  if (shape === "openv") return dmkVowelLane(row.code);
  if (shape === "bare") return dmkBare(row.code);
  if (shape === "open") return dmkOpen(row.code);
  if (shape === "soon") return dmkSoon(row.code);
  if (shape === "letter") return dmkLetter(row.code);
  if (shape === "mixed") return dmkMixed(row.code);
  if (shape === "upper") return dmkUpper(row.code);
  if (shape === "lower") return dmkLower(row.code);
  if (shape === "space") return dmkSpace(row.code);
  if (shape === "even") return dmkEven(row.code);
  if (shape === "odd") return dmkOdd(row.code);
  if (shape === "tail") return dmkTail(row.code);
  if (shape === "first") return dmkFirst(row.code);
  if (shape === "held") return dmkHeld(row.code);
  return dmkLane(row.code) === shape;
}

export function visibleDmk(
  rows: readonly DmkRow[],
  mail: string,
  hue: string,
  query: string,
  review: DmkReview,
  reviewed: readonly string[],
  shape: DmkShape,
): DmkRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (dmkState(row.code) === "") return false;
    const found = dmkLane(row.code);
    const hueName = dmkHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${dmkStamp(row.code)} ${dmkFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function dmkLanesCsv(rows: readonly DmkRow[]): string {
  const lines = ["lane,count"];
  for (const line of dmkLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function dmkRowsCsv(rows: readonly DmkRow[], reviewed: readonly string[]): string {
  const lines = ["name,documentsStatus,stamp,family,lane,hue,length,court,shut,wait,bench,return,pair,scope,short,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(dmkCopy(row.code)),
        dmkStamp(row.code),
        csvCell(dmkFamily(row.code)),
        dmkLane(row.code),
        dmkHue(row.code),
        dmkLength(row.code) ?? "",
        dmkCourt(row.code) ? "1" : "0",
        dmkShut(row.code) ? "1" : "0",
        dmkWait(row.code) ? "1" : "0",
        dmkBench(row.code) ? "1" : "0",
        dmkReturn(row.code) ? "1" : "0",
        dmkPair(row.code) ? "1" : "0",
        dmkScope(row.code) ? "1" : "0",
        dmkShort(row.code) ? "1" : "0",
        dmkEven(row.code) ? "1" : "0",
        dmkDigit(row.code) ? "1" : "0",
        dmkMixed(row.code) ? "1" : "0",
        dmkUpper(row.code) ? "1" : "0",
        dmkVowel(row.code) ? "1" : "0",
        dmkTail(row.code) ? "1" : "0",
        dmkHeld(row.code) ? "1" : "0",
        dmkSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
