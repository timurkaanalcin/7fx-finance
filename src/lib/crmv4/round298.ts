/**
 * Groma crosses for a survey kept in this browser, and zone plates read the timezone already stored on the account.
 * Arms are cardo, decumanus, bias, and skew. Finish is ivory, graphite, and champagne.
 * Spans are 4, 8, 12, or 16. Cords are 2, 4, or 6.
 * A mark zone has no slash. A spark city is four letters or shorter. A join contains an underscore.
 * A nest has two slashes. The house zone is Europe/Istanbul. Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_groma (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   rodman text not null default '',
 *   arm text not null default '',
 *   finish text not null default '',
 *   span_no integer,
 *   cord_no integer not null default 2,
 *   tags text not null default '',
 *   squared boolean not null default false,
 *   chested boolean not null default false,
 *   crypt boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_zone_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_zone_review (
 *   trader_id text primary key
 * );
 */

export const GRM_KEY = "crmv4-groma";
export const GRM_VIEW_KEY = "crmv4-groma-views";
export const GRM_DENSITY_KEY = "crmv4-groma-density";
export const GROMA_ARMS = ["cardo", "decumanus", "bias", "skew"] as const;

export type GromaArm = (typeof GROMA_ARMS)[number];

export type GromaFinish = "blank" | "ivory" | "graphite" | "champagne";

export type GromaTray = "yard" | "chest" | "crypt";

export type GromaDensity = "broad" | "tight";

export type GromaSort = "arm" | "rodman";

export type Groma = {
  id: string;
  title: string;
  note: string;
  rodman: string;
  arm: string;
  span: number | null;
  finish: string;
  cord: number;
  tags: string[];
  squared: boolean;
  chested: boolean;
  crypt: boolean;
  flagged: boolean;
  audit: string;
};

export type GromaView = {
  id: string;
  name: string;
  tray: GromaTray;
  query: string;
  rodman: string;
  finish: string;
  arm: string;
  span: string;
  cord: string;
};

export type GromaCounts = {
  yard: number;
  chest: number;
  crypt: number;
  squared: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  span: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND298_FEATURES = [
  "save",
  "note",
  "trays",
  "finish",
  "span",
  "crypt",
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
  "fair-rodman",
  "viewer",
  "suggest",
  "sla",
  "zone",
  "zone-csv",
] as const;

const AUDITS = ["save", "edit", "note", "finish", "square", "clear", "chest", "resume", "crypt", "open", "tag", "cord", "span", "lower", "star"] as const;

const FINISHES = ["ivory", "graphite", "champagne"] as const;

const SPAN_CYCLE = [4, 8, 12, 16] as const;

const CORD_CYCLE = [2, 4, 6] as const;

const INNER = new Set(["cardo", "decumanus"]);

const OUTER = new Set(["bias", "skew"]);

const HOUSE_FINISH = new Set(["GRAPHITE", "CHAMPAGNE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const HOUSE_ZONE = "europe/istanbul";

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): GromaTray {
  return raw === "chest" || raw === "crypt" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<GromaFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<GromaFinish, "blank">) : "";
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

function inTray(card: Groma, tray: GromaTray): boolean {
  if (tray === "chest") return card.chested && !card.crypt;
  if (tray === "crypt") return card.crypt;
  return !card.chested && !card.crypt;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function armIndex(arm: string): number {
  return GROMA_ARMS.indexOf(arm as GromaArm);
}

function spanIndex(span: number): number {
  return SPAN_CYCLE.indexOf(span as (typeof SPAN_CYCLE)[number]);
}

function cordIndex(cord: number): number {
  return CORD_CYCLE.indexOf(cord as (typeof CORD_CYCLE)[number]);
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

export function gromaArm(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (GROMA_ARMS as readonly string[]).includes(text) ? text : "";
}

/** A span is 4, 8, 12, or 16. Anything else stays blank. */
export function gromaSpan(raw: unknown): 4 | 8 | 12 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "16") return null;
  return Number(text) as 4 | 8 | 12 | 16;
}

/** A cord is 2, 4, or 6. Anything else stays blank. */
export function gromaCord(raw: unknown): 2 | 4 | 6 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "6") return null;
  return Number(text) as 2 | 4 | 6;
}

