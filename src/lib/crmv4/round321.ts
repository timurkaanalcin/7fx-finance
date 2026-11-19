/**
 * Remontoire rules for a constant-force spring kept in this browser, and rhumb plates read the assignee already stored on the account.
 * Limbs are spring, pawl, wheel, and detent. Inks are gilt, ivory, and graphite.
 * Notches are 3, 6, 9, or 12. Swings are 4, 8, or 12.
 * A known assignee is SALES, RETENTION, DESK, or LEAD. A join contains a hyphen. A span has a space.
 * A stub is four characters or fewer. A scroll is sixteen characters or longer. A digit contains a number.
 * A true assignee reads as SALES. A false assignee reads as NO OWNER.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_remontoire (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   winder text not null default '',
 *   limb text not null default '',
 *   notch_no integer,
 *   ink text not null default '',
 *   swing_no integer not null default 4,
 *   tags text not null default '',
 *   wound boolean not null default false,
 *   latched boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_rhumb_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_rhumb_review (
 *   trader_id text primary key
 * );
 */


export const RMT_KEY = "crmv4-remontoire";
export const RMT_VIEW_KEY = "crmv4-remontoire-views";
export const RMT_DENSITY_KEY = "crmv4-remontoire-density";
export const RMT_PIECES = ["spring", "pawl", "wheel", "detent"] as const;

export type RemontoirePiece = (typeof RMT_PIECES)[number];

export type RemontoireInk = "blank" | "gilt" | "ivory" | "graphite";

export type RemontoireTray = "barrel" | "latch" | "coffer";

export type RemontoireDensity = "broad" | "tight";

export type RemontoireSort = "piece" | "smith";

