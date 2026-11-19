/**
 * Graphometer arcs for a sight book kept in this browser, and system plates read the operating system already stored on the account.
 * Faces are face, back, edge, and rim. Finish is ivory, graphite, and champagne.
 * Pitches are 5, 10, 20, or 40. Limbs are 1, 3, or 5.
 * A seed has no space and no digit. A spark starts with three letters or fewer. A pair has a space and a digit.
 * A stack contains a slash. The house systems are macOS, Windows, and Linux. Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_graphometer (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   surveyor text not null default '',
 *   face text not null default '',
 *   finish text not null default '',
 *   pitch_no integer,
 *   limb_no integer not null default 1,
 *   tags text not null default '',
 *   aligned boolean not null default false,
 *   cased boolean not null default false,
 *   vaulted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_os_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_os_review (
 *   trader_id text primary key
 * );
 */

export const GPH_KEY = "crmv4-graphometer";
export const GPH_VIEW_KEY = "crmv4-graphometer-views";
export const GPH_DENSITY_KEY = "crmv4-graphometer-density";
export const GRAPH_FACES = ["face", "back", "edge", "rim"] as const;

export type GraphFace = (typeof GRAPH_FACES)[number];

export type GraphFinish = "blank" | "ivory" | "graphite" | "champagne";

export type GraphTray = "bench" | "case" | "vault";

export type GraphDensity = "broad" | "tight";

export type GraphSort = "face" | "surveyor";

export type Graphometer = {
  id: string;
  title: string;
  note: string;
  surveyor: string;
  face: string;
  pitch: number | null;
  finish: string;
  limb: number;
  tags: string[];
  aligned: boolean;
  cased: boolean;
  vaulted: boolean;
  flagged: boolean;
  audit: string;
};

export type GraphView = {
  id: string;
  name: string;
  tray: GraphTray;
  query: string;
  surveyor: string;
  finish: string;
  face: string;
  pitch: string;
  limb: string;
};

export type GraphCounts = {
  bench: number;
  case: number;
  vault: number;
  aligned: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  pitch: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND299_FEATURES = [
  "save",
  "note",
  "trays",
  "finish",
  "pitch",
  "vault",
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
  "fair-surveyor",
  "viewer",
  "suggest",
  "sla",
  "system",
  "system-csv",
] as const;

const AUDITS = ["save", "edit", "note", "finish", "align", "clear", "case", "resume", "vault", "open", "tag", "limb", "pitch", "lower", "star"] as const;

const FINISHES = ["ivory", "graphite", "champagne"] as const;

const PITCH_CYCLE = [5, 10, 20, 40] as const;

const LIMB_CYCLE = [1, 3, 5] as const;

const INNER = new Set(["face", "back"]);

const OUTER = new Set(["edge", "rim"]);

const HOUSE_FINISH = new Set(["IVORY", "CHAMPAGNE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const HOUSE_OS = new Set(["macos", "windows", "linux"]);

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): GraphTray {
  return raw === "case" || raw === "vault" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<GraphFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<GraphFinish, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ns]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Graphometer, tray: GraphTray): boolean {
  if (tray === "case") return card.cased && !card.vaulted;
  if (tray === "vault") return card.vaulted;
  return !card.cased && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function faceIndex(face: string): number {
  return GRAPH_FACES.indexOf(face as GraphFace);
}

function pitchIndex(pitch: number): number {
  return PITCH_CYCLE.indexOf(pitch as (typeof PITCH_CYCLE)[number]);
}

function limbIndex(limb: number): number {
  return LIMB_CYCLE.indexOf(limb as (typeof LIMB_CYCLE)[number]);
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

export function graphFace(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (GRAPH_FACES as readonly string[]).includes(text) ? text : "";
}

/** A pitch is 5, 10, 20, or 40. Anything else stays blank. */
export function graphPitch(raw: unknown): 5 | 10 | 20 | 40 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "20" && text !== "40") return null;
  return Number(text) as 5 | 10 | 20 | 40;
}

/** A limb is 1, 3, or 5. Anything else stays blank. */
export function graphLimb(raw: unknown): 1 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "5") return null;
  return Number(text) as 1 | 3 | 5;
}

