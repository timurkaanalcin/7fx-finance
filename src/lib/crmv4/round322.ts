/**
 * Tourbillon rules for a rotating cage kept in this browser, and isogonic plates read the broker already stored on the account.
 * Parts are cage, staff, bridge, and jewel. Inks are gilt, ivory, and graphite.
 * Pinions are 2, 5, 8, or 11. Revolutions are 3, 6, or 9.
 * A known broker is HOUSE, FLOOR, PRIME, or INTRO. A join contains a hyphen. A span has a space.
 * A stub is three characters or fewer. A scroll is fourteen characters or longer. A digit contains a number.
 * A true broker reads as HOUSE. A false broker reads as NO BROKER.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_tourbillon (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   part text not null default '',
 *   pinion_no integer,
 *   ink text not null default '',
 *   rev_no integer not null default 3,
 *   tags text not null default '',
 *   wound boolean not null default false,
 *   hooked boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_isogonic_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_isogonic_review (
 *   trader_id text primary key
 * );
 */


export const TRB_KEY = "crmv4-tourbillon";
export const TRB_VIEW_KEY = "crmv4-tourbillon-views";
export const TRB_DENSITY_KEY = "crmv4-tourbillon-density";
export const TRB_PIECES = ["cage", "staff", "bridge", "jewel"] as const;

export type TourbillonPiece = (typeof TRB_PIECES)[number];

export type TourbillonInk = "blank" | "gilt" | "ivory" | "graphite";

export type TourbillonTray = "barrel" | "latch" | "coffer";

export type TourbillonDensity = "broad" | "tight";

export type TourbillonSort = "piece" | "smith";

export type Tourbillon = {
  id: string;
  title: string;
  note: string;
  smith: string;
  piece: string;
  tooth: number | null;
  ink: string;
  turn: number;
  tags: string[];
  spun: boolean;
  clicked: boolean;
  boxed: boolean;
  starred: boolean;
  audit: string;
};

export type TourbillonView = {
  id: string;
  name: string;
  tray: TourbillonTray;
  query: string;
  smith: string;
  ink: string;
  piece: string;
  tooth: string;
  turn: string;
};

