/**
 * Duplex rules for an escapement kept in this browser, and windrose plates read the desk already stored on the account.
 * Parts are locking, impulse, roller, and ruby. Inks are gilt, ivory, and graphite.
 * Drops are 2, 6, 9, or 12. Arcs are 3, 6, or 9.
 * A known desk is DAY, NIGHT, SWING, or FLOAT. A hyphen contains a hyphen. A split has a space.
 * A brief name is exactly three characters. A banner is sixteen characters or longer. A figure starts with a digit. A twin repeats a letter.
 * A true desk reads as DAY. A false desk reads as NO DESK.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_duplex (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   smith text not null default '',
 *   part text not null default '',
 *   drop_no integer,
 *   ink text not null default '',
 *   arc_no integer not null default 3,
 *   tags text not null default '',
 *   sprung boolean not null default false,
 *   cocked boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_windrose_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_windrose_review (
 *   trader_id text primary key
 * );
 */


export const DPX_KEY = "crmv4-duplex";
export const DPX_VIEW_KEY = "crmv4-duplex-views";
export const DPX_DENSITY_KEY = "crmv4-duplex-density";
export const DPX_PARTS = ["locking", "impulse", "roller", "ruby"] as const;

export type DuplexPart = (typeof DPX_PARTS)[number];
export type DuplexInk = "blank" | "gilt" | "ivory" | "graphite";
export type DuplexTray = "bench" | "cock" | "case";
export type DuplexDensity = "broad" | "tight";
export type DuplexSort = "part" | "smith";

export type Duplex = {
  id: string;
  title: string;
  note: string;
  smith: string;
  part: string;
  drop: number | null;
  ink: string;
  arc: number;
  tags: string[];
  sprung: boolean;
  cocked: boolean;
  cased: boolean;
  starred: boolean;
  audit: string;
};

export type DuplexView = {
  id: string;
  name: string;
  tray: DuplexTray;
  query: string;
  smith: string;
  ink: string;
  part: string;
  drop: string;
  arc: string;
};