export type Remontoire = {
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

export type RemontoireView = {
  id: string;
  name: string;
  tray: RemontoireTray;
  query: string;
  smith: string;
  ink: string;
  piece: string;
  tooth: string;
  turn: string;
};

export type RemontoireCounts = {
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

export const ROUND321_FEATURES = [
  "remontoire-save",
  "notes",
  "limb-parts",
  "gilt-ink",
  "notch-sla",
  "coffer",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "winder-sort",
  "desk-kpis",
  "limb-chart",
  "notch-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-winder",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "assignee-rhumb",
  "rhumb-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "set", "clear", "latch", "resume", "coffer", "open", "tag", "turn", "tooth", "lower", "star"] as const;

const INKS = ["gilt", "ivory", "graphite"] as const;

const NOTCH_CYCLE = [3, 6, 9, 12] as const;

const SWING_CYCLE = [4, 8, 12] as const;

const INNER = new Set(["spring", "pawl"]);

const OUTER = new Set(["wheel", "detent"]);

const HOUSE_INK = new Set(["IVORY", "GRAPHITE"]);

const AGENT_CODES = new Set(["SALES", "RETENTION", "DESK", "LEAD"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RemontoireTray {
  return raw === "latch" || raw === "coffer" ? raw : "barrel";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<RemontoireInk, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<RemontoireInk, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[wy]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Remontoire, tray: RemontoireTray): boolean {
  if (tray === "latch") return card.clicked && !card.boxed;
  if (tray === "coffer") return card.boxed;
  return !card.clicked && !card.boxed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return RMT_PIECES.indexOf(piece as RemontoirePiece);
}

function toothIndex(tooth: number): number {
  return NOTCH_CYCLE.indexOf(tooth as (typeof NOTCH_CYCLE)[number]);
}

function beatIndex(turn: number): number {
  return SWING_CYCLE.indexOf(turn as (typeof SWING_CYCLE)[number]);
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

export function remontoirePiece(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (RMT_PIECES as readonly string[]).includes(text) ? text : "";
}

/** A tooth is 4, 8, 12, or 24. Anything else stays blank. */
export function remontoireTooth(raw: unknown): 3 | 6 | 9 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9" && text !== "12") return null;
  return Number(text) as 3 | 6 | 9 | 12;
}

/** A turn is 2, 4, or 8. Anything else stays blank. */
export function remontoireTurn(raw: unknown): 4 | 8 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12") return null;
  return Number(text) as 4 | 8 | 12;
}

/** An ink is gilt, ivory, or graphite. The saved name is the upper token. */
export function remontoireInk(raw: unknown): string {
  const text = inkName(raw);
  return text ? text.toUpperCase() : "";
}

export function remontoireInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function remontoireOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Bar is the lip. Bob is the stem. Verge is the well. Crown is the vowel. */
export function remontoireBand(piece: unknown): string {
  const text = remontoirePiece(piece);
  if (!text) return "";
  if (text === "spring") return "coil";
  if (text === "pawl") return "catch";
  if (text === "wheel") return "rim";
  return "lock";
}

/** Signed distance from one piece to another along the remontoire. */
export function remontoireGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(remontoirePiece(from));
  const right = pieceIndex(remontoirePiece(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseInk(ink: unknown): boolean {
  return HOUSE_INK.has(remontoireInk(ink));
}

/** A pair turn is 4. Two and eight are not a pair. */
export function pairTurn(turn: unknown): boolean {
  return remontoireTurn(turn) === 8;
}

/** A full turn is 8. */
export function fullTurn(turn: unknown): boolean {
  return remontoireTurn(turn) === 12;
}

export function activePiece(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return remontoirePiece(text) || "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = remontoireTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = remontoireInk(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeTurn(raw: unknown): string {
  const turn = remontoireTurn(raw);
  return turn === null ? "all" : String(turn);
}

export function moveRemontoireFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ink the bench uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestInk(cards: readonly Remontoire[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "barrel") || !card.ink) continue;
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

/** Before eight, suggest three. Late morning asks for six. Afternoon asks for nine. Evening asks for twelve. A saved tooth on the bench wins, and a tie keeps the shorter tooth. */
export function suggestTooth(cards: readonly Remontoire[], hour: number): 3 | 6 | 9 | 12 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "barrel") || card.tooth === null) continue;
    seen = true;
    counts.set(card.tooth, (counts.get(card.tooth) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 9 | 12 = 3;
    let score = Number.POSITIVE_INFINITY;
    for (const tooth of NOTCH_CYCLE) {
      const count = counts.get(tooth) || 0;
      if (count < score) {
        best = tooth;
        score = count;
      }
    }
    return best;
  }
  if (hour < 6) return 3;
  if (hour < 12) return 6;
  if (hour < 18) return 9;
  return 12;
}

/** Before eight, suggest the bar. The rest of the day suggests the crown. */
export function suggestPiece(hour: number): RemontoirePiece {
  return hour < 12 ? "spring" : "detent";
}

/** The smith with the fewest unwound pieces on the bench. A tie keeps the roster order. */
export function fairSmith(cards: readonly Remontoire[], roster: string): string {
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

export function readRemontoireRules(raw: unknown): Remontoire[] {
  if (!Array.isArray(raw)) return [];
  const out: Remontoire[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Remontoire>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      smith: clip(row.smith, 24),
      piece: remontoirePiece(row.piece),
      tooth: remontoireTooth(row.tooth),
      ink: remontoireInk(row.ink),
      turn: remontoireTurn(row.turn) ?? 4,
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

export function addRemontoire(
  cards: readonly Remontoire[],
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
): Remontoire[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `w${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readRemontoireRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      smith: clip(card.smith, 24),
      piece: remontoirePiece(card.piece),
      tooth: remontoireTooth(card.tooth),
      ink: remontoireInk(card.ink),
      turn: remontoireTurn(card.turn) ?? 4,
      tags: tagsOf(card.tags),
      spun: false,
      clicked: false,
      boxed: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Remontoire[], id: string, edit: (card: Remontoire) => Remontoire): Remontoire[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editRemontoire(cards: readonly Remontoire[], id: string, title: string): Remontoire[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editRemontoireNote(cards: readonly Remontoire[], id: string, note: string): Remontoire[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleInk(ink: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(remontoireInk(ink));
  return order[(index + 1) % order.length] || "GILT";
}

export function setRemontoireInk(cards: readonly Remontoire[], id: string, ink: string): Remontoire[] {
  const next = remontoireInk(ink);
  return mapCard(cards, id, (card) => (card.ink === next ? card : { ...card, ink: next, audit: "ink" }));
}

export function setRemontoireSpin(cards: readonly Remontoire[], id: string, spun: boolean): Remontoire[] {
  return mapCard(cards, id, (card) => (card.spun === spun ? card : { ...card, spun, audit: spun ? "set" : "clear" }));
}

export function setRemontoireClick(cards: readonly Remontoire[], id: string, clicked: boolean): Remontoire[] {
  return mapCard(cards, id, (card) => (card.clicked === clicked ? card : { ...card, clicked, boxed: clicked ? false : card.boxed, audit: clicked ? "latch" : "resume" }));
}

export function setRemontoireLocker(cards: readonly Remontoire[], id: string, boxed: boolean): Remontoire[] {
  return mapCard(cards, id, (card) => (card.boxed === boxed ? card : { ...card, boxed, clicked: boxed ? false : card.clicked, audit: boxed ? "coffer" : "open" }));
}

export function setRemontoireStar(cards: readonly Remontoire[], id: string, starred: boolean): Remontoire[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addRemontoireTag(cards: readonly Remontoire[], id: string, tag: string): Remontoire[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepTooth(tooth: number | null, dir: 1 | -1): 3 | 6 | 9 | 12 {
  if (tooth === null) return dir > 0 ? 3 : 12;
  const index = toothIndex(tooth);
  const next = index < 0 ? 0 : (index + dir + NOTCH_CYCLE.length) % NOTCH_CYCLE.length;
  return NOTCH_CYCLE[next];
}

function stepTurn(turn: number, dir: 1 | -1): 4 | 8 | 12 {
  const index = beatIndex(turn);
  const next = index < 0 ? 0 : (index + dir + SWING_CYCLE.length) % SWING_CYCLE.length;
  return SWING_CYCLE[next];
}

export function liftTooth(cards: readonly Remontoire[], id: string): Remontoire[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, 1), audit: "tooth" }));
}

export function lowerTooth(cards: readonly Remontoire[], id: string): Remontoire[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, -1), audit: "lower" }));
}

export function raiseTurn(cards: readonly Remontoire[], id: string): Remontoire[] {
  return mapCard(cards, id, (card) => ({ ...card, turn: stepTurn(card.turn, 1), audit: "turn" }));
}

export function lowerTurn(cards: readonly Remontoire[], id: string): Remontoire[] {
  return mapCard(cards, id, (card) => ({ ...card, turn: stepTurn(card.turn, -1), audit: "turn" }));
}

export function setRemontoireFocused(cards: readonly Remontoire[], id: string): Remontoire[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, spun: !card.spun, audit: card.spun ? "clear" : "set" })) : [...cards];
}

export function hookRemontoireFocused(cards: readonly Remontoire[], id: string): Remontoire[] {
  return setRemontoireClick(cards, id, !cards.find((card) => card.id === id)?.clicked);
}

export function starRemontoireFocused(cards: readonly Remontoire[], id: string): Remontoire[] {
  return setRemontoireStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagRemontoireFocused(cards: readonly Remontoire[], id: string): Remontoire[] {
  return addRemontoireTag(cards, id, "w");
}

export function inkFocused(cards: readonly Remontoire[], id: string): Remontoire[] {
  const card = cards.find((item) => item.id === id);
  return card ? setRemontoireInk(cards, id, cycleInk(card.ink)) : [...cards];
}

export function liftToothFocused(cards: readonly Remontoire[], id: string): Remontoire[] {
  return liftTooth(cards, id);
}

export function lowerToothFocused(cards: readonly Remontoire[], id: string): Remontoire[] {
  return lowerTooth(cards, id);
}

export function raiseTurnFocused(cards: readonly Remontoire[], id: string): Remontoire[] {
  return raiseTurn(cards, id);
}

export function lowerTurnFocused(cards: readonly Remontoire[], id: string): Remontoire[] {
  return lowerTurn(cards, id);
}

function bulk(cards: readonly Remontoire[], ids: readonly string[], edit: (card: Remontoire) => Remontoire): Remontoire[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkRemontoireGraphite(cards: readonly Remontoire[], ids: readonly string[]): Remontoire[] {
  return bulk(cards, ids, (card) => (card.ink === "GRAPHITE" ? card : { ...card, ink: "GRAPHITE", audit: "ink" }));
}

export function bulkRemontoireSpin(cards: readonly Remontoire[], ids: readonly string[]): Remontoire[] {
  return bulk(cards, ids, (card) => (card.spun ? card : { ...card, spun: true, audit: "set" }));
}

export function bulkRemontoireLocker(cards: readonly Remontoire[], ids: readonly string[]): Remontoire[] {
  return bulk(cards, ids, (card) => (card.boxed ? card : { ...card, boxed: true, clicked: false, audit: "coffer" }));
}

export function bulkRemontoireTag(cards: readonly Remontoire[], ids: readonly string[]): Remontoire[] {
  return bulk(cards, ids, (card) => (card.tags.includes("y") ? card : { ...card, tags: tagsOf([...card.tags, "y"]), audit: "tag" }));
}

export function readRemontoireViews(raw: unknown): RemontoireView[] {
  if (!Array.isArray(raw)) return [];
  const out: RemontoireView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RemontoireView>;
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

export function addRemontoireView(views: readonly RemontoireView[], view: RemontoireView): RemontoireView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readRemontoireViews([...views, { ...view, id, name }]);
}

export function dropRemontoireView(views: readonly RemontoireView[], id: string): RemontoireView[] {
  return views.filter((view) => view.id !== id);
}

export function remontoireDensity(raw: unknown): RemontoireDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortRemontoireRules(cards: readonly Remontoire[], sort: RemontoireSort): Remontoire[] {
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

export function visibleRemontoireRules(
  cards: readonly Remontoire[],
  tray: RemontoireTray,
  query: string,
  smith: string,
  ink: string,
  piece: string,
  tooth: string,
  turn: string,
): Remontoire[] {
  const text = query.trim().toLowerCase();
  const wantSmith = clip(smith, 24).toLowerCase();
  const wantInk = ink === "all" ? "" : remontoireInk(ink);
  const wantPiece = activePiece(piece);
  const wantTooth = activeTooth(tooth);
  const wantTurn = activeTurn(turn);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.smith}`.toLowerCase().includes(text)) return false;
    if (wantSmith && card.smith.toLowerCase() !== wantSmith) return false;
    if (wantInk && card.ink !== wantInk) return false;
    if (wantPiece === "inner" && !remontoireInner(card.piece)) return false;
    if (wantPiece === "outer" && !remontoireOuter(card.piece)) return false;
    if (wantPiece !== "all" && wantPiece !== "inner" && wantPiece !== "outer" && card.piece !== wantPiece) return false;
    if (wantTooth !== "all" && String(card.tooth ?? "") !== wantTooth) return false;
    if (wantTurn !== "all" && String(card.turn) !== wantTurn) return false;
    return true;
  });
}

/** An outer piece on turn one, still unwound and not in the locker, is overdue. */
export function overdueRemontoire(card: Remontoire): boolean {
  return remontoireOuter(card.piece) && card.turn === 4 && !card.spun && !card.boxed;
}

/** No ink, the short tooth, turn two, and still on the bench. */
export function idleRemontoire(card: Remontoire): boolean {
  return !card.ink && card.tooth === 3 && card.turn === 4 && !card.spun && !card.clicked && !card.boxed;
}

/** Graphite, a tall tooth, and a full turn, still out of the locker. */
export function briskRemontoire(card: Remontoire): boolean {
  return card.ink === "IVORY" && card.tooth === 12 && card.turn === 12 && !card.boxed;
}

/** Crown, ivory, and tooth eight. */
export function restingRemontoire(card: Remontoire): boolean {
  return card.piece === "detent" && card.ink === "GRAPHITE" && card.tooth === 6;
}

/** A bar is late when the desk is already on the crown. */
export function lateRemontoire(card: Remontoire, desk: string): boolean {
  return card.piece === "spring" && remontoirePiece(desk) === "detent" && !card.spun;
}

export function remontoireCounts(cards: readonly Remontoire[], shown: readonly Remontoire[], desk: string): RemontoireCounts {
  return {
    bench: cards.filter((card) => inTray(card, "barrel")).length,
    click: cards.filter((card) => inTray(card, "latch")).length,
    locker: cards.filter((card) => inTray(card, "coffer")).length,
    spun: cards.filter((card) => card.spun).length,
    inner: cards.filter((card) => remontoireInner(card.piece)).length,
    outer: cards.filter((card) => remontoireOuter(card.piece)).length,
    wide: cards.filter((card) => card.tooth === 12).length,
    house: cards.filter((card) => houseInk(card.ink)).length,
    tooth: cards.reduce((sum, card) => sum + (card.tooth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleRemontoire).length,
    brisk: cards.filter(briskRemontoire).length,
    resting: cards.filter(restingRemontoire).length,
    overdue: cards.filter(overdueRemontoire).length,
    pair: cards.filter((card) => pairTurn(card.turn) && lateRemontoire(card, desk)).length,
  };
}

export function remontoireBars(cards: readonly Remontoire[]): { piece: string; count: number }[] {
  return RMT_PIECES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.boxed).length }));
}

export function remontoireTimeline(cards: readonly Remontoire[]): { tooth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "barrel"));
  return NOTCH_CYCLE.map((tooth) => ({ tooth, titles: open.filter((card) => card.tooth === tooth).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function remontoireSmiths(cards: readonly Remontoire[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.smith && !out.some((name) => name.toLowerCase() === card.smith.toLowerCase())) out.push(card.smith);
  }
  return out;
}

export function busiestSmith(cards: readonly Remontoire[]): string {
  const open = cards.filter((card) => inTray(card, "barrel") && !card.spun && card.smith);
  let best = "";
  let score = 0;
  for (const name of remontoireSmiths(open)) {
    const count = open.filter((card) => card.smith.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderRemontoireRules(cards: readonly Remontoire[]): string[] {
  return cards.filter(overdueRemontoire).map((card) => card.title);
}

export function remontoireCopy(card: Remontoire): string {
  return [card.title, card.smith, card.piece, card.ink, card.tooth ?? "", card.turn, card.note].filter((item) => item !== "").join(" · ");
}

export function remontoireCsv(cards: readonly Remontoire[], desk: string): string {
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
        remontoireOuter(card.piece) ? "1" : "0",
        lateRemontoire(card, desk) ? "1" : "0",
        idleRemontoire(card) ? "1" : "0",
        briskRemontoire(card) ? "1" : "0",
        restingRemontoire(card) ? "1" : "0",
        overdueRemontoire(card) ? "1" : "0",
        remontoireInner(card.piece) ? "1" : "0",
        houseInk(card.ink) ? "1" : "0",
        remontoireBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const RHB_KEY = "crmv4-rhumb-hide";
export const RHB_REVIEW_KEY = "crmv4-rhumb-review";

export type RhumbLane = "" | "house" | "join" | "span" | "digit" | "stub" | "scroll" | "vowel" | "path";

export type RhumbHue = "" | "ivory" | "graphite" | "champagne";

export type RhumbState = "" | "clear" | "set";

export type RhumbReview = "all" | "reviewed" | "fresh";

export type RhumbShape =
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

export type RhumbValue = string | { owner?: unknown; [key: string]: unknown } | null | undefined;

export type RhumbRow = { id: string; label: string; code: RhumbValue };

export type RhumbLaneLine = { lane: string; count: number };

const CODE_LANES = ["house", "join", "span", "digit", "stub", "scroll", "vowel", "path"] as const;

const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: RhumbValue): { owner?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: RhumbValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: RhumbValue): string {
  const row = codeRecord(raw);
  if (row && !("owner" in row)) return "";
  const value = row ? row.owner : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "SALES";
  if (value === false || value === "false" || value === "0" || value === 0) return "NO OWNER";
  return clip(value, 48);
}

function codeReadable(raw: RhumbValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("owner" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function rhumbState(raw: RhumbValue): RhumbState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known assignee is SALES, RETENTION, DESK, or LEAD. A join contains a hyphen. A span has a space. A stub is four characters or fewer. A scroll is sixteen characters or longer. A digit contains a number. */
export function rhumbLane(raw: RhumbValue): RhumbLane {
  if (rhumbState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (AGENT_CODES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "join";
  if (text.includes(" ")) return "span";
  if (text.length <= 4) return "stub";
  if (text.length >= 16) return "scroll";
  if (/[0-9]/.test(text)) return "digit";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "path";
}

export function rhumbHue(raw: RhumbValue): RhumbHue {
  const lane = rhumbLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "stub") return "champagne";
  if (lane === "span" || lane === "join" || lane === "scroll") return "graphite";
  return "ivory";
}

export function rhumbHouse(raw: RhumbValue): boolean {
  return rhumbLane(raw) === "house";
}

export function rhumbJoin(raw: RhumbValue): boolean {
  return rhumbLane(raw) === "join";
}

export function rhumbSpan(raw: RhumbValue): boolean {
  return rhumbLane(raw) === "span";
}

export function rhumbDigitLane(raw: RhumbValue): boolean {
  return rhumbLane(raw) === "digit";
}

export function rhumbStub(raw: RhumbValue): boolean {
  return rhumbLane(raw) === "stub";
}

export function rhumbScroll(raw: RhumbValue): boolean {
  return rhumbLane(raw) === "scroll";
}

export function rhumbVowelLane(raw: RhumbValue): boolean {
  return rhumbLane(raw) === "vowel";
}

export function rhumbPath(raw: RhumbValue): boolean {
  return rhumbLane(raw) === "path";
}

export function rhumbOpen(raw: RhumbValue): boolean {
  return rhumbState(raw) === "clear";
}

/** A code the desk can keep without a rewrite: an scroll or a house house. */
export function rhumbHeld(raw: RhumbValue): boolean {
  const lane = rhumbLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A stub, or a three-character code that is not a house, still wants a fuller name. */
export function rhumbSoon(raw: RhumbValue): boolean {
  if (rhumbState(raw) !== "set") return false;
  if (rhumbStub(raw)) return true;
  if (rhumbHouse(raw)) return false;
  return codeGiven(raw).length === 5;
}

export function rhumbLength(raw: RhumbValue): number | null {
  if (rhumbState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function rhumbEven(raw: RhumbValue): boolean {
  const length = rhumbLength(raw);
  return length !== null && length % 2 === 0;
}

export function rhumbOdd(raw: RhumbValue): boolean {
  const length = rhumbLength(raw);
  return length !== null && length % 2 === 1;
}

export function rhumbFirst(raw: RhumbValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function rhumbTail(raw: RhumbValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function rhumbCapital(raw: RhumbValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function rhumbSpace(raw: RhumbValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function rhumbVowel(raw: RhumbValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function rhumbDigit(raw: RhumbValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function rhumbLetter(raw: RhumbValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function rhumbMixed(raw: RhumbValue): boolean {
  return rhumbDigit(raw) && rhumbLetter(raw);
}

export function rhumbLower(raw: RhumbValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function rhumbUpper(raw: RhumbValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function rhumbHyphen(raw: RhumbValue): boolean {
  return codeGiven(raw).includes("-");
}

export function rhumbPeriod(raw: RhumbValue): boolean {
  return codeGiven(raw).includes(".");
}

export function rhumbStamp(raw: RhumbValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function rhumbCopy(raw: RhumbValue): string {
  return codeGiven(raw);
}

export function rhumbFamily(raw: RhumbValue): string {
  if (rhumbState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function rhumbLanes(rows: readonly RhumbRow[]): RhumbLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = rhumbLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingRhumb(rows: readonly RhumbRow[]): string {
  const lines = rhumbLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingRhumbHue(rows: readonly RhumbRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = rhumbHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneRhumbCount(rows: readonly RhumbRow[], lane: RhumbLane): number {
  return rows.filter((row) => rhumbLane(row.code) === lane).length;
}

export function rhumbShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentRhumbLanes(rows: readonly RhumbRow[]): string[] {
  return rhumbLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenRhumb(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRhumb(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRhumb(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleRhumbReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRhumbReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRhumbLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: RhumbRow, shape: RhumbShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return rhumbHouse(row.code);
  if (shape === "join") return rhumbJoin(row.code);
  if (shape === "span") return rhumbSpan(row.code);
  if (shape === "digit") return rhumbDigitLane(row.code);
  if (shape === "stub") return rhumbStub(row.code);
  if (shape === "scroll") return rhumbScroll(row.code);
  if (shape === "vowel") return rhumbVowelLane(row.code);
  if (shape === "path") return rhumbPath(row.code);
  if (shape === "open") return rhumbOpen(row.code);
  if (shape === "soon") return rhumbSoon(row.code);
  if (shape === "letter") return rhumbLetter(row.code);
  if (shape === "mixed") return rhumbMixed(row.code);
  if (shape === "upper") return rhumbUpper(row.code);
  if (shape === "lower") return rhumbLower(row.code);
  if (shape === "space") return rhumbSpace(row.code);
  if (shape === "even") return rhumbEven(row.code);
  if (shape === "odd") return rhumbOdd(row.code);
  if (shape === "tail") return rhumbTail(row.code);
  if (shape === "first") return rhumbFirst(row.code);
  if (shape === "held") return rhumbHeld(row.code);
  if (shape === "hyphen") return rhumbHyphen(row.code);
  if (shape === "period") return rhumbPeriod(row.code);
  return rhumbLane(row.code) === shape;
}

export function visibleRhumb(
  rows: readonly RhumbRow[],
  lane: string,
  hue: string,
  query: string,
  review: RhumbReview,
  reviewed: readonly string[],
  shape: RhumbShape,
): RhumbRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (rhumbState(row.code) === "") return false;
    const found = rhumbLane(row.code);
    const hueName = rhumbHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${rhumbStamp(row.code)} ${rhumbFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function rhumbLanesCsv(rows: readonly RhumbRow[]): string {
  const lines = ["lane,count"];
  for (const line of rhumbLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function rhumbRowsCsv(rows: readonly RhumbRow[], reviewed: readonly string[]): string {
  const lines = ["name,owner,stamp,family,lane,hue,length,house,join,span,stub,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(rhumbCopy(row.code)),
        rhumbStamp(row.code),
        csvCell(rhumbFamily(row.code)),
        rhumbLane(row.code),
        rhumbHue(row.code),
        rhumbLength(row.code) ?? "",
        rhumbHouse(row.code) ? "1" : "0",
        rhumbJoin(row.code) ? "1" : "0",
        rhumbSpan(row.code) ? "1" : "0",
        rhumbStub(row.code) ? "1" : "0",
        rhumbEven(row.code) ? "1" : "0",
        rhumbDigit(row.code) ? "1" : "0",
        rhumbMixed(row.code) ? "1" : "0",
        rhumbUpper(row.code) ? "1" : "0",
        rhumbVowel(row.code) ? "1" : "0",
        rhumbTail(row.code) ? "1" : "0",
        rhumbHeld(row.code) ? "1" : "0",
        rhumbSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