export type TourbillonCounts = {
  bench: number;
  click: number;
  locker: number;
  spun: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  tooth: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND322_FEATURES = [
  "tourbillon-save",
  "notes",
  "cage-parts",
  "gilt-ink",
  "pinion-sla",
  "casket",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "keeper-sort",
  "desk-kpis",
  "cage-chart",
  "pinion-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-keeper",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "broker-isogonic",
  "isogonic-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "set", "clear", "latch", "resume", "coffer", "open", "tag", "turn", "tooth", "lower", "star"] as const;

const INKS = ["gilt", "ivory", "graphite"] as const;

const PINION_CYCLE = [2, 5, 8, 11] as const;

const REV_CYCLE = [3, 6, 9] as const;

const INNER = new Set(["cage", "staff"]);

const OUTER = new Set(["bridge", "jewel"]);

const HOUSE_INK = new Set(["GILT", "IVORY"]);

const AGENT_CODES = new Set(["HOUSE", "FLOOR", "PRIME", "INTRO"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TourbillonTray {
  return raw === "latch" || raw === "coffer" ? raw : "barrel";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<TourbillonInk, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<TourbillonInk, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cg]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Tourbillon, tray: TourbillonTray): boolean {
  if (tray === "latch") return card.clicked && !card.boxed;
  if (tray === "coffer") return card.boxed;
  return !card.clicked && !card.boxed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return TRB_PIECES.indexOf(piece as TourbillonPiece);
}

function toothIndex(tooth: number): number {
  return PINION_CYCLE.indexOf(tooth as (typeof PINION_CYCLE)[number]);
}

function beatIndex(turn: number): number {
  return REV_CYCLE.indexOf(turn as (typeof REV_CYCLE)[number]);
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

export function tourbillonPiece(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (TRB_PIECES as readonly string[]).includes(text) ? text : "";
}

/** A pinion is 2, 5, 8, or 11. Anything else stays blank. */
export function tourbillonTooth(raw: unknown): 2 | 5 | 8 | 11 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "8" && text !== "11") return null;
  return Number(text) as 2 | 5 | 8 | 11;
}

/** A revolution is 3, 6, or 9. Anything else stays blank. */
export function tourbillonTurn(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** An ink is gilt, ivory, or graphite. The saved name is the upper token. */
export function tourbillonInk(raw: unknown): string {
  const text = inkName(raw);
  return text ? text.toUpperCase() : "";
}

export function tourbillonInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function tourbillonOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Cage spins. Staff is the stem. Bridge spans. Jewel is the seat. */
export function tourbillonBand(piece: unknown): string {
  const text = tourbillonPiece(piece);
  if (!text) return "";
  if (text === "cage") return "spin";
  if (text === "staff") return "stem";
  if (text === "bridge") return "span";
  return "seat";
}

/** Signed distance from one piece to another along the tourbillon. */
export function tourbillonGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(tourbillonPiece(from));
  const right = pieceIndex(tourbillonPiece(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseInk(ink: unknown): boolean {
  return HOUSE_INK.has(tourbillonInk(ink));
}

/** A pair revolution is 6. Three and nine are not a pair. */
export function pairTurn(turn: unknown): boolean {
  return tourbillonTurn(turn) === 6;
}

/** A full revolution is 9. */
export function fullTurn(turn: unknown): boolean {
  return tourbillonTurn(turn) === 9;
}

export function activePiece(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return tourbillonPiece(text) || "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = tourbillonTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = tourbillonInk(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeTurn(raw: unknown): string {
  const turn = tourbillonTurn(raw);
  return turn === null ? "all" : String(turn);
}

export function moveTourbillonFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ink the bench uses least. A tie keeps gilt, then graphite, then ivory. */
export function suggestInk(cards: readonly Tourbillon[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "barrel") || !card.ink) continue;
    counts.set(card.ink, (counts.get(card.ink) || 0) + 1);
  }
  let best = "GILT";
  let score = Number.POSITIVE_INFINITY;
  for (const ink of ["GILT", "GRAPHITE", "IVORY"]) {
    const count = counts.get(ink) || 0;
    if (count < score) {
      best = ink;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest two. Late morning asks for five. Afternoon asks for eight. Evening asks for eleven. A saved pinion on the bench wins, and a tie keeps the shorter pinion. */
export function suggestTooth(cards: readonly Tourbillon[], hour: number): 2 | 5 | 8 | 11 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "barrel") || card.tooth === null) continue;
    seen = true;
    counts.set(card.tooth, (counts.get(card.tooth) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 5 | 8 | 11 = 2;
    let score = Number.POSITIVE_INFINITY;
    for (const tooth of PINION_CYCLE) {
      const count = counts.get(tooth) || 0;
      if (count < score) {
        best = tooth;
        score = count;
      }
    }
    return best;
  }
  if (hour < 8) return 2;
  if (hour < 14) return 5;
  if (hour < 20) return 8;
  return 11;
}

/** Before ten, suggest the cage. The rest of the day suggests the jewel. */
export function suggestPiece(hour: number): TourbillonPiece {
  return hour < 10 ? "cage" : "jewel";
}

/** The smith with the fewest unwound pieces on the bench. A tie keeps the roster order. */
export function fairSmith(cards: readonly Tourbillon[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "barrel") && !card.spun);
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

export function readTourbillonRules(raw: unknown): Tourbillon[] {
  if (!Array.isArray(raw)) return [];
  const out: Tourbillon[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Tourbillon>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      smith: clip(row.smith, 24),
      piece: tourbillonPiece(row.piece),
      tooth: tourbillonTooth(row.tooth),
      ink: tourbillonInk(row.ink),
      turn: tourbillonTurn(row.turn) ?? 3,
      tags: tagsOf(row.tags),
      spun: row.spun === true,
      clicked: row.clicked === true,
      boxed: row.boxed === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addTourbillon(
  cards: readonly Tourbillon[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    smith?: string;
    piece?: string;
    tooth?: unknown;
    ink?: string;
    turn?: unknown;
    tags?: unknown;
  },
): Tourbillon[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTourbillonRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      smith: clip(card.smith, 24),
      piece: tourbillonPiece(card.piece),
      tooth: tourbillonTooth(card.tooth),
      ink: tourbillonInk(card.ink),
      turn: tourbillonTurn(card.turn) ?? 3,
      tags: tagsOf(card.tags),
      spun: false,
      clicked: false,
      boxed: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Tourbillon[], id: string, edit: (card: Tourbillon) => Tourbillon): Tourbillon[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTourbillon(cards: readonly Tourbillon[], id: string, title: string): Tourbillon[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTourbillonNote(cards: readonly Tourbillon[], id: string, note: string): Tourbillon[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleInk(ink: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(tourbillonInk(ink));
  return order[(index + 1) % order.length] || "GILT";
}

export function setTourbillonInk(cards: readonly Tourbillon[], id: string, ink: string): Tourbillon[] {
  const next = tourbillonInk(ink);
  return mapCard(cards, id, (card) => (card.ink === next ? card : { ...card, ink: next, audit: "ink" }));
}

export function setTourbillonSpin(cards: readonly Tourbillon[], id: string, spun: boolean): Tourbillon[] {
  return mapCard(cards, id, (card) => (card.spun === spun ? card : { ...card, spun, audit: spun ? "set" : "clear" }));
}

export function setTourbillonClick(cards: readonly Tourbillon[], id: string, clicked: boolean): Tourbillon[] {
  return mapCard(cards, id, (card) => (card.clicked === clicked ? card : { ...card, clicked, boxed: clicked ? false : card.boxed, audit: clicked ? "latch" : "resume" }));
}

export function setTourbillonLocker(cards: readonly Tourbillon[], id: string, boxed: boolean): Tourbillon[] {
  return mapCard(cards, id, (card) => (card.boxed === boxed ? card : { ...card, boxed, clicked: boxed ? false : card.clicked, audit: boxed ? "coffer" : "open" }));
}

export function setTourbillonStar(cards: readonly Tourbillon[], id: string, starred: boolean): Tourbillon[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addTourbillonTag(cards: readonly Tourbillon[], id: string, tag: string): Tourbillon[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepTooth(tooth: number | null, dir: 1 | -1): 2 | 5 | 8 | 11 {
  if (tooth === null) return dir > 0 ? 2 : 11;
  const index = toothIndex(tooth);
  const next = index < 0 ? 0 : (index + dir + PINION_CYCLE.length) % PINION_CYCLE.length;
  return PINION_CYCLE[next];
}

function stepTurn(turn: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = beatIndex(turn);
  const next = index < 0 ? 0 : (index + dir + REV_CYCLE.length) % REV_CYCLE.length;
  return REV_CYCLE[next];
}

export function liftTooth(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, 1), audit: "tooth" }));
}

export function lowerTooth(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, -1), audit: "lower" }));
}

export function raiseTurn(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return mapCard(cards, id, (card) => ({ ...card, turn: stepTurn(card.turn, 1), audit: "turn" }));
}

export function lowerTurn(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return mapCard(cards, id, (card) => ({ ...card, turn: stepTurn(card.turn, -1), audit: "turn" }));
}

export function setTourbillonFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, spun: !card.spun, audit: card.spun ? "clear" : "set" })) : [...cards];
}