export type DuplexCounts = {
  bench: number;
  cock: number;
  case: number;
  sprung: number;
  inner: number;
  outer: number;
  tall: number;
  quiet: number;
  drop: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND324_FEATURES = [
  "duplex-save",
  "notes",
  "locking-parts",
  "gilt-ink",
  "arc-sla",
  "case",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "smith-sort",
  "desk-kpis",
  "locking-chart",
  "drop-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-smith",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "desk-windrose",
  "windrose-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "set", "clear", "cock", "resume", "case", "open", "tag", "arc", "drop", "lower", "star"] as const;
const INKS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [2, 6, 9, 12] as const;
const ARC_CYCLE = [3, 6, 9] as const;
const INNER = new Set(["locking", "impulse"]);
const OUTER = new Set(["roller", "ruby"]);
const QUIET_INK = new Set(["IVORY", "GRAPHITE"]);
const DESK_CODES = new Set(["DAY", "NIGHT", "SWING", "FLOAT"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): DuplexTray {
  return raw === "cock" || raw === "case" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<DuplexInk, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<DuplexInk, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[dx]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Duplex, tray: DuplexTray): boolean {
  if (tray === "cock") return card.cocked && !card.cased;
  if (tray === "case") return card.cased;
  return !card.cocked && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function partIndex(part: string): number {
  return DPX_PARTS.indexOf(part as DuplexPart);
}

function dropIndex(drop: number): number {
  return DROP_CYCLE.indexOf(drop as (typeof DROP_CYCLE)[number]);
}

function arcIndex(arc: number): number {
  return ARC_CYCLE.indexOf(arc as (typeof ARC_CYCLE)[number]);
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

export function duplexPart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (DPX_PARTS as readonly string[]).includes(text) ? text : "";
}

/** A drop is 1, 4, 7, or 10. Anything else stays blank. */
export function duplexDrop(raw: unknown): 2 | 6 | 9 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "6" && text !== "9" && text !== "12") return null;
  return Number(text) as 2 | 6 | 9 | 12;
}

/** A arc is 4, 8, or 12. Anything else stays blank. */
export function duplexArc(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** An ink is gilt, ivory, or graphite. The saved name is the upper token. */
export function duplexInk(raw: unknown): string {
  const text = inkName(raw);
  return text ? text.toUpperCase() : "";
}

export function duplexInner(part: unknown): boolean {
  return INNER.has(clip(part, 12).toLowerCase());
}

export function duplexOuter(part: unknown): boolean {
  return OUTER.has(clip(part, 12).toLowerCase());
}

/** Locking is the gate. Impulse is the kick. Roller is the drum. Ruby is the stone. */
export function duplexBand(part: unknown): string {
  const text = duplexPart(part);
  if (!text) return "";
  if (text === "locking") return "gate";
  if (text === "impulse") return "kick";
  if (text === "roller") return "drum";
  return "stone";
}

/** Signed distance from one part to another along the duplex. */
export function duplexGap(from: unknown, to: unknown): number | null {
  const left = partIndex(duplexPart(from));
  const right = partIndex(duplexPart(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietInk(ink: unknown): boolean {
  return QUIET_INK.has(duplexInk(ink));
}

/** A pair arc is 8. Four and twelve are not a pair. */
export function pairArc(arc: unknown): boolean {
  return duplexArc(arc) === 6;
}

/** A full arc is 12. */
export function fullArc(arc: unknown): boolean {
  return duplexArc(arc) === 9;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return duplexPart(text) || "all";
}

export function activeDrop(raw: unknown): string {
  const drop = duplexDrop(raw);
  return drop === null ? "all" : String(drop);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = duplexInk(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeArc(raw: unknown): string {
  const arc = duplexArc(raw);
  return arc === null ? "all" : String(arc);
}

export function moveDuplexFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ink the bench uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestInk(cards: readonly Duplex[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.ink) continue;
    counts.set(card.ink, (counts.get(card.ink) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const ink of ["IVORY", "GILT", "GRAPHITE"]) {
    const count = counts.get(ink) || 0;
    if (count < score) {
      best = ink;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest one. Morning asks for four. Afternoon asks for seven. Evening asks for ten. A saved drop on the bench wins, and a tie keeps the shorter drop. */
export function suggestDrop(cards: readonly Duplex[], hour: number): 2 | 6 | 9 | 12 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 6 | 9 | 12 = 2;
    let score = Number.POSITIVE_INFINITY;
    for (const drop of DROP_CYCLE) {
      const count = counts.get(drop) || 0;
      if (count < score) {
        best = drop;
        score = count;
      }
    }
    return best;
  }
  if (hour < 5) return 2;
  if (hour < 11) return 6;
  if (hour < 17) return 9;
  return 12;
}

/** Before nine, suggest the locking. The rest of the day suggests the ruby. */
export function suggestPart(hour: number): DuplexPart {
  return hour < 10 ? "locking" : "ruby";
}

/** The smith with the fewest unsprung cards on the bench. A tie keeps the roster order. */
export function fairSmith(cards: readonly Duplex[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.sprung);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.smith.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readDuplexRules(raw: unknown): Duplex[] {
  if (!Array.isArray(raw)) return [];
  const out: Duplex[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Duplex>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      smith: clip(row.smith, 24),
      part: duplexPart(row.part),
      drop: duplexDrop(row.drop),
      ink: duplexInk(row.ink),
      arc: duplexArc(row.arc) ?? 3,
      tags: tagsOf(row.tags),
      sprung: row.sprung === true,
      cocked: row.cocked === true,
      cased: row.cased === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addDuplex(
  cards: readonly Duplex[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    smith?: string;
    part?: string;
    drop?: unknown;
    ink?: string;
    arc?: unknown;
    tags?: unknown;
  },
): Duplex[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `d${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readDuplexRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      smith: clip(card.smith, 24),
      part: duplexPart(card.part),
      drop: duplexDrop(card.drop),
      ink: duplexInk(card.ink),
      arc: duplexArc(card.arc) ?? 3,
      tags: tagsOf(card.tags),
      sprung: false,
      cocked: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Duplex[], id: string, edit: (card: Duplex) => Duplex): Duplex[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editDuplex(cards: readonly Duplex[], id: string, title: string): Duplex[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editDuplexNote(cards: readonly Duplex[], id: string, note: string): Duplex[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleInk(ink: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(duplexInk(ink));
  return order[(index + 1) % order.length] || "GILT";
}

export function setDuplexInk(cards: readonly Duplex[], id: string, ink: string): Duplex[] {
  const next = duplexInk(ink);
  return mapCard(cards, id, (card) => (card.ink === next ? card : { ...card, ink: next, audit: "ink" }));
}

export function setDuplexSpring(cards: readonly Duplex[], id: string, sprung: boolean): Duplex[] {
  return mapCard(cards, id, (card) => (card.sprung === sprung ? card : { ...card, sprung, audit: sprung ? "set" : "clear" }));
}

export function setDuplexCock(cards: readonly Duplex[], id: string, cocked: boolean): Duplex[] {
  return mapCard(cards, id, (card) => (card.cocked === cocked ? card : { ...card, cocked, cased: cocked ? false : card.cased, audit: cocked ? "cock" : "resume" }));
}

export function setDuplexCase(cards: readonly Duplex[], id: string, cased: boolean): Duplex[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, cocked: cased ? false : card.cocked, audit: cased ? "case" : "open" }));
}

export function setDuplexStar(cards: readonly Duplex[], id: string, starred: boolean): Duplex[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addDuplexTag(cards: readonly Duplex[], id: string, tag: string): Duplex[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 2 | 6 | 9 | 12 {
  if (drop === null) return dir > 0 ? 2 : 12;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepArc(arc: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = arcIndex(arc);
  const next = index < 0 ? 0 : (index + dir + ARC_CYCLE.length) % ARC_CYCLE.length;
  return ARC_CYCLE[next];
}

export function liftDrop(cards: readonly Duplex[], id: string): Duplex[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerDrop(cards: readonly Duplex[], id: string): Duplex[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseArc(cards: readonly Duplex[], id: string): Duplex[] {
  return mapCard(cards, id, (card) => ({ ...card, arc: stepArc(card.arc, 1), audit: "arc" }));
}

export function lowerArc(cards: readonly Duplex[], id: string): Duplex[] {
  return mapCard(cards, id, (card) => ({ ...card, arc: stepArc(card.arc, -1), audit: "arc" }));
}

export function setDuplexFocused(cards: readonly Duplex[], id: string): Duplex[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, sprung: !card.sprung, audit: card.sprung ? "clear" : "set" })) : [...cards];
}

export function cockDuplexFocused(cards: readonly Duplex[], id: string): Duplex[] {
  return setDuplexCock(cards, id, !cards.find((card) => card.id === id)?.cocked);
}

export function starDuplexFocused(cards: readonly Duplex[], id: string): Duplex[] {
  return setDuplexStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function inkFocused(cards: readonly Duplex[], id: string): Duplex[] {
  const card = cards.find((item) => item.id === id);
  return card ? setDuplexInk(cards, id, cycleInk(card.ink)) : [...cards];
}

export function liftDropFocused(cards: readonly Duplex[], id: string): Duplex[] {
  return liftDrop(cards, id);
}

export function lowerDropFocused(cards: readonly Duplex[], id: string): Duplex[] {
  return lowerDrop(cards, id);
}

export function raiseArcFocused(cards: readonly Duplex[], id: string): Duplex[] {
  return raiseArc(cards, id);
}

export function lowerArcFocused(cards: readonly Duplex[], id: string): Duplex[] {
  return lowerArc(cards, id);
}

function bulk(cards: readonly Duplex[], ids: readonly string[], edit: (card: Duplex) => Duplex): Duplex[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkDuplexGraphite(cards: readonly Duplex[], ids: readonly string[]): Duplex[] {
  return bulk(cards, ids, (card) => (card.ink === "GRAPHITE" ? card : { ...card, ink: "GRAPHITE", audit: "ink" }));
}

export function bulkDuplexSpring(cards: readonly Duplex[], ids: readonly string[]): Duplex[] {
  return bulk(cards, ids, (card) => (card.sprung ? card : { ...card, sprung: true, audit: "set" }));
}

export function bulkDuplexCase(cards: readonly Duplex[], ids: readonly string[]): Duplex[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, cocked: false, audit: "case" }));
}

export function bulkDuplexTag(cards: readonly Duplex[], ids: readonly string[]): Duplex[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "x"]), audit: "tag" }));
}

export function readDuplexViews(raw: unknown): DuplexView[] {
  if (!Array.isArray(raw)) return [];
  const out: DuplexView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DuplexView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      smith: clip(row.smith, 24),
      ink: activeInk(row.ink, ["GILT", "IVORY", "GRAPHITE"]),
      part: activePart(row.part),
      drop: activeDrop(row.drop),
      arc: activeArc(row.arc),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addDuplexView(views: readonly DuplexView[], view: DuplexView): DuplexView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readDuplexViews([...views, { ...view, id, name }]);
}

export function dropDuplexView(views: readonly DuplexView[], id: string): DuplexView[] {
  return views.filter((view) => view.id !== id);
}

export function duplexDensity(raw: unknown): DuplexDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortDuplexRules(cards: readonly Duplex[], sort: DuplexSort): Duplex[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "smith") {
      const smith = a.smith.localeCompare(b.smith);
      if (smith) return smith;
    } else {
      const part = partIndex(a.part) - partIndex(b.part);
      if (part) return part;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleDuplexRules(
  cards: readonly Duplex[],
  tray: DuplexTray,
  query: string,
  smith: string,
  ink: string,
  part: string,
  drop: string,
  arc: string,
): Duplex[] {
  const text = query.trim().toLowerCase();
  const wantSmith = clip(smith, 24).toLowerCase();
  const wantInk = ink === "all" ? "" : duplexInk(ink);
  const wantPart = activePart(part);
  const wantDrop = activeDrop(drop);
  const wantArc = activeArc(arc);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.smith}`.toLowerCase().includes(text)) return false;
    if (wantSmith && card.smith.toLowerCase() !== wantSmith) return false;
    if (wantInk && card.ink !== wantInk) return false;
    if (wantPart === "inner" && !duplexInner(card.part)) return false;
    if (wantPart === "outer" && !duplexOuter(card.part)) return false;
    if (wantPart !== "all" && wantPart !== "inner" && wantPart !== "outer" && card.part !== wantPart) return false;
    if (wantDrop !== "all" && String(card.drop ?? "") !== wantDrop) return false;
    if (wantArc !== "all" && String(card.arc) !== wantArc) return false;
    return true;
  });
}

/** An outer part on arc four, still unsprung and not in the case, is overdue. */
export function overdueDuplex(card: Duplex): boolean {
  return duplexOuter(card.part) && card.arc === 3 && !card.sprung && !card.cased;
}

/** No ink, the short drop, arc four, and still on the bench. */
export function idleDuplex(card: Duplex): boolean {
  return !card.ink && card.drop === 2 && card.arc === 3 && !card.sprung && !card.cocked && !card.cased;
}

/** Gilt, a tall drop, and a full arc, still out of the case. */
export function briskDuplex(card: Duplex): boolean {
  return card.ink === "GILT" && card.drop === 12 && card.arc === 9 && !card.cased;
}

/** Ruby, ivory, and drop four. */
export function restingDuplex(card: Duplex): boolean {
  return card.part === "ruby" && card.ink === "IVORY" && card.drop === 6;
}

/** A locking is late when the desk is already on the ruby. */
export function lateDuplex(card: Duplex, desk: string): boolean {
  return card.part === "locking" && duplexPart(desk) === "ruby" && !card.sprung;
}

export function duplexCounts(cards: readonly Duplex[], shown: readonly Duplex[], desk: string): DuplexCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    cock: cards.filter((card) => inTray(card, "cock")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    sprung: cards.filter((card) => card.sprung).length,
    inner: cards.filter((card) => duplexInner(card.part)).length,
    outer: cards.filter((card) => duplexOuter(card.part)).length,
    tall: cards.filter((card) => card.drop === 12).length,
    quiet: cards.filter((card) => quietInk(card.ink)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleDuplex).length,
    brisk: cards.filter(briskDuplex).length,
    resting: cards.filter(restingDuplex).length,
    overdue: cards.filter(overdueDuplex).length,
    pair: cards.filter((card) => pairArc(card.arc) && lateDuplex(card, desk)).length,
  };
}

export function duplexBars(cards: readonly Duplex[]): { part: string; count: number }[] {
  return DPX_PARTS.map((part) => ({ part, count: cards.filter((card) => card.part === part && !card.cased).length }));
}

export function duplexTimeline(cards: readonly Duplex[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function duplexSmiths(cards: readonly Duplex[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.smith && !out.some((name) => name.toLowerCase() === card.smith.toLowerCase())) out.push(card.smith);
  }
  return out;
}

export function busiestSmith(cards: readonly Duplex[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.sprung && card.smith);
  let best = "";
  let score = 0;
  for (const name of duplexSmiths(open)) {
    const count = open.filter((card) => card.smith.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderDuplexRules(cards: readonly Duplex[]): string[] {
  return cards.filter(overdueDuplex).map((card) => card.title);
}

export function duplexCopy(card: Duplex): string {
  return [card.title, card.smith, card.part, card.ink, card.drop ?? "", card.arc, card.note].filter((item) => item !== "").join(" · ");
}

export function duplexCsv(cards: readonly Duplex[], desk: string): string {
  const lines = ["title,smith,part,ink,drop,arc,tags,sprung,cock,case,starred,outer,late,idle,brisk,resting,overdue,inner,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.smith),
        card.part,
        card.ink,
        card.drop ?? "",
        card.arc,
        card.tags.join(" "),
        card.sprung ? "1" : "0",
        card.cocked ? "1" : "0",
        card.cased ? "1" : "0",
        card.starred ? "1" : "0",
        duplexOuter(card.part) ? "1" : "0",
        lateDuplex(card, desk) ? "1" : "0",
        idleDuplex(card) ? "1" : "0",
        briskDuplex(card) ? "1" : "0",
        restingDuplex(card) ? "1" : "0",
        overdueDuplex(card) ? "1" : "0",
        duplexInner(card.part) ? "1" : "0",
        quietInk(card.ink) ? "1" : "0",
        duplexBand(card.part),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const WRS_KEY = "crmv4-windrose-hide";
export const WRS_REVIEW_KEY = "crmv4-windrose-review";

export type WindroseLane = "" | "cardinal" | "hyphen" | "split" | "figure" | "brief" | "banner" | "twin" | "coast";
export type WindroseHue = "" | "ivory" | "graphite" | "champagne";
export type WindroseState = "" | "clear" | "set";
export type WindroseReview = "all" | "reviewed" | "fresh";
export type WindroseShape =
  | "all"
  | "cardinal"
  | "hyphen"
  | "split"
  | "figure"
  | "brief"
  | "banner"
  | "twin"
  | "coast"
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

export type WindroseValue = string | { desk?: unknown; [key: string]: unknown } | null | undefined;
export type WindroseRow = { id: string; label: string; code: WindroseValue };
export type WindroseLaneLine = { lane: string; count: number };

const CODE_LANES = ["cardinal", "hyphen", "split", "figure", "brief", "banner", "twin", "coast"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: WindroseValue): { desk?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: WindroseValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: WindroseValue): string {
  const row = codeRecord(raw);
  if (row && !("desk" in row)) return "";
  const value = row ? row.desk : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "DAY";
  if (value === false || value === "false" || value === "0" || value === 0) return "NO DESK";
  return clip(value, 48);
}

function codeReadable(raw: WindroseValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("desk" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function windroseState(raw: WindroseValue): WindroseState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known desk is DAY, NIGHT, SWING, or FLOAT. A hyphen contains a hyphen. A split has a space. A brief name is exactly three characters. A banner is sixteen characters or longer. A figure starts with a digit. A twin repeats a letter. */
export function windroseLane(raw: WindroseValue): WindroseLane {
  if (windroseState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (DESK_CODES.has(text.toUpperCase())) return "cardinal";
  if (text.includes("-")) return "hyphen";
  if (text.includes(" ")) return "split";
  if (text.length === 3) return "brief";
  if (text.length >= 16) return "banner";
  if (/^[0-9]/.test(text)) return "figure";
  if (/([A-Za-z])\1/.test(text)) return "twin";
  return "coast";
}

export function windroseHue(raw: WindroseValue): WindroseHue {
  const lane = windroseLane(raw);
  if (!lane) return "";
  if (lane === "cardinal" || lane === "figure") return "champagne";
  if (lane === "hyphen" || lane === "split") return "graphite";
  return "ivory";
}

export function windroseCardinal(raw: WindroseValue): boolean {
  return windroseLane(raw) === "cardinal";
}

export function windroseHyphen(raw: WindroseValue): boolean {
  return windroseLane(raw) === "hyphen";
}

export function windroseSplit(raw: WindroseValue): boolean {
  return windroseLane(raw) === "split";
}

export function windroseFigure(raw: WindroseValue): boolean {
  return windroseLane(raw) === "figure";
}

export function windroseBrief(raw: WindroseValue): boolean {
  return windroseLane(raw) === "brief";
}

export function windroseBanner(raw: WindroseValue): boolean {
  return windroseLane(raw) === "banner";
}

export function windroseTwin(raw: WindroseValue): boolean {
  return windroseLane(raw) === "twin";
}

export function windroseCoast(raw: WindroseValue): boolean {
  return windroseLane(raw) === "coast";
}

export function windroseOpen(raw: WindroseValue): boolean {
  return windroseState(raw) === "clear";
}

/** A banner or a twin name can stay as written. */
export function windroseHeld(raw: WindroseValue): boolean {
  const lane = windroseLane(raw);
  return lane === "banner" || lane === "twin";
}

/** A brief name, or a five-character name that is not a known desk, still wants a fuller name. */
export function windroseSoon(raw: WindroseValue): boolean {
  if (windroseState(raw) !== "set") return false;
  if (windroseBrief(raw)) return true;
  if (windroseCardinal(raw)) return false;
  return codeGiven(raw).length === 5;
}

export function windroseLength(raw: WindroseValue): number | null {
  if (windroseState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function windroseEven(raw: WindroseValue): boolean {
  const length = windroseLength(raw);
  return length !== null && length % 2 === 0;
}

export function windroseOdd(raw: WindroseValue): boolean {
  const length = windroseLength(raw);
  return length !== null && length % 2 === 1;
}

export function windroseFirst(raw: WindroseValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function windroseTail(raw: WindroseValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function windroseCapital(raw: WindroseValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function windroseSpace(raw: WindroseValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function windroseVowel(raw: WindroseValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function windroseDigit(raw: WindroseValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function windroseLetter(raw: WindroseValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function windroseMixed(raw: WindroseValue): boolean {
  return windroseDigit(raw) && windroseLetter(raw);
}

export function windroseLower(raw: WindroseValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is six letters or more, written entirely in capitals. */
export function windroseUpper(raw: WindroseValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function windroseStamp(raw: WindroseValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function windroseCopy(raw: WindroseValue): string {
  return codeGiven(raw);
}

export function windroseFamily(raw: WindroseValue): string {
  if (windroseState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function windroseLanes(rows: readonly WindroseRow[]): WindroseLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = windroseLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingWindrose(rows: readonly WindroseRow[]): string {
  const lines = windroseLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingWindroseHue(rows: readonly WindroseRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = windroseHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneWindroseCount(rows: readonly WindroseRow[], lane: WindroseLane): number {
  return rows.filter((row) => windroseLane(row.code) === lane).length;
}

export function windroseShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentWindroseLanes(rows: readonly WindroseRow[]): string[] {
  return windroseLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenWindrose(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedWindrose(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleWindrose(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleWindroseReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkWindroseReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleWindroseLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: WindroseRow, shape: WindroseShape): boolean {
  if (shape === "all") return true;
  if (shape === "cardinal") return windroseCardinal(row.code);
  if (shape === "hyphen") return windroseHyphen(row.code);
  if (shape === "split") return windroseSplit(row.code);
  if (shape === "figure") return windroseFigure(row.code);
  if (shape === "brief") return windroseBrief(row.code);
  if (shape === "banner") return windroseBanner(row.code);
  if (shape === "twin") return windroseTwin(row.code);
  if (shape === "coast") return windroseCoast(row.code);
  if (shape === "open") return windroseOpen(row.code);
  if (shape === "soon") return windroseSoon(row.code);
  if (shape === "letter") return windroseLetter(row.code);
  if (shape === "mixed") return windroseMixed(row.code);
  if (shape === "upper") return windroseUpper(row.code);
  if (shape === "lower") return windroseLower(row.code);
  if (shape === "space") return windroseSpace(row.code);
  if (shape === "even") return windroseEven(row.code);
  if (shape === "odd") return windroseOdd(row.code);
  if (shape === "tail") return windroseTail(row.code);
  if (shape === "first") return windroseFirst(row.code);
  if (shape === "held") return windroseHeld(row.code);
  return windroseLane(row.code) === shape;
}

export function visibleWindrose(
  rows: readonly WindroseRow[],
  lane: string,
  hue: string,
  query: string,
  review: WindroseReview,
  reviewed: readonly string[],
  shape: WindroseShape,
): WindroseRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (windroseState(row.code) === "") return false;
    const found = windroseLane(row.code);
    const hueName = windroseHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${windroseStamp(row.code)} ${windroseFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function windroseLanesCsv(rows: readonly WindroseRow[]): string {
  const lines = ["lane,count"];
  for (const line of windroseLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function windroseRowsCsv(rows: readonly WindroseRow[], reviewed: readonly string[]): string {
  const lines = ["name,desk,stamp,family,lane,hue,length,cardinal,hyphen,split,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(windroseCopy(row.code)),
        windroseStamp(row.code),
        csvCell(windroseFamily(row.code)),
        windroseLane(row.code),
        windroseHue(row.code),
        windroseLength(row.code) ?? "",
        windroseCardinal(row.code) ? "1" : "0",
        windroseHyphen(row.code) ? "1" : "0",
        windroseSplit(row.code) ? "1" : "0",
        windroseBrief(row.code) ? "1" : "0",
        windroseEven(row.code) ? "1" : "0",
        windroseDigit(row.code) ? "1" : "0",
        windroseMixed(row.code) ? "1" : "0",
        windroseUpper(row.code) ? "1" : "0",
        windroseVowel(row.code) ? "1" : "0",
        windroseTail(row.code) ? "1" : "0",
        windroseHeld(row.code) ? "1" : "0",
        windroseSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