/** Finish is ivory, graphite, or champagne. The saved name is the upper token. */
export function gromaFinish(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function innerArm(arm: unknown): boolean {
  return INNER.has(clip(arm, 12).toLowerCase());
}

export function outerArm(arm: unknown): boolean {
  return OUTER.has(clip(arm, 12).toLowerCase());
}

/** Cardo is the meridian. Decumanus is the street. Bias is the slant. Skew is oblique. */
export function gromaBand(arm: unknown): string {
  const text = gromaArm(arm);
  if (!text) return "";
  if (text === "cardo") return "meridian";
  if (text === "decumanus") return "street";
  if (text === "bias") return "slant";
  return "oblique";
}

/** Signed distance from one arm to another in cross order. */
export function armGap(from: unknown, to: unknown): number | null {
  const left = armIndex(gromaArm(from));
  const right = armIndex(gromaArm(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE_FINISH.has(gromaFinish(finish));
}

/** A pair cord is 4. Two and six are not a pair. */
export function pairCord(cord: unknown): boolean {
  return gromaCord(cord) === 4;
}

/** A full cord is 6. */
export function fullCord(cord: unknown): boolean {
  return gromaCord(cord) === 6;
}

export function activeArm(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return gromaArm(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const span = gromaSpan(raw);
  return span === null ? "all" : String(span);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = gromaFinish(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeCord(raw: unknown): string {
  const cord = gromaCord(raw);
  return cord === null ? "all" : String(cord);
}

export function moveGromaFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The finish the yard uses least. A tie keeps ivory, then graphite, then champagne. */
export function suggestGromaFinish(cards: readonly Groma[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const finish of ["IVORY", "GRAPHITE", "CHAMPAGNE"]) {
    const count = counts.get(finish) || 0;
    if (count < score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest four. Morning asks for eight. Afternoon asks for twelve. Evening asks for sixteen. A missing span on the yard wins when any span is saved. */
export function suggestSpan(cards: readonly Groma[], hour: number): 4 | 8 | 12 | 16 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "yard") || card.span === null) continue;
    seen = true;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 12 | 16 = 4;
    let score = Number.POSITIVE_INFINITY;
    for (const span of SPAN_CYCLE) {
      const count = counts.get(span) || 0;
      if (count < score) {
        best = span;
        score = count;
      }
    }
    return best;
  }
  if (hour < 6) return 4;
  if (hour < 12) return 8;
  if (hour < 18) return 12;
  return 16;
}

/** Before ten, suggest the cardo. The rest of the day suggests the skew. */
export function suggestArm(hour: number): GromaArm {
  return hour < 10 ? "cardo" : "skew";
}

/** The rodman with the fewest unsquared crosses on the yard. A tie keeps the roster order. */
export function fairGromaRodman(cards: readonly Groma[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "yard") && !card.squared);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.rodman.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readGromas(raw: unknown): Groma[] {
  if (!Array.isArray(raw)) return [];
  const out: Groma[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Groma>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      rodman: clip(row.rodman, 24),
      arm: gromaArm(row.arm),
      span: gromaSpan(row.span),
      finish: gromaFinish(row.finish),
      cord: gromaCord(row.cord) ?? 2,
      tags: tagsOf(row.tags),
      squared: row.squared === true,
      chested: row.chested === true,
      crypt: row.crypt === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addGroma(
  cards: readonly Groma[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    rodman?: string;
    arm?: string;
    span?: unknown;
    finish?: string;
    cord?: unknown;
    tags?: unknown;
  },
): Groma[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readGromas([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      rodman: clip(card.rodman, 24),
      arm: gromaArm(card.arm),
      span: gromaSpan(card.span),
      finish: gromaFinish(card.finish),
      cord: gromaCord(card.cord) ?? 2,
      tags: tagsOf(card.tags),
      squared: false,
      chested: false,
      crypt: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Groma[], id: string, edit: (card: Groma) => Groma): Groma[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editGroma(cards: readonly Groma[], id: string, title: string): Groma[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editGromaNote(cards: readonly Groma[], id: string, note: string): Groma[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleFinish(finish: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(gromaFinish(finish));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setGromaFinish(cards: readonly Groma[], id: string, finish: string): Groma[] {
  const next = gromaFinish(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

export function setGromaSquared(cards: readonly Groma[], id: string, squared: boolean): Groma[] {
  return mapCard(cards, id, (card) => (card.squared === squared ? card : { ...card, squared, audit: squared ? "square" : "clear" }));
}

export function setGromaChest(cards: readonly Groma[], id: string, chested: boolean): Groma[] {
  return mapCard(cards, id, (card) => (card.chested === chested ? card : { ...card, chested, crypt: chested ? false : card.crypt, audit: chested ? "chest" : "resume" }));
}

export function setGromaCrypt(cards: readonly Groma[], id: string, crypt: boolean): Groma[] {
  return mapCard(cards, id, (card) => (card.crypt === crypt ? card : { ...card, crypt, chested: crypt ? false : card.chested, audit: crypt ? "crypt" : "open" }));
}

export function setGromaStar(cards: readonly Groma[], id: string, flagged: boolean): Groma[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addGromaTag(cards: readonly Groma[], id: string, tag: string): Groma[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpan(span: number | null, dir: 1 | -1): 4 | 8 | 12 | 16 {
  if (span === null) return dir > 0 ? 4 : 16;
  const index = spanIndex(span);
  const next = index < 0 ? 0 : (index + dir + SPAN_CYCLE.length) % SPAN_CYCLE.length;
  return SPAN_CYCLE[next];
}

function stepCord(cord: number, dir: 1 | -1): 2 | 4 | 6 {
  const index = cordIndex(cord);
  const next = index < 0 ? 0 : (index + dir + CORD_CYCLE.length) % CORD_CYCLE.length;
  return CORD_CYCLE[next];
}

export function liftSpan(cards: readonly Groma[], id: string): Groma[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, 1), audit: "span" }));
}

export function lowerSpan(cards: readonly Groma[], id: string): Groma[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, -1), audit: "lower" }));
}

export function raiseCord(cards: readonly Groma[], id: string): Groma[] {
  return mapCard(cards, id, (card) => ({ ...card, cord: stepCord(card.cord, 1), audit: "cord" }));
}

export function lowerCord(cards: readonly Groma[], id: string): Groma[] {
  return mapCard(cards, id, (card) => ({ ...card, cord: stepCord(card.cord, -1), audit: "cord" }));
}

export function squareGromaFocused(cards: readonly Groma[], id: string): Groma[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, squared: !card.squared, audit: card.squared ? "clear" : "square" })) : [...cards];
}

export function chestGromaFocused(cards: readonly Groma[], id: string): Groma[] {
  return setGromaChest(cards, id, !cards.find((card) => card.id === id)?.chested);
}

export function starGromaFocused(cards: readonly Groma[], id: string): Groma[] {
  return setGromaStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagGromaFocused(cards: readonly Groma[], id: string): Groma[] {
  return addGromaTag(cards, id, "a");
}

export function finishFocused(cards: readonly Groma[], id: string): Groma[] {
  const card = cards.find((item) => item.id === id);
  return card ? setGromaFinish(cards, id, cycleFinish(card.finish)) : [...cards];
}

export function liftSpanFocused(cards: readonly Groma[], id: string): Groma[] {
  return liftSpan(cards, id);
}

export function lowerSpanFocused(cards: readonly Groma[], id: string): Groma[] {
  return lowerSpan(cards, id);
}

export function raiseCordFocused(cards: readonly Groma[], id: string): Groma[] {
  return raiseCord(cards, id);
}

export function lowerCordFocused(cards: readonly Groma[], id: string): Groma[] {
  return lowerCord(cards, id);
}

function bulk(cards: readonly Groma[], ids: readonly string[], edit: (card: Groma) => Groma): Groma[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkGromaChampagne(cards: readonly Groma[], ids: readonly string[]): Groma[] {
  return bulk(cards, ids, (card) => (card.finish === "CHAMPAGNE" ? card : { ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkGromaSquare(cards: readonly Groma[], ids: readonly string[]): Groma[] {
  return bulk(cards, ids, (card) => (card.squared ? card : { ...card, squared: true, audit: "square" }));
}

export function bulkGromaCrypt(cards: readonly Groma[], ids: readonly string[]): Groma[] {
  return bulk(cards, ids, (card) => (card.crypt ? card : { ...card, crypt: true, chested: false, audit: "crypt" }));
}

export function bulkGromaTag(cards: readonly Groma[], ids: readonly string[]): Groma[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readGromaViews(raw: unknown): GromaView[] {
  if (!Array.isArray(raw)) return [];
  const out: GromaView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GromaView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      rodman: clip(row.rodman, 24),
      finish: activeFinish(row.finish, ["IVORY", "GRAPHITE", "CHAMPAGNE"]),
      arm: activeArm(row.arm),
      span: activeSpan(row.span),
      cord: activeCord(row.cord),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addGromaView(views: readonly GromaView[], view: GromaView): GromaView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readGromaViews([...views, { ...view, id, name }]);
}

export function dropGromaView(views: readonly GromaView[], id: string): GromaView[] {
  return views.filter((view) => view.id !== id);
}

export function gromaDensity(raw: unknown): GromaDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortGromas(cards: readonly Groma[], sort: GromaSort): Groma[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "rodman") {
      const rodman = a.rodman.localeCompare(b.rodman);
      if (rodman) return rodman;
    } else {
      const arm = armIndex(a.arm) - armIndex(b.arm);
      if (arm) return arm;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleGromas(
  cards: readonly Groma[],
  tray: GromaTray,
  query: string,
  rodman: string,
  finish: string,
  arm: string,
  span: string,
  cord: string,
): Groma[] {
  const text = query.trim().toLowerCase();
  const wantReader = clip(rodman, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : gromaFinish(finish);
  const wantArm = activeArm(arm);
  const wantSpan = activeSpan(span);
  const wantCord = activeCord(cord);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.rodman}`.toLowerCase().includes(text)) return false;
    if (wantReader && card.rodman.toLowerCase() !== wantReader) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantArm === "inner" && !innerArm(card.arm)) return false;
    if (wantArm === "outer" && !outerArm(card.arm)) return false;
    if (wantArm !== "all" && wantArm !== "inner" && wantArm !== "outer" && card.arm !== wantArm) return false;
    if (wantSpan !== "all" && String(card.span ?? "") !== wantSpan) return false;
    if (wantCord !== "all" && String(card.cord) !== wantCord) return false;
    return true;
  });
}

/** An outer arm on cord two, still unsquared and not in the crypt, is overdue. */
export function overdueGroma(card: Groma): boolean {
  return outerArm(card.arm) && card.cord === 2 && !card.squared && !card.crypt;
}

/** No finish, the short span, cord two, and still on the yard. */
export function idleGroma(card: Groma): boolean {
  return !card.finish && card.span === 4 && card.cord === 2 && !card.squared && !card.chested && !card.crypt;
}

/** Champagne, a wide span, and a full cord, still out of the crypt. */
export function briskGroma(card: Groma): boolean {
  return card.finish === "CHAMPAGNE" && card.span === 16 && card.cord === 6 && !card.crypt;
}

/** Skew, ivory, and a middle span. */
export function restingGroma(card: Groma): boolean {
  return card.arm === "skew" && card.finish === "IVORY" && card.span === 8;
}

/** A cardo cross is late when the desk is already on the skew. */
export function lateGroma(card: Groma, desk: string): boolean {
  return card.arm === "cardo" && gromaArm(desk) === "skew" && !card.squared;
}

export function gromaCounts(cards: readonly Groma[], shown: readonly Groma[], desk: string): GromaCounts {
  return {
    yard: cards.filter((card) => inTray(card, "yard")).length,
    chest: cards.filter((card) => inTray(card, "chest")).length,
    crypt: cards.filter((card) => inTray(card, "crypt")).length,
    squared: cards.filter((card) => card.squared).length,
    inner: cards.filter((card) => innerArm(card.arm)).length,
    outer: cards.filter((card) => outerArm(card.arm)).length,
    wide: cards.filter((card) => card.span === 16).length,
    house: cards.filter((card) => houseFinish(card.finish)).length,
    span: cards.reduce((sum, card) => sum + (card.span || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleGroma).length,
    brisk: cards.filter(briskGroma).length,
    resting: cards.filter(restingGroma).length,
    overdue: cards.filter(overdueGroma).length,
    pair: cards.filter((card) => pairCord(card.cord) && lateGroma(card, desk)).length,
  };
}

export function gromaBars(cards: readonly Groma[]): { arm: string; count: number }[] {
  return GROMA_ARMS.map((arm) => ({ arm, count: cards.filter((card) => card.arm === arm && !card.crypt).length }));
}

export function gromaTimeline(cards: readonly Groma[]): { span: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return SPAN_CYCLE.map((span) => ({ span, titles: open.filter((card) => card.span === span).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function gromaRodmen(cards: readonly Groma[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.rodman && !out.some((name) => name.toLowerCase() === card.rodman.toLowerCase())) out.push(card.rodman);
  }
  return out;
}

export function busiestGromaRodman(cards: readonly Groma[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.squared && card.rodman);
  let best = "";
  let score = 0;
  for (const name of gromaRodmen(open)) {
    const count = open.filter((card) => card.rodman.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderGromas(cards: readonly Groma[]): string[] {
  return cards.filter(overdueGroma).map((card) => card.title);
}

export function gromaCopy(card: Groma): string {
  return [card.title, card.rodman, card.arm, card.finish, card.span ?? "", card.cord, card.note].filter((item) => item !== "").join(" · ");
}

export function gromaCsv(cards: readonly Groma[], desk: string): string {
  const lines = ["title,rodman,arm,finish,span,cord,tags,squared,chest,crypt,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.rodman),
        card.arm,
        card.finish,
        card.span ?? "",
        card.cord,
        card.tags.join(" "),
        card.squared ? "1" : "0",
        card.chested ? "1" : "0",
        card.crypt ? "1" : "0",
        card.flagged ? "1" : "0",
        outerArm(card.arm) ? "1" : "0",
        lateGroma(card, desk) ? "1" : "0",
        idleGroma(card) ? "1" : "0",
        briskGroma(card) ? "1" : "0",
        restingGroma(card) ? "1" : "0",
        overdueGroma(card) ? "1" : "0",
        innerArm(card.arm) ? "1" : "0",
        houseFinish(card.finish) ? "1" : "0",
        gromaBand(card.arm),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const ZNP_KEY = "crmv4-zone-hide";
export const ZNP_REVIEW_KEY = "crmv4-zone-review";

export type ZoneLane = "" | "mark" | "spark" | "join" | "nest" | "house" | "post";

export type ZoneHue = "" | "ivory" | "graphite" | "champagne";

export type ZoneState = "" | "clear" | "set";

export type ZoneReview = "all" | "reviewed" | "fresh";

export type ZoneShape =
  | "all"
  | "mark"
  | "spark"
  | "join"
  | "nest"
  | "house"
  | "post"
  | "open"
  | "soon"
  | "letter"
  | "mixed"
  | "upper"
  | "lower"
  | "space"
  | "even"
  | "odd"
  | "vowel"
  | "tail"
  | "digit"
  | "first"
  | "held"
  | "slash";

export type ZoneValue = string | { timezone?: unknown; [key: string]: unknown } | null | undefined;

export type ZoneRow = { id: string; label: string; handle: ZoneValue };

export type ZoneLaneLine = { lane: string; count: number };

const ZONE_LANES = ["mark", "spark", "join", "nest", "house", "post"] as const;

const ZONE_HUES = ["champagne", "ivory", "graphite"] as const;

function zoneRecord(raw: ZoneValue): { timezone?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function zoneBlocked(raw: ZoneValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function zoneGiven(raw: ZoneValue): string {
  const row = zoneRecord(raw);
  if (row && !("timezone" in row)) return "";
  const value = row ? row.timezone : raw;
  return clip(value, 64);
}

function zoneReadable(raw: ZoneValue): boolean {
  if (zoneBlocked(raw)) return false;
  const row = zoneRecord(raw);
  if (row && !("timezone" in row)) return false;
  return true;
}

function zoneParts(raw: string): { region: string; city: string; depth: number } {
  const parts = raw.split("/").filter((part) => part.length > 0);
  if (parts.length <= 1 && !raw.includes("/")) return { region: "", city: raw, depth: 1 };
  return { region: parts[0] || "", city: parts[parts.length - 1] || "", depth: parts.length };
}

function cityPart(raw: ZoneValue): string {
  const text = zoneGiven(raw);
  return zoneParts(text).city;
}

export function zoneState(raw: ZoneValue): ZoneState {
  if (!zoneReadable(raw)) return "";
  return zoneGiven(raw) ? "set" : "clear";
}

/** A mark has no slash. A nest has two slashes. An underscore is a join. Europe/Istanbul is the house. A city of four letters or shorter is a spark. */
export function zoneLane(raw: ZoneValue): ZoneLane {
  if (zoneState(raw) !== "set") return "";
  const text = zoneGiven(raw);
  const parts = zoneParts(text);
  if (!text.includes("/")) return "mark";
  if (parts.depth >= 3) return "nest";
  if (parts.city.includes("_")) return "join";
  if (text.toLowerCase() === HOUSE_ZONE) return "house";
  if (parts.city.length > 0 && parts.city.length <= 4) return "spark";
  return "post";
}

export function zoneHue(raw: ZoneValue): ZoneHue {
  const lane = zoneLane(raw);
  if (!lane) return "";
  if (lane === "mark" || lane === "spark") return "champagne";
  if (lane === "join" || lane === "nest") return "graphite";
  return "ivory";
}

export function zoneMark(raw: ZoneValue): boolean {
  return zoneLane(raw) === "mark";
}

export function zoneSpark(raw: ZoneValue): boolean {
  return zoneLane(raw) === "spark";
}

export function zoneJoin(raw: ZoneValue): boolean {
  return zoneLane(raw) === "join";
}

export function zoneNest(raw: ZoneValue): boolean {
  return zoneLane(raw) === "nest";
}

export function zoneHouse(raw: ZoneValue): boolean {
  return zoneLane(raw) === "house";
}

export function zonePost(raw: ZoneValue): boolean {
  return zoneLane(raw) === "post";
}

export function zoneOpen(raw: ZoneValue): boolean {
  return zoneState(raw) === "clear";
}

/** A zone the desk can keep without a rewrite: house or post. */
export function zoneHeld(raw: ZoneValue): boolean {
  const lane = zoneLane(raw);
  return lane === "house" || lane === "post";
}

/** A mark, or a city of four letters or shorter, still wants a longer zone. */
export function zoneSoon(raw: ZoneValue): boolean {
  if (zoneState(raw) !== "set") return false;
  if (!zoneGiven(raw).includes("/")) return true;
  const length = cityPart(raw).length;
  return length > 0 && length <= 4;
}

export function zoneLength(raw: ZoneValue): number | null {
  if (zoneState(raw) !== "set") return null;
  return cityPart(raw).length;
}

export function zoneEven(raw: ZoneValue): boolean {
  const length = zoneLength(raw);
  return length !== null && length % 2 === 0;
}

export function zoneOdd(raw: ZoneValue): boolean {
  const length = zoneLength(raw);
  return length !== null && length % 2 === 1;
}

export function zoneFirst(raw: ZoneValue): boolean {
  return /^[A-Za-z]/.test(cityPart(raw));
}

export function zoneTail(raw: ZoneValue): boolean {
  return /[0-9]$/.test(cityPart(raw));
}

export function zoneCapital(raw: ZoneValue): boolean {
  return /[A-Z]/.test(zoneGiven(raw));
}

export function zoneSpace(raw: ZoneValue): boolean {
  return zoneGiven(raw).includes(" ");
}

export function zoneVowel(raw: ZoneValue): boolean {
  return /^[aeiou]/i.test(cityPart(raw));
}

export function zoneDigit(raw: ZoneValue): boolean {
  return /[0-9]/.test(zoneGiven(raw));
}

export function zoneLetter(raw: ZoneValue): boolean {
  return /[A-Za-z]/.test(zoneGiven(raw));
}

export function zoneMixed(raw: ZoneValue): boolean {
  return zoneDigit(raw) && zoneLetter(raw);
}

export function zoneLower(raw: ZoneValue): boolean {
  const text = zoneGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

export function zoneUpper(raw: ZoneValue): boolean {
  return zoneCapital(raw);
}

export function zoneSlash(raw: ZoneValue): boolean {
  return zoneGiven(raw).includes("/");
}

export function zoneStamp(raw: ZoneValue): string {
  const text = cityPart(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function zoneCopy(raw: ZoneValue): string {
  return zoneGiven(raw);
}

export function zoneRegion(raw: ZoneValue): string {
  if (zoneState(raw) !== "set") return "";
  return zoneParts(zoneGiven(raw)).region;
}

export function zoneLanes(rows: readonly ZoneRow[]): ZoneLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of ZONE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = zoneLane(row.handle);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return ZONE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingZone(rows: readonly ZoneRow[]): string {
  const lines = zoneLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || ZONE_LANES.indexOf(a.lane as (typeof ZONE_LANES)[number]) - ZONE_LANES.indexOf(b.lane as (typeof ZONE_LANES)[number]))[0].lane;
}

export function leadingZoneHue(rows: readonly ZoneRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of ZONE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = zoneHue(row.handle);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = ZONE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || ZONE_HUES.indexOf(a.hue) - ZONE_HUES.indexOf(b.hue))[0].hue;
}

export function laneZoneCount(rows: readonly ZoneRow[], lane: ZoneLane): number {
  return rows.filter((row) => zoneLane(row.handle) === lane).length;
}

export function zoneShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentZoneLanes(rows: readonly ZoneRow[]): string[] {
  return zoneLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenZone(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedZone(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleZone(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleZoneReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkZoneReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleZoneLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: ZoneRow, shape: ZoneShape): boolean {
  if (shape === "all") return true;
  if (shape === "mark") return zoneMark(row.handle);
  if (shape === "spark") return zoneSpark(row.handle);
  if (shape === "join") return zoneJoin(row.handle);
  if (shape === "nest") return zoneNest(row.handle);
  if (shape === "house") return zoneHouse(row.handle);
  if (shape === "post") return zonePost(row.handle);
  if (shape === "open") return zoneOpen(row.handle);
  if (shape === "soon") return zoneSoon(row.handle);
  if (shape === "digit") return zoneDigit(row.handle);
  if (shape === "letter") return zoneLetter(row.handle);
  if (shape === "mixed") return zoneMixed(row.handle);
  if (shape === "upper") return zoneUpper(row.handle);
  if (shape === "lower") return zoneLower(row.handle);
  if (shape === "space") return zoneSpace(row.handle);
  if (shape === "even") return zoneEven(row.handle);
  if (shape === "odd") return zoneOdd(row.handle);
  if (shape === "vowel") return zoneVowel(row.handle);
  if (shape === "tail") return zoneTail(row.handle);
  if (shape === "first") return zoneFirst(row.handle);
  if (shape === "held") return zoneHeld(row.handle);
  if (shape === "slash") return zoneSlash(row.handle);
  return zoneLane(row.handle) === shape;
}

export function visibleZone(
  rows: readonly ZoneRow[],
  lane: string,
  hue: string,
  query: string,
  review: ZoneReview,
  reviewed: readonly string[],
  shape: ZoneShape,
): ZoneRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (zoneState(row.handle) === "") return false;
    const found = zoneLane(row.handle);
    const hueName = zoneHue(row.handle);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${zoneGiven(row.handle)} ${zoneStamp(row.handle)} ${zoneRegion(row.handle)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function zoneLanesCsv(rows: readonly ZoneRow[]): string {
  const lines = ["lane,count"];
  for (const line of zoneLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function zoneRowsCsv(rows: readonly ZoneRow[], reviewed: readonly string[]): string {
  const lines = ["name,timezone,stamp,region,lane,hue,length,mark,spark,join,nest,house,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (zoneState(row.handle) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(zoneGiven(row.handle)),
        zoneStamp(row.handle),
        csvCell(zoneRegion(row.handle)),
        zoneLane(row.handle),
        zoneHue(row.handle),
        String(zoneLength(row.handle) ?? ""),
        zoneMark(row.handle) ? "1" : "0",
        zoneSpark(row.handle) ? "1" : "0",
        zoneJoin(row.handle) ? "1" : "0",
        zoneNest(row.handle) ? "1" : "0",
        zoneHouse(row.handle) ? "1" : "0",
        zoneEven(row.handle) ? "1" : "0",
        zoneDigit(row.handle) ? "1" : "0",
        zoneMixed(row.handle) ? "1" : "0",
        zoneUpper(row.handle) ? "1" : "0",
        zoneVowel(row.handle) ? "1" : "0",
        zoneTail(row.handle) ? "1" : "0",
        zoneHeld(row.handle) ? "1" : "0",
        zoneSoon(row.handle) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