export function hookTourbillonFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return setTourbillonClick(cards, id, !cards.find((card) => card.id === id)?.clicked);
}

export function starTourbillonFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return setTourbillonStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagTourbillonFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return addTourbillonTag(cards, id, "c");
}

export function inkFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTourbillonInk(cards, id, cycleInk(card.ink)) : [...cards];
}

export function liftToothFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return liftTooth(cards, id);
}

export function lowerToothFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return lowerTooth(cards, id);
}

export function raiseTurnFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return raiseTurn(cards, id);
}

export function lowerTurnFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return lowerTurn(cards, id);
}

function bulk(cards: readonly Tourbillon[], ids: readonly string[], edit: (card: Tourbillon) => Tourbillon): Tourbillon[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTourbillonGraphite(cards: readonly Tourbillon[], ids: readonly string[]): Tourbillon[] {
  return bulk(cards, ids, (card) => (card.ink === "GRAPHITE" ? card : { ...card, ink: "GRAPHITE", audit: "ink" }));
}

export function bulkTourbillonSpin(cards: readonly Tourbillon[], ids: readonly string[]): Tourbillon[] {
  return bulk(cards, ids, (card) => (card.spun ? card : { ...card, spun: true, audit: "set" }));
}

export function bulkTourbillonLocker(cards: readonly Tourbillon[], ids: readonly string[]): Tourbillon[] {
  return bulk(cards, ids, (card) => (card.boxed ? card : { ...card, boxed: true, clicked: false, audit: "coffer" }));
}

export function bulkTourbillonTag(cards: readonly Tourbillon[], ids: readonly string[]): Tourbillon[] {
  return bulk(cards, ids, (card) => (card.tags.includes("g") ? card : { ...card, tags: tagsOf([...card.tags, "g"]), audit: "tag" }));
}

export function readTourbillonViews(raw: unknown): TourbillonView[] {
  if (!Array.isArray(raw)) return [];
  const out: TourbillonView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TourbillonView>;
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
      piece: activePiece(row.piece),
      tooth: activeTooth(row.tooth),
      turn: activeTurn(row.turn),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addTourbillonView(views: readonly TourbillonView[], view: TourbillonView): TourbillonView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTourbillonViews([...views, { ...view, id, name }]);
}

export function dropTourbillonView(views: readonly TourbillonView[], id: string): TourbillonView[] {
  return views.filter((view) => view.id !== id);
}

export function tourbillonDensity(raw: unknown): TourbillonDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortTourbillonRules(cards: readonly Tourbillon[], sort: TourbillonSort): Tourbillon[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "smith") {
      const smith = a.smith.localeCompare(b.smith);
      if (smith) return smith;
    } else {
      const piece = pieceIndex(a.piece) - pieceIndex(b.piece);
      if (piece) return piece;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleTourbillonRules(
  cards: readonly Tourbillon[],
  tray: TourbillonTray,
  query: string,
  smith: string,
  ink: string,
  piece: string,
  tooth: string,
  turn: string,
): Tourbillon[] {
  const text = query.trim().toLowerCase();
  const wantSmith = clip(smith, 24).toLowerCase();
  const wantInk = ink === "all" ? "" : tourbillonInk(ink);
  const wantPiece = activePiece(piece);
  const wantTooth = activeTooth(tooth);
  const wantTurn = activeTurn(turn);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.smith}`.toLowerCase().includes(text)) return false;
    if (wantSmith && card.smith.toLowerCase() !== wantSmith) return false;
    if (wantInk && card.ink !== wantInk) return false;
    if (wantPiece === "inner" && !tourbillonInner(card.piece)) return false;
    if (wantPiece === "outer" && !tourbillonOuter(card.piece)) return false;
    if (wantPiece !== "all" && wantPiece !== "inner" && wantPiece !== "outer" && card.piece !== wantPiece) return false;
    if (wantTooth !== "all" && String(card.tooth ?? "") !== wantTooth) return false;
    if (wantTurn !== "all" && String(card.turn) !== wantTurn) return false;
    return true;
  });
}

/** An outer part on revolution three, still unwound and not in the casket, is overdue. */
export function overdueTourbillon(card: Tourbillon): boolean {
  return tourbillonOuter(card.piece) && card.turn === 3 && !card.spun && !card.boxed;
}

/** No ink, the short pinion, revolution three, and still on the bench. */
export function idleTourbillon(card: Tourbillon): boolean {
  return !card.ink && card.tooth === 2 && card.turn === 3 && !card.spun && !card.clicked && !card.boxed;
}

/** Gilt, a tall pinion, and a full revolution, still out of the casket. */
export function briskTourbillon(card: Tourbillon): boolean {
  return card.ink === "GILT" && card.tooth === 11 && card.turn === 9 && !card.boxed;
}

/** Jewel, ivory, and pinion five. */
export function restingTourbillon(card: Tourbillon): boolean {
  return card.piece === "jewel" && card.ink === "IVORY" && card.tooth === 5;
}

/** A cage is late when the desk is already on the jewel. */
export function lateTourbillon(card: Tourbillon, desk: string): boolean {
  return card.piece === "cage" && tourbillonPiece(desk) === "jewel" && !card.spun;
}

export function tourbillonCounts(cards: readonly Tourbillon[], shown: readonly Tourbillon[], desk: string): TourbillonCounts {
  return {
    bench: cards.filter((card) => inTray(card, "barrel")).length,
    click: cards.filter((card) => inTray(card, "latch")).length,
    locker: cards.filter((card) => inTray(card, "coffer")).length,
    spun: cards.filter((card) => card.spun).length,
    inner: cards.filter((card) => tourbillonInner(card.piece)).length,
    outer: cards.filter((card) => tourbillonOuter(card.piece)).length,
    wide: cards.filter((card) => card.tooth === 11).length,
    house: cards.filter((card) => houseInk(card.ink)).length,
    tooth: cards.reduce((sum, card) => sum + (card.tooth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleTourbillon).length,
    brisk: cards.filter(briskTourbillon).length,
    resting: cards.filter(restingTourbillon).length,
    overdue: cards.filter(overdueTourbillon).length,
    pair: cards.filter((card) => pairTurn(card.turn) && lateTourbillon(card, desk)).length,
  };
}

export function tourbillonBars(cards: readonly Tourbillon[]): { piece: string; count: number }[] {
  return TRB_PIECES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.boxed).length }));
}

export function tourbillonTimeline(cards: readonly Tourbillon[]): { tooth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "barrel"));
  return PINION_CYCLE.map((tooth) => ({ tooth, titles: open.filter((card) => card.tooth === tooth).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function tourbillonSmiths(cards: readonly Tourbillon[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.smith && !out.some((name) => name.toLowerCase() === card.smith.toLowerCase())) out.push(card.smith);
  }
  return out;
}

export function busiestSmith(cards: readonly Tourbillon[]): string {
  const open = cards.filter((card) => inTray(card, "barrel") && !card.spun && card.smith);
  let best = "";
  let score = 0;
  for (const name of tourbillonSmiths(open)) {
    const count = open.filter((card) => card.smith.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTourbillonRules(cards: readonly Tourbillon[]): string[] {
  return cards.filter(overdueTourbillon).map((card) => card.title);
}

export function tourbillonCopy(card: Tourbillon): string {
  return [card.title, card.smith, card.piece, card.ink, card.tooth ?? "", card.turn, card.note].filter((item) => item !== "").join(" · ");
}

export function tourbillonCsv(cards: readonly Tourbillon[], desk: string): string {
  const lines = ["title,smith,piece,ink,tooth,turn,tags,spun,click,locker,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.smith),
        card.piece,
        card.ink,
        card.tooth ?? "",
        card.turn,
        card.tags.join(" "),
        card.spun ? "1" : "0",
        card.clicked ? "1" : "0",
        card.boxed ? "1" : "0",
        card.starred ? "1" : "0",
        tourbillonOuter(card.piece) ? "1" : "0",
        lateTourbillon(card, desk) ? "1" : "0",
        idleTourbillon(card) ? "1" : "0",
        briskTourbillon(card) ? "1" : "0",
        restingTourbillon(card) ? "1" : "0",
        overdueTourbillon(card) ? "1" : "0",
        tourbillonInner(card.piece) ? "1" : "0",
        houseInk(card.ink) ? "1" : "0",
        tourbillonBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const ISG_KEY = "crmv4-isogonic-hide";
export const ISG_REVIEW_KEY = "crmv4-isogonic-review";

export type IsogonicLane = "" | "house" | "join" | "span" | "digit" | "stub" | "scroll" | "vowel" | "path";

export type IsogonicHue = "" | "ivory" | "graphite" | "champagne";

export type IsogonicState = "" | "clear" | "set";

export type IsogonicReview = "all" | "reviewed" | "fresh";

export type IsogonicShape =
  | "all"
  | "house"
  | "join"
  | "span"
  | "digit"
  | "stub"
  | "scroll"
  | "vowel"
  | "path"
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
  | "held"
  | "hyphen"
  | "period";

export type IsogonicValue = string | { broker?: unknown; [key: string]: unknown } | null | undefined;

export type IsogonicRow = { id: string; label: string; code: IsogonicValue };

export type IsogonicLaneLine = { lane: string; count: number };

const CODE_LANES = ["house", "join", "span", "digit", "stub", "scroll", "vowel", "path"] as const;

const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: IsogonicValue): { broker?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: IsogonicValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: IsogonicValue): string {
  const row = codeRecord(raw);
  if (row && !("broker" in row)) return "";
  const value = row ? row.broker : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "HOUSE";
  if (value === false || value === "false" || value === "0" || value === 0) return "NO BROKER";
  return clip(value, 48);
}

function codeReadable(raw: IsogonicValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("broker" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function isogonicState(raw: IsogonicValue): IsogonicState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known broker is HOUSE, FLOOR, PRIME, or INTRO. A join contains a hyphen. A span has a space. A stub is three characters or fewer. A scroll is fourteen characters or longer. A digit contains a number. */
export function isogonicLane(raw: IsogonicValue): IsogonicLane {
  if (isogonicState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (AGENT_CODES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "join";
  if (text.includes(" ")) return "span";
  if (text.length <= 3) return "stub";
  if (text.length >= 14) return "scroll";
  if (/[0-9]/.test(text)) return "digit";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "path";
}

export function isogonicHue(raw: IsogonicValue): IsogonicHue {
  const lane = isogonicLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "digit") return "champagne";
  if (lane === "span" || lane === "join") return "graphite";
  return "ivory";
}

export function isogonicHouse(raw: IsogonicValue): boolean {
  return isogonicLane(raw) === "house";
}

export function isogonicJoin(raw: IsogonicValue): boolean {
  return isogonicLane(raw) === "join";
}

export function isogonicSpan(raw: IsogonicValue): boolean {
  return isogonicLane(raw) === "span";
}

export function isogonicDigitLane(raw: IsogonicValue): boolean {
  return isogonicLane(raw) === "digit";
}

export function isogonicStub(raw: IsogonicValue): boolean {
  return isogonicLane(raw) === "stub";
}

export function isogonicScroll(raw: IsogonicValue): boolean {
  return isogonicLane(raw) === "scroll";
}

export function isogonicVowelLane(raw: IsogonicValue): boolean {
  return isogonicLane(raw) === "vowel";
}

export function isogonicPath(raw: IsogonicValue): boolean {
  return isogonicLane(raw) === "path";
}

export function isogonicOpen(raw: IsogonicValue): boolean {
  return isogonicState(raw) === "clear";
}

/** A code the desk can keep without a rewrite: an scroll or a house house. */
export function isogonicHeld(raw: IsogonicValue): boolean {
  const lane = isogonicLane(raw);
  return lane === "scroll" || lane === "path";
}

/** A stub, or a three-character code that is not a house, still wants a fuller name. */
export function isogonicSoon(raw: IsogonicValue): boolean {
  if (isogonicState(raw) !== "set") return false;
  if (isogonicStub(raw)) return true;
  if (isogonicHouse(raw)) return false;
  return codeGiven(raw).length === 7;
}

export function isogonicLength(raw: IsogonicValue): number | null {
  if (isogonicState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function isogonicEven(raw: IsogonicValue): boolean {
  const length = isogonicLength(raw);
  return length !== null && length % 2 === 0;
}

export function isogonicOdd(raw: IsogonicValue): boolean {
  const length = isogonicLength(raw);
  return length !== null && length % 2 === 1;
}

export function isogonicFirst(raw: IsogonicValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function isogonicTail(raw: IsogonicValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function isogonicCapital(raw: IsogonicValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function isogonicSpace(raw: IsogonicValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function isogonicVowel(raw: IsogonicValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function isogonicDigit(raw: IsogonicValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function isogonicLetter(raw: IsogonicValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function isogonicMixed(raw: IsogonicValue): boolean {
  return isogonicDigit(raw) && isogonicLetter(raw);
}

export function isogonicLower(raw: IsogonicValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function isogonicUpper(raw: IsogonicValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function isogonicHyphen(raw: IsogonicValue): boolean {
  return codeGiven(raw).includes("-");
}

export function isogonicPeriod(raw: IsogonicValue): boolean {
  return codeGiven(raw).includes(".");
}

export function isogonicStamp(raw: IsogonicValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function isogonicCopy(raw: IsogonicValue): string {
  return codeGiven(raw);
}

export function isogonicFamily(raw: IsogonicValue): string {
  if (isogonicState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function isogonicLanes(rows: readonly IsogonicRow[]): IsogonicLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = isogonicLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingIsogonic(rows: readonly IsogonicRow[]): string {
  const lines = isogonicLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingIsogonicHue(rows: readonly IsogonicRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = isogonicHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneIsogonicCount(rows: readonly IsogonicRow[], lane: IsogonicLane): number {
  return rows.filter((row) => isogonicLane(row.code) === lane).length;
}

export function isogonicShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentIsogonicLanes(rows: readonly IsogonicRow[]): string[] {
  return isogonicLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenIsogonic(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedIsogonic(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleIsogonic(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleIsogonicReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkIsogonicReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleIsogonicLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: IsogonicRow, shape: IsogonicShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return isogonicHouse(row.code);
  if (shape === "join") return isogonicJoin(row.code);
  if (shape === "span") return isogonicSpan(row.code);
  if (shape === "digit") return isogonicDigitLane(row.code);
  if (shape === "stub") return isogonicStub(row.code);
  if (shape === "scroll") return isogonicScroll(row.code);
  if (shape === "vowel") return isogonicVowelLane(row.code);
  if (shape === "path") return isogonicPath(row.code);
  if (shape === "open") return isogonicOpen(row.code);
  if (shape === "soon") return isogonicSoon(row.code);
  if (shape === "letter") return isogonicLetter(row.code);
  if (shape === "mixed") return isogonicMixed(row.code);
  if (shape === "upper") return isogonicUpper(row.code);
  if (shape === "lower") return isogonicLower(row.code);
  if (shape === "space") return isogonicSpace(row.code);
  if (shape === "even") return isogonicEven(row.code);
  if (shape === "odd") return isogonicOdd(row.code);
  if (shape === "tail") return isogonicTail(row.code);
  if (shape === "first") return isogonicFirst(row.code);
  if (shape === "held") return isogonicHeld(row.code);
  if (shape === "hyphen") return isogonicHyphen(row.code);
  if (shape === "period") return isogonicPeriod(row.code);
  return isogonicLane(row.code) === shape;
}

export function visibleIsogonic(
  rows: readonly IsogonicRow[],
  lane: string,
  hue: string,
  query: string,
  review: IsogonicReview,
  reviewed: readonly string[],
  shape: IsogonicShape,
): IsogonicRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (isogonicState(row.code) === "") return false;
    const found = isogonicLane(row.code);
    const hueName = isogonicHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${isogonicStamp(row.code)} ${isogonicFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function isogonicLanesCsv(rows: readonly IsogonicRow[]): string {
  const lines = ["lane,count"];
  for (const line of isogonicLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function isogonicRowsCsv(rows: readonly IsogonicRow[], reviewed: readonly string[]): string {
  const lines = ["name,broker,stamp,family,lane,hue,length,house,join,span,stub,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(isogonicCopy(row.code)),
        isogonicStamp(row.code),
        csvCell(isogonicFamily(row.code)),
        isogonicLane(row.code),
        isogonicHue(row.code),
        isogonicLength(row.code) ?? "",
        isogonicHouse(row.code) ? "1" : "0",
        isogonicJoin(row.code) ? "1" : "0",
        isogonicSpan(row.code) ? "1" : "0",
        isogonicStub(row.code) ? "1" : "0",
        isogonicEven(row.code) ? "1" : "0",
        isogonicDigit(row.code) ? "1" : "0",
        isogonicMixed(row.code) ? "1" : "0",
        isogonicUpper(row.code) ? "1" : "0",
        isogonicVowel(row.code) ? "1" : "0",
        isogonicTail(row.code) ? "1" : "0",
        isogonicHeld(row.code) ? "1" : "0",
        isogonicSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