/** Finish is ivory, graphite, or champagne. The saved name is the upper token. */
export function graphFinish(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function innerFace(face: unknown): boolean {
  return INNER.has(clip(face, 12).toLowerCase());
}

export function outerFace(face: unknown): boolean {
  return OUTER.has(clip(face, 12).toLowerCase());
}

/** Face is the dial. Back is the reverse. Edge is the flank. Rim is the arc. */
export function graphBand(face: unknown): string {
  const text = graphFace(face);
  if (!text) return "";
  if (text === "face") return "dial";
  if (text === "back") return "reverse";
  if (text === "edge") return "flank";
  return "arc";
}

/** Signed distance from one face to another in semicircle order. */
export function faceGap(from: unknown, to: unknown): number | null {
  const left = faceIndex(graphFace(from));
  const right = faceIndex(graphFace(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE_FINISH.has(graphFinish(finish));
}

/** A pair limb is 3. One and five are not a pair. */
export function pairLimb(limb: unknown): boolean {
  return graphLimb(limb) === 3;
}

/** A full limb is 5. */
export function fullLimb(limb: unknown): boolean {
  return graphLimb(limb) === 5;
}

export function activeFace(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return graphFace(text) || "all";
}

export function activePitch(raw: unknown): string {
  const pitch = graphPitch(raw);
  return pitch === null ? "all" : String(pitch);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = graphFinish(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeLimb(raw: unknown): string {
  const limb = graphLimb(raw);
  return limb === null ? "all" : String(limb);
}

export function moveGraphFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The finish the bench uses least. A tie keeps champagne, then ivory, then graphite. */
export function suggestGraphFinish(cards: readonly Graphometer[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "CHAMPAGNE";
  let score = Number.POSITIVE_INFINITY;
  for (const finish of ["CHAMPAGNE", "IVORY", "GRAPHITE"]) {
    const count = counts.get(finish) || 0;
    if (count < score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest five. Morning asks for ten. Afternoon asks for twenty. Evening asks for forty. A missing pitch on the bench wins when any pitch is saved, and a tie keeps the wider pitch. */
export function suggestPitch(cards: readonly Graphometer[], hour: number): 5 | 10 | 20 | 40 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.pitch === null) continue;
    seen = true;
    counts.set(card.pitch, (counts.get(card.pitch) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 10 | 20 | 40 = 40;
    let score = Number.POSITIVE_INFINITY;
    for (const pitch of [...PITCH_CYCLE].reverse()) {
      const count = counts.get(pitch) || 0;
      if (count < score) {
        best = pitch;
        score = count;
      }
    }
    return best;
  }
  if (hour < 8) return 5;
  if (hour < 13) return 10;
  if (hour < 19) return 20;
  return 40;
}

/** Before noon, suggest the face. The rest of the day suggests the rim. */
export function suggestFace(hour: number): GraphFace {
  return hour < 12 ? "face" : "rim";
}

/** The surveyor with the fewest unaligned arcs on the bench. A tie keeps the roster order. */
export function fairGraphSurveyor(cards: readonly Graphometer[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.aligned);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.surveyor.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readGraphometers(raw: unknown): Graphometer[] {
  if (!Array.isArray(raw)) return [];
  const out: Graphometer[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Graphometer>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      surveyor: clip(row.surveyor, 24),
      face: graphFace(row.face),
      pitch: graphPitch(row.pitch),
      finish: graphFinish(row.finish),
      limb: graphLimb(row.limb) ?? 1,
      tags: tagsOf(row.tags),
      aligned: row.aligned === true,
      cased: row.cased === true,
      vaulted: row.vaulted === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addGraphometer(
  cards: readonly Graphometer[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    surveyor?: string;
    face?: string;
    pitch?: unknown;
    finish?: string;
    limb?: unknown;
    tags?: unknown;
  },
): Graphometer[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readGraphometers([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      surveyor: clip(card.surveyor, 24),
      face: graphFace(card.face),
      pitch: graphPitch(card.pitch),
      finish: graphFinish(card.finish),
      limb: graphLimb(card.limb) ?? 1,
      tags: tagsOf(card.tags),
      aligned: false,
      cased: false,
      vaulted: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Graphometer[], id: string, edit: (card: Graphometer) => Graphometer): Graphometer[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editGraphometer(cards: readonly Graphometer[], id: string, title: string): Graphometer[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editGraphNote(cards: readonly Graphometer[], id: string, note: string): Graphometer[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleFinish(finish: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(graphFinish(finish));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setGraphFinish(cards: readonly Graphometer[], id: string, finish: string): Graphometer[] {
  const next = graphFinish(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

export function setGraphAligned(cards: readonly Graphometer[], id: string, aligned: boolean): Graphometer[] {
  return mapCard(cards, id, (card) => (card.aligned === aligned ? card : { ...card, aligned, audit: aligned ? "align" : "clear" }));
}

export function setGraphCase(cards: readonly Graphometer[], id: string, cased: boolean): Graphometer[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, vaulted: cased ? false : card.vaulted, audit: cased ? "case" : "resume" }));
}

export function setGraphVault(cards: readonly Graphometer[], id: string, vaulted: boolean): Graphometer[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, cased: vaulted ? false : card.cased, audit: vaulted ? "vault" : "open" }));
}

export function setGraphStar(cards: readonly Graphometer[], id: string, flagged: boolean): Graphometer[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addGraphTag(cards: readonly Graphometer[], id: string, tag: string): Graphometer[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepPitch(pitch: number | null, dir: 1 | -1): 5 | 10 | 20 | 40 {
  if (pitch === null) return dir > 0 ? 5 : 40;
  const index = pitchIndex(pitch);
  const next = index < 0 ? 0 : (index + dir + PITCH_CYCLE.length) % PITCH_CYCLE.length;
  return PITCH_CYCLE[next];
}

function stepLimb(limb: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = limbIndex(limb);
  const next = index < 0 ? 0 : (index + dir + LIMB_CYCLE.length) % LIMB_CYCLE.length;
  return LIMB_CYCLE[next];
}

export function liftPitch(cards: readonly Graphometer[], id: string): Graphometer[] {
  return mapCard(cards, id, (card) => ({ ...card, pitch: stepPitch(card.pitch, 1), audit: "pitch" }));
}

export function lowerPitch(cards: readonly Graphometer[], id: string): Graphometer[] {
  return mapCard(cards, id, (card) => ({ ...card, pitch: stepPitch(card.pitch, -1), audit: "lower" }));
}

export function raiseLimb(cards: readonly Graphometer[], id: string): Graphometer[] {
  return mapCard(cards, id, (card) => ({ ...card, limb: stepLimb(card.limb, 1), audit: "limb" }));
}

export function lowerLimb(cards: readonly Graphometer[], id: string): Graphometer[] {
  return mapCard(cards, id, (card) => ({ ...card, limb: stepLimb(card.limb, -1), audit: "limb" }));
}

export function alignGraphFocused(cards: readonly Graphometer[], id: string): Graphometer[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, aligned: !card.aligned, audit: card.aligned ? "clear" : "align" })) : [...cards];
}

export function caseGraphFocused(cards: readonly Graphometer[], id: string): Graphometer[] {
  return setGraphCase(cards, id, !cards.find((card) => card.id === id)?.cased);
}

export function starGraphFocused(cards: readonly Graphometer[], id: string): Graphometer[] {
  return setGraphStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagGraphFocused(cards: readonly Graphometer[], id: string): Graphometer[] {
  return addGraphTag(cards, id, "n");
}

export function finishFocused(cards: readonly Graphometer[], id: string): Graphometer[] {
  const card = cards.find((item) => item.id === id);
  return card ? setGraphFinish(cards, id, cycleFinish(card.finish)) : [...cards];
}

export function liftPitchFocused(cards: readonly Graphometer[], id: string): Graphometer[] {
  return liftPitch(cards, id);
}

export function lowerPitchFocused(cards: readonly Graphometer[], id: string): Graphometer[] {
  return lowerPitch(cards, id);
}

export function raiseLimbFocused(cards: readonly Graphometer[], id: string): Graphometer[] {
  return raiseLimb(cards, id);
}

export function lowerLimbFocused(cards: readonly Graphometer[], id: string): Graphometer[] {
  return lowerLimb(cards, id);
}

function bulk(cards: readonly Graphometer[], ids: readonly string[], edit: (card: Graphometer) => Graphometer): Graphometer[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkGraphChampagne(cards: readonly Graphometer[], ids: readonly string[]): Graphometer[] {
  return bulk(cards, ids, (card) => (card.finish === "CHAMPAGNE" ? card : { ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkGraphAlign(cards: readonly Graphometer[], ids: readonly string[]): Graphometer[] {
  return bulk(cards, ids, (card) => (card.aligned ? card : { ...card, aligned: true, audit: "align" }));
}

export function bulkGraphVault(cards: readonly Graphometer[], ids: readonly string[]): Graphometer[] {
  return bulk(cards, ids, (card) => (card.vaulted ? card : { ...card, vaulted: true, cased: false, audit: "vault" }));
}

export function bulkGraphTag(cards: readonly Graphometer[], ids: readonly string[]): Graphometer[] {
  return bulk(cards, ids, (card) => (card.tags.includes("s") ? card : { ...card, tags: tagsOf([...card.tags, "s"]), audit: "tag" }));
}

export function readGraphViews(raw: unknown): GraphView[] {
  if (!Array.isArray(raw)) return [];
  const out: GraphView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GraphView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      surveyor: clip(row.surveyor, 24),
      finish: activeFinish(row.finish, ["IVORY", "GRAPHITE", "CHAMPAGNE"]),
      face: activeFace(row.face),
      pitch: activePitch(row.pitch),
      limb: activeLimb(row.limb),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addGraphView(views: readonly GraphView[], view: GraphView): GraphView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readGraphViews([...views, { ...view, id, name }]);
}

export function dropGraphView(views: readonly GraphView[], id: string): GraphView[] {
  return views.filter((view) => view.id !== id);
}

export function graphDensity(raw: unknown): GraphDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortGraphometers(cards: readonly Graphometer[], sort: GraphSort): Graphometer[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "surveyor") {
      const surveyor = a.surveyor.localeCompare(b.surveyor);
      if (surveyor) return surveyor;
    } else {
      const face = faceIndex(a.face) - faceIndex(b.face);
      if (face) return face;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleGraphometers(
  cards: readonly Graphometer[],
  tray: GraphTray,
  query: string,
  surveyor: string,
  finish: string,
  face: string,
  pitch: string,
  limb: string,
): Graphometer[] {
  const text = query.trim().toLowerCase();
  const wantReader = clip(surveyor, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : graphFinish(finish);
  const wantFace = activeFace(face);
  const wantPitch = activePitch(pitch);
  const wantLimb = activeLimb(limb);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.surveyor}`.toLowerCase().includes(text)) return false;
    if (wantReader && card.surveyor.toLowerCase() !== wantReader) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantFace === "inner" && !innerFace(card.face)) return false;
    if (wantFace === "outer" && !outerFace(card.face)) return false;
    if (wantFace !== "all" && wantFace !== "inner" && wantFace !== "outer" && card.face !== wantFace) return false;
    if (wantPitch !== "all" && String(card.pitch ?? "") !== wantPitch) return false;
    if (wantLimb !== "all" && String(card.limb) !== wantLimb) return false;
    return true;
  });
}

/** An outer face on limb one, still unaligned and not in the vault, is overdue. */
export function overdueGraph(card: Graphometer): boolean {
  return outerFace(card.face) && card.limb === 1 && !card.aligned && !card.vaulted;
}

/** No finish, the short pitch, limb one, and still on the bench. */
export function idleGraph(card: Graphometer): boolean {
  return !card.finish && card.pitch === 5 && card.limb === 1 && !card.aligned && !card.cased && !card.vaulted;
}

/** Champagne, a wide pitch, and a full limb, still out of the vault. */
export function briskGraph(card: Graphometer): boolean {
  return card.finish === "CHAMPAGNE" && card.pitch === 40 && card.limb === 5 && !card.vaulted;
}

/** Rim, ivory, and a middle pitch. */
export function restingGraph(card: Graphometer): boolean {
  return card.face === "rim" && card.finish === "IVORY" && card.pitch === 10;
}

/** A face arc is late when the desk is already on the rim. */
export function lateGraph(card: Graphometer, desk: string): boolean {
  return card.face === "face" && graphFace(desk) === "rim" && !card.aligned;
}

export function graphCounts(cards: readonly Graphometer[], shown: readonly Graphometer[], desk: string): GraphCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    aligned: cards.filter((card) => card.aligned).length,
    inner: cards.filter((card) => innerFace(card.face)).length,
    outer: cards.filter((card) => outerFace(card.face)).length,
    wide: cards.filter((card) => card.pitch === 40).length,
    house: cards.filter((card) => houseFinish(card.finish)).length,
    pitch: cards.reduce((sum, card) => sum + (card.pitch || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleGraph).length,
    brisk: cards.filter(briskGraph).length,
    resting: cards.filter(restingGraph).length,
    overdue: cards.filter(overdueGraph).length,
    pair: cards.filter((card) => pairLimb(card.limb) && lateGraph(card, desk)).length,
  };
}

export function graphBars(cards: readonly Graphometer[]): { face: string; count: number }[] {
  return GRAPH_FACES.map((face) => ({ face, count: cards.filter((card) => card.face === face && !card.vaulted).length }));
}

export function graphTimeline(cards: readonly Graphometer[]): { pitch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return PITCH_CYCLE.map((pitch) => ({ pitch, titles: open.filter((card) => card.pitch === pitch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function graphSurveyors(cards: readonly Graphometer[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.surveyor && !out.some((name) => name.toLowerCase() === card.surveyor.toLowerCase())) out.push(card.surveyor);
  }
  return out;
}

export function busiestGraphSurveyor(cards: readonly Graphometer[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.aligned && card.surveyor);
  let best = "";
  let score = 0;
  for (const name of graphSurveyors(open)) {
    const count = open.filter((card) => card.surveyor.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderGraphs(cards: readonly Graphometer[]): string[] {
  return cards.filter(overdueGraph).map((card) => card.title);
}

export function graphCopy(card: Graphometer): string {
  return [card.title, card.surveyor, card.face, card.finish, card.pitch ?? "", card.limb, card.note].filter((item) => item !== "").join(" · ");
}

export function graphCsv(cards: readonly Graphometer[], desk: string): string {
  const lines = ["title,surveyor,face,finish,pitch,limb,tags,aligned,case,vault,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.surveyor),
        card.face,
        card.finish,
        card.pitch ?? "",
        card.limb,
        card.tags.join(" "),
        card.aligned ? "1" : "0",
        card.cased ? "1" : "0",
        card.vaulted ? "1" : "0",
        card.flagged ? "1" : "0",
        outerFace(card.face) ? "1" : "0",
        lateGraph(card, desk) ? "1" : "0",
        idleGraph(card) ? "1" : "0",
        briskGraph(card) ? "1" : "0",
        restingGraph(card) ? "1" : "0",
        overdueGraph(card) ? "1" : "0",
        innerFace(card.face) ? "1" : "0",
        houseFinish(card.finish) ? "1" : "0",
        graphBand(card.face),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const OSP_KEY = "crmv4-os-hide";
export const OSP_REVIEW_KEY = "crmv4-os-review";

export type OsLane = "" | "seed" | "stack" | "pair" | "house" | "spark" | "post";

export type OsHue = "" | "ivory" | "graphite" | "champagne";

export type OsState = "" | "clear" | "set";

export type OsReview = "all" | "reviewed" | "fresh";

export type OsShape =
  | "all"
  | "seed"
  | "stack"
  | "pair"
  | "house"
  | "spark"
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

export type OsValue = string | { lastOs?: unknown; [key: string]: unknown } | null | undefined;

export type OsRow = { id: string; label: string; system: OsValue };

export type OsLaneLine = { lane: string; count: number };

const OS_LANES = ["seed", "stack", "pair", "house", "spark", "post"] as const;

const OS_HUES = ["champagne", "ivory", "graphite"] as const;

function osRecord(raw: OsValue): { lastOs?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function osBlocked(raw: OsValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function osGiven(raw: OsValue): string {
  const row = osRecord(raw);
  if (row && !("lastOs" in row)) return "";
  const value = row ? row.lastOs : raw;
  return clip(value, 64);
}

function osReadable(raw: OsValue): boolean {
  if (osBlocked(raw)) return false;
  const row = osRecord(raw);
  if (row && !("lastOs" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function osState(raw: OsValue): OsState {
  if (!osReadable(raw)) return "";
  return osGiven(raw) ? "set" : "clear";
}

/** A seed has no space and no digit. A house name is macOS, Windows, or Linux. A pair has a space and a digit. A stack contains a slash. A spark starts with three letters or fewer. */
export function osLane(raw: OsValue): OsLane {
  if (osState(raw) !== "set") return "";
  const text = osGiven(raw);
  const lower = text.toLowerCase();
  const first = firstToken(text);
  if (text.includes("/")) return "stack";
  if (HOUSE_OS.has(lower)) return "house";
  if (text.includes(" ") && /\d/.test(text)) return "pair";
  if (!text.includes(" ") && !/\d/.test(text)) return "seed";
  if (first.length > 0 && first.length <= 3) return "spark";
  return "post";
}

export function osHue(raw: OsValue): OsHue {
  const lane = osLane(raw);
  if (!lane) return "";
  if (lane === "seed" || lane === "spark") return "champagne";
  if (lane === "stack" || lane === "pair") return "graphite";
  return "ivory";
}

export function osSeed(raw: OsValue): boolean {
  return osLane(raw) === "seed";
}

export function osStack(raw: OsValue): boolean {
  return osLane(raw) === "stack";
}

export function osPair(raw: OsValue): boolean {
  return osLane(raw) === "pair";
}

export function osHouse(raw: OsValue): boolean {
  return osLane(raw) === "house";
}

export function osSpark(raw: OsValue): boolean {
  return osLane(raw) === "spark";
}

export function osPost(raw: OsValue): boolean {
  return osLane(raw) === "post";
}

export function osOpen(raw: OsValue): boolean {
  return osState(raw) === "clear";
}

/** A system the desk can keep without a rewrite: house or post. */
export function osHeld(raw: OsValue): boolean {
  const lane = osLane(raw);
  return lane === "house" || lane === "post";
}

/** A seed, or a first word of three letters or shorter, still wants a fuller system name. */
export function osSoon(raw: OsValue): boolean {
  if (osState(raw) !== "set") return false;
  if (osSeed(raw)) return true;
  const length = firstToken(osGiven(raw)).length;
  return length > 0 && length <= 3;
}

export function osLength(raw: OsValue): number | null {
  if (osState(raw) !== "set") return null;
  return osGiven(raw).length;
}

export function osEven(raw: OsValue): boolean {
  const length = osLength(raw);
  return length !== null && length % 2 === 0;
}

export function osOdd(raw: OsValue): boolean {
  const length = osLength(raw);
  return length !== null && length % 2 === 1;
}

export function osFirst(raw: OsValue): boolean {
  return /^[A-Za-z]/.test(osGiven(raw));
}

export function osTail(raw: OsValue): boolean {
  return /[0-9]$/.test(osGiven(raw));
}

export function osCapital(raw: OsValue): boolean {
  return /[A-Z]/.test(osGiven(raw));
}

export function osSpace(raw: OsValue): boolean {
  return osGiven(raw).includes(" ");
}

export function osVowel(raw: OsValue): boolean {
  return /^[aeiou]/i.test(osGiven(raw));
}

export function osDigit(raw: OsValue): boolean {
  return /[0-9]/.test(osGiven(raw));
}

export function osLetter(raw: OsValue): boolean {
  return /[A-Za-z]/.test(osGiven(raw));
}

export function osMixed(raw: OsValue): boolean {
  return osDigit(raw) && osLetter(raw);
}

export function osLower(raw: OsValue): boolean {
  const text = osGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

export function osUpper(raw: OsValue): boolean {
  return osCapital(raw);
}

export function osSlash(raw: OsValue): boolean {
  return osGiven(raw).includes("/");
}

export function osStamp(raw: OsValue): string {
  const text = osGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function osCopy(raw: OsValue): string {
  return osGiven(raw);
}

export function osFamily(raw: OsValue): string {
  if (osState(raw) !== "set") return "";
  return firstToken(osGiven(raw));
}

export function osLanes(rows: readonly OsRow[]): OsLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of OS_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = osLane(row.system);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return OS_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingOs(rows: readonly OsRow[]): string {
  const lines = osLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || OS_LANES.indexOf(a.lane as (typeof OS_LANES)[number]) - OS_LANES.indexOf(b.lane as (typeof OS_LANES)[number]))[0].lane;
}

export function leadingOsHue(rows: readonly OsRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of OS_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = osHue(row.system);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = OS_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || OS_HUES.indexOf(a.hue) - OS_HUES.indexOf(b.hue))[0].hue;
}

export function laneOsCount(rows: readonly OsRow[], lane: OsLane): number {
  return rows.filter((row) => osLane(row.system) === lane).length;
}

export function osShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentOsLanes(rows: readonly OsRow[]): string[] {
  return osLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenOs(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedOs(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleOs(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleOsReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkOsReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleOsLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: OsRow, shape: OsShape): boolean {
  if (shape === "all") return true;
  if (shape === "seed") return osSeed(row.system);
  if (shape === "stack") return osStack(row.system);
  if (shape === "pair") return osPair(row.system);
  if (shape === "house") return osHouse(row.system);
  if (shape === "spark") return osSpark(row.system);
  if (shape === "post") return osPost(row.system);
  if (shape === "open") return osOpen(row.system);
  if (shape === "soon") return osSoon(row.system);
  if (shape === "digit") return osDigit(row.system);
  if (shape === "letter") return osLetter(row.system);
  if (shape === "mixed") return osMixed(row.system);
  if (shape === "upper") return osUpper(row.system);
  if (shape === "lower") return osLower(row.system);
  if (shape === "space") return osSpace(row.system);
  if (shape === "even") return osEven(row.system);
  if (shape === "odd") return osOdd(row.system);
  if (shape === "vowel") return osVowel(row.system);
  if (shape === "tail") return osTail(row.system);
  if (shape === "first") return osFirst(row.system);
  if (shape === "held") return osHeld(row.system);
  if (shape === "slash") return osSlash(row.system);
  return osLane(row.system) === shape;
}

export function visibleOs(
  rows: readonly OsRow[],
  lane: string,
  hue: string,
  query: string,
  review: OsReview,
  reviewed: readonly string[],
  shape: OsShape,
): OsRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (osState(row.system) === "") return false;
    const found = osLane(row.system);
    const hueName = osHue(row.system);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${osGiven(row.system)} ${osStamp(row.system)} ${osFamily(row.system)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function osLanesCsv(rows: readonly OsRow[]): string {
  const lines = ["lane,count"];
  for (const line of osLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function osRowsCsv(rows: readonly OsRow[], reviewed: readonly string[]): string {
  const lines = ["name,system,stamp,family,lane,hue,length,seed,stack,pair,house,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (osState(row.system) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(osGiven(row.system)),
        osStamp(row.system),
        csvCell(osFamily(row.system)),
        osLane(row.system),
        osHue(row.system),
        String(osLength(row.system) ?? ""),
        osSeed(row.system) ? "1" : "0",
        osStack(row.system) ? "1" : "0",
        osPair(row.system) ? "1" : "0",
        osHouse(row.system) ? "1" : "0",
        osEven(row.system) ? "1" : "0",
        osDigit(row.system) ? "1" : "0",
        osMixed(row.system) ? "1" : "0",
        osUpper(row.system) ? "1" : "0",
        osVowel(row.system) ? "1" : "0",
        osTail(row.system) ? "1" : "0",
        osHeld(row.system) ? "1" : "0",
        osSoon(row.system) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
