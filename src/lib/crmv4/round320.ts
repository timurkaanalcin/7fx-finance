/**
 * Fusee rules for a cone kept in this browser, and snail plates read the user agent already stored on the account.
 * Pieces are cone, chain, cam, and stop. Inks are gilt, ivory, and graphite.
 * Teeth are 2, 5, 8, or 11. Turns are 2, 6, or 10.
 * A known user agent is MOZILLA, APPLE, GOOGLE, or OPERA. A join contains a hyphen. A span has a space.
 * A stub is four characters or fewer. A scroll is sixteen characters or longer. A digit contains a number.
 * A true agent reads as MOZILLA. A false agent reads as NO AGENT.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_fusee (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   smith text not null default '',
 *   piece text not null default '',
 *   tooth_no integer,
 *   ink text not null default '',
 *   turn_no integer not null default 2,
 *   tags text not null default '',
 *   spun boolean not null default false,
 *   clicked boolean not null default false,
 *   boxed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_snail_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_snail_review (
 *   trader_id text primary key
 * );
 */

export const FSE_KEY = "crmv4-fusee";
export const FSE_VIEW_KEY = "crmv4-fusee-views";
export const FSE_DENSITY_KEY = "crmv4-fusee-density";
export const FSE_PIECES = ["cone", "chain", "cam", "stop"] as const;

export type FuseePiece = (typeof FSE_PIECES)[number];

export type FuseeInk = "blank" | "gilt" | "ivory" | "graphite";

export type FuseeTray = "arbor" | "click" | "locker";

export type FuseeDensity = "broad" | "tight";

export type FuseeSort = "piece" | "smith";

export type Fusee = {
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

export type FuseeView = {
  id: string;
  name: string;
  tray: FuseeTray;
  query: string;
  smith: string;
  ink: string;
  piece: string;
  tooth: string;
  turn: string;
};

export type FuseeCounts = {
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

export const ROUND320_FEATURES = [
  "fusee-save",
  "notes",
  "piece-parts",
  "gilt-ink",
  "tooth-sla",
  "locker",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "smith-sort",
  "desk-kpis",
  "piece-chart",
  "tooth-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-smith",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "agent-snail",
  "snail-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "set", "clear", "click", "resume", "locker", "open", "tag", "turn", "tooth", "lower", "star"] as const;

const INKS = ["gilt", "ivory", "graphite"] as const;

const NOTCH_CYCLE = [2, 5, 8, 11] as const;

const SWING_CYCLE = [2, 6, 10] as const;

const INNER = new Set(["cone", "chain"]);

const OUTER = new Set(["cam", "stop"]);

const HOUSE_INK = new Set(["IVORY", "GRAPHITE"]);

const AGENT_CODES = new Set(["MOZILLA", "APPLE", "GOOGLE", "OPERA"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): FuseeTray {
  return raw === "click" || raw === "locker" ? raw : "arbor";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<FuseeInk, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<FuseeInk, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[qz]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Fusee, tray: FuseeTray): boolean {
  if (tray === "click") return card.clicked && !card.boxed;
  if (tray === "locker") return card.boxed;
  return !card.clicked && !card.boxed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return FSE_PIECES.indexOf(piece as FuseePiece);
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

export function fuseePiece(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (FSE_PIECES as readonly string[]).includes(text) ? text : "";
}

/** A tooth is 4, 8, 12, or 24. Anything else stays blank. */
export function fuseeTooth(raw: unknown): 2 | 5 | 8 | 11 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "8" && text !== "11") return null;
  return Number(text) as 2 | 5 | 8 | 11;
}

/** A turn is 2, 4, or 8. Anything else stays blank. */
export function fuseeTurn(raw: unknown): 2 | 6 | 10 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "6" && text !== "10") return null;
  return Number(text) as 2 | 6 | 10;
}

/** An ink is gilt, ivory, or graphite. The saved name is the upper token. */
export function fuseeInk(raw: unknown): string {
  const text = inkName(raw);
  return text ? text.toUpperCase() : "";
}

export function fuseeInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function fuseeOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Bar is the lip. Bob is the stem. Verge is the well. Crown is the vowel. */
export function fuseeBand(piece: unknown): string {
  const text = fuseePiece(piece);
  if (!text) return "";
  if (text === "cone") return "taper";
  if (text === "chain") return "link";
  if (text === "cam") return "drum";
  return "catch";
}

/** Signed distance from one piece to another along the fusee. */
export function fuseeGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(fuseePiece(from));
  const right = pieceIndex(fuseePiece(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseInk(ink: unknown): boolean {
  return HOUSE_INK.has(fuseeInk(ink));
}

/** A pair turn is 4. Two and eight are not a pair. */
export function pairTurn(turn: unknown): boolean {
  return fuseeTurn(turn) === 6;
}

/** A full turn is 8. */
export function fullTurn(turn: unknown): boolean {
  return fuseeTurn(turn) === 10;
}

export function activePiece(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return fuseePiece(text) || "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = fuseeTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = fuseeInk(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeTurn(raw: unknown): string {
  const turn = fuseeTurn(raw);
  return turn === null ? "all" : String(turn);
}

export function moveFuseeFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ink the bench uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestInk(cards: readonly Fusee[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "arbor") || !card.ink) continue;
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
export function suggestTooth(cards: readonly Fusee[], hour: number): 2 | 5 | 8 | 11 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "arbor") || card.tooth === null) continue;
    seen = true;
    counts.set(card.tooth, (counts.get(card.tooth) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 5 | 8 | 11 = 2;
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
  if (hour < 6) return 2;
  if (hour < 12) return 5;
  if (hour < 18) return 8;
  return 11;
}

/** Before eight, suggest the bar. The rest of the day suggests the crown. */
export function suggestPiece(hour: number): FuseePiece {
  return hour < 12 ? "cone" : "stop";
}

/** The smith with the fewest unwound pieces on the bench. A tie keeps the roster order. */
export function fairSmith(cards: readonly Fusee[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "arbor") && !card.spun);
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

export function readFuseeRules(raw: unknown): Fusee[] {
  if (!Array.isArray(raw)) return [];
  const out: Fusee[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Fusee>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      smith: clip(row.smith, 24),
      piece: fuseePiece(row.piece),
      tooth: fuseeTooth(row.tooth),
      ink: fuseeInk(row.ink),
      turn: fuseeTurn(row.turn) ?? 2,
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

export function addFusee(
  cards: readonly Fusee[],
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
): Fusee[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `w${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readFuseeRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      smith: clip(card.smith, 24),
      piece: fuseePiece(card.piece),
      tooth: fuseeTooth(card.tooth),
      ink: fuseeInk(card.ink),
      turn: fuseeTurn(card.turn) ?? 2,
      tags: tagsOf(card.tags),
      spun: false,
      clicked: false,
      boxed: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Fusee[], id: string, edit: (card: Fusee) => Fusee): Fusee[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editFusee(cards: readonly Fusee[], id: string, title: string): Fusee[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editFuseeNote(cards: readonly Fusee[], id: string, note: string): Fusee[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleInk(ink: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(fuseeInk(ink));
  return order[(index + 1) % order.length] || "GILT";
}

export function setFuseeInk(cards: readonly Fusee[], id: string, ink: string): Fusee[] {
  const next = fuseeInk(ink);
  return mapCard(cards, id, (card) => (card.ink === next ? card : { ...card, ink: next, audit: "ink" }));
}

export function setFuseeSpin(cards: readonly Fusee[], id: string, spun: boolean): Fusee[] {
  return mapCard(cards, id, (card) => (card.spun === spun ? card : { ...card, spun, audit: spun ? "set" : "clear" }));
}

export function setFuseeClick(cards: readonly Fusee[], id: string, clicked: boolean): Fusee[] {
  return mapCard(cards, id, (card) => (card.clicked === clicked ? card : { ...card, clicked, boxed: clicked ? false : card.boxed, audit: clicked ? "click" : "resume" }));
}

export function setFuseeLocker(cards: readonly Fusee[], id: string, boxed: boolean): Fusee[] {
  return mapCard(cards, id, (card) => (card.boxed === boxed ? card : { ...card, boxed, clicked: boxed ? false : card.clicked, audit: boxed ? "locker" : "open" }));
}

export function setFuseeStar(cards: readonly Fusee[], id: string, starred: boolean): Fusee[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addFuseeTag(cards: readonly Fusee[], id: string, tag: string): Fusee[] {
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
  const next = index < 0 ? 0 : (index + dir + NOTCH_CYCLE.length) % NOTCH_CYCLE.length;
  return NOTCH_CYCLE[next];
}

function stepTurn(turn: number, dir: 1 | -1): 2 | 6 | 10 {
  const index = beatIndex(turn);
  const next = index < 0 ? 0 : (index + dir + SWING_CYCLE.length) % SWING_CYCLE.length;
  return SWING_CYCLE[next];
}

export function liftTooth(cards: readonly Fusee[], id: string): Fusee[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, 1), audit: "tooth" }));
}

export function lowerTooth(cards: readonly Fusee[], id: string): Fusee[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, -1), audit: "lower" }));
}

export function raiseTurn(cards: readonly Fusee[], id: string): Fusee[] {
  return mapCard(cards, id, (card) => ({ ...card, turn: stepTurn(card.turn, 1), audit: "turn" }));
}

export function lowerTurn(cards: readonly Fusee[], id: string): Fusee[] {
  return mapCard(cards, id, (card) => ({ ...card, turn: stepTurn(card.turn, -1), audit: "turn" }));
}

export function setFuseeFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, spun: !card.spun, audit: card.spun ? "clear" : "set" })) : [...cards];
}

export function hookFuseeFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return setFuseeClick(cards, id, !cards.find((card) => card.id === id)?.clicked);
}

export function starFuseeFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return setFuseeStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagFuseeFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return addFuseeTag(cards, id, "q");
}

export function inkFocused(cards: readonly Fusee[], id: string): Fusee[] {
  const card = cards.find((item) => item.id === id);
  return card ? setFuseeInk(cards, id, cycleInk(card.ink)) : [...cards];
}

export function liftToothFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return liftTooth(cards, id);
}

export function lowerToothFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return lowerTooth(cards, id);
}

export function raiseTurnFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return raiseTurn(cards, id);
}

export function lowerTurnFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return lowerTurn(cards, id);
}

function bulk(cards: readonly Fusee[], ids: readonly string[], edit: (card: Fusee) => Fusee): Fusee[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkFuseeGraphite(cards: readonly Fusee[], ids: readonly string[]): Fusee[] {
  return bulk(cards, ids, (card) => (card.ink === "GRAPHITE" ? card : { ...card, ink: "GRAPHITE", audit: "ink" }));
}

export function bulkFuseeSpin(cards: readonly Fusee[], ids: readonly string[]): Fusee[] {
  return bulk(cards, ids, (card) => (card.spun ? card : { ...card, spun: true, audit: "set" }));
}

export function bulkFuseeLocker(cards: readonly Fusee[], ids: readonly string[]): Fusee[] {
  return bulk(cards, ids, (card) => (card.boxed ? card : { ...card, boxed: true, clicked: false, audit: "locker" }));
}

export function bulkFuseeTag(cards: readonly Fusee[], ids: readonly string[]): Fusee[] {
  return bulk(cards, ids, (card) => (card.tags.includes("z") ? card : { ...card, tags: tagsOf([...card.tags, "z"]), audit: "tag" }));
}

export function readFuseeViews(raw: unknown): FuseeView[] {
  if (!Array.isArray(raw)) return [];
  const out: FuseeView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FuseeView>;
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

export function addFuseeView(views: readonly FuseeView[], view: FuseeView): FuseeView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readFuseeViews([...views, { ...view, id, name }]);
}

export function dropFuseeView(views: readonly FuseeView[], id: string): FuseeView[] {
  return views.filter((view) => view.id !== id);
}

export function fuseeDensity(raw: unknown): FuseeDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortFuseeRules(cards: readonly Fusee[], sort: FuseeSort): Fusee[] {
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

export function visibleFuseeRules(
  cards: readonly Fusee[],
  tray: FuseeTray,
  query: string,
  smith: string,
  ink: string,
  piece: string,
  tooth: string,
  turn: string,
): Fusee[] {
  const text = query.trim().toLowerCase();
  const wantSmith = clip(smith, 24).toLowerCase();
  const wantInk = ink === "all" ? "" : fuseeInk(ink);
  const wantPiece = activePiece(piece);
  const wantTooth = activeTooth(tooth);
  const wantTurn = activeTurn(turn);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.smith}`.toLowerCase().includes(text)) return false;
    if (wantSmith && card.smith.toLowerCase() !== wantSmith) return false;
    if (wantInk && card.ink !== wantInk) return false;
    if (wantPiece === "inner" && !fuseeInner(card.piece)) return false;
    if (wantPiece === "outer" && !fuseeOuter(card.piece)) return false;
    if (wantPiece !== "all" && wantPiece !== "inner" && wantPiece !== "outer" && card.piece !== wantPiece) return false;
    if (wantTooth !== "all" && String(card.tooth ?? "") !== wantTooth) return false;
    if (wantTurn !== "all" && String(card.turn) !== wantTurn) return false;
    return true;
  });
}

/** An outer piece on turn one, still unwound and not in the locker, is overdue. */
export function overdueFusee(card: Fusee): boolean {
  return fuseeOuter(card.piece) && card.turn === 2 && !card.spun && !card.boxed;
}

/** No ink, the short tooth, turn two, and still on the bench. */
export function idleFusee(card: Fusee): boolean {
  return !card.ink && card.tooth === 2 && card.turn === 2 && !card.spun && !card.clicked && !card.boxed;
}

/** Graphite, a tall tooth, and a full turn, still out of the locker. */
export function briskFusee(card: Fusee): boolean {
  return card.ink === "IVORY" && card.tooth === 11 && card.turn === 10 && !card.boxed;
}

/** Crown, ivory, and tooth eight. */
export function restingFusee(card: Fusee): boolean {
  return card.piece === "stop" && card.ink === "GRAPHITE" && card.tooth === 5;
}

/** A bar is late when the desk is already on the crown. */
export function lateFusee(card: Fusee, desk: string): boolean {
  return card.piece === "cone" && fuseePiece(desk) === "stop" && !card.spun;
}

export function fuseeCounts(cards: readonly Fusee[], shown: readonly Fusee[], desk: string): FuseeCounts {
  return {
    bench: cards.filter((card) => inTray(card, "arbor")).length,
    click: cards.filter((card) => inTray(card, "click")).length,
    locker: cards.filter((card) => inTray(card, "locker")).length,
    spun: cards.filter((card) => card.spun).length,
    inner: cards.filter((card) => fuseeInner(card.piece)).length,
    outer: cards.filter((card) => fuseeOuter(card.piece)).length,
    wide: cards.filter((card) => card.tooth === 11).length,
    house: cards.filter((card) => houseInk(card.ink)).length,
    tooth: cards.reduce((sum, card) => sum + (card.tooth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleFusee).length,
    brisk: cards.filter(briskFusee).length,
    resting: cards.filter(restingFusee).length,
    overdue: cards.filter(overdueFusee).length,
    pair: cards.filter((card) => pairTurn(card.turn) && lateFusee(card, desk)).length,
  };
}

export function fuseeBars(cards: readonly Fusee[]): { piece: string; count: number }[] {
  return FSE_PIECES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.boxed).length }));
}

export function fuseeTimeline(cards: readonly Fusee[]): { tooth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "arbor"));
  return NOTCH_CYCLE.map((tooth) => ({ tooth, titles: open.filter((card) => card.tooth === tooth).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function fuseeSmiths(cards: readonly Fusee[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.smith && !out.some((name) => name.toLowerCase() === card.smith.toLowerCase())) out.push(card.smith);
  }
  return out;
}

export function busiestSmith(cards: readonly Fusee[]): string {
  const open = cards.filter((card) => inTray(card, "arbor") && !card.spun && card.smith);
  let best = "";
  let score = 0;
  for (const name of fuseeSmiths(open)) {
    const count = open.filter((card) => card.smith.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderFuseeRules(cards: readonly Fusee[]): string[] {
  return cards.filter(overdueFusee).map((card) => card.title);
}

export function fuseeCopy(card: Fusee): string {
  return [card.title, card.smith, card.piece, card.ink, card.tooth ?? "", card.turn, card.note].filter((item) => item !== "").join(" · ");
}

export function fuseeCsv(cards: readonly Fusee[], desk: string): string {
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
        fuseeOuter(card.piece) ? "1" : "0",
        lateFusee(card, desk) ? "1" : "0",
        idleFusee(card) ? "1" : "0",
        briskFusee(card) ? "1" : "0",
        restingFusee(card) ? "1" : "0",
        overdueFusee(card) ? "1" : "0",
        fuseeInner(card.piece) ? "1" : "0",
        houseInk(card.ink) ? "1" : "0",
        fuseeBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const SNL_KEY = "crmv4-snail-hide";
export const SNL_REVIEW_KEY = "crmv4-snail-review";

export type SnailLane = "" | "house" | "join" | "span" | "digit" | "stub" | "scroll" | "vowel" | "path";

export type SnailHue = "" | "ivory" | "graphite" | "champagne";

export type SnailState = "" | "clear" | "set";

export type SnailReview = "all" | "reviewed" | "fresh";

export type SnailShape =
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

export type SnailValue = string | { agent?: unknown; [key: string]: unknown } | null | undefined;

export type SnailRow = { id: string; label: string; code: SnailValue };

export type SnailLaneLine = { lane: string; count: number };

const CODE_LANES = ["house", "join", "span", "digit", "stub", "scroll", "vowel", "path"] as const;

const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: SnailValue): { agent?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: SnailValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: SnailValue): string {
  const row = codeRecord(raw);
  if (row && !("agent" in row)) return "";
  const value = row ? row.agent : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "MOZILLA";
  if (value === false || value === "false" || value === "0" || value === 0) return "NO AGENT";
  return clip(value, 48);
}

function codeReadable(raw: SnailValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("agent" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function snailState(raw: SnailValue): SnailState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known agent status is MOZILLA, APPLE, GOOGLE, or OPERA. A join contains a hyphen. A span has a space. A stub is three characters or fewer. A scroll is ten characters or longer. A digit contains a number. */
export function snailLane(raw: SnailValue): SnailLane {
  if (snailState(raw) !== "set") return "";
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

export function snailHue(raw: SnailValue): SnailHue {
  const lane = snailLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "stub") return "champagne";
  if (lane === "span" || lane === "join" || lane === "scroll") return "graphite";
  return "ivory";
}

export function snailHouse(raw: SnailValue): boolean {
  return snailLane(raw) === "house";
}

export function snailJoin(raw: SnailValue): boolean {
  return snailLane(raw) === "join";
}

export function snailSpan(raw: SnailValue): boolean {
  return snailLane(raw) === "span";
}

export function snailDigitLane(raw: SnailValue): boolean {
  return snailLane(raw) === "digit";
}

export function snailStub(raw: SnailValue): boolean {
  return snailLane(raw) === "stub";
}

export function snailScroll(raw: SnailValue): boolean {
  return snailLane(raw) === "scroll";
}

export function snailVowelLane(raw: SnailValue): boolean {
  return snailLane(raw) === "vowel";
}

export function snailPath(raw: SnailValue): boolean {
  return snailLane(raw) === "path";
}

export function snailOpen(raw: SnailValue): boolean {
  return snailState(raw) === "clear";
}

/** A code the desk can keep without a rewrite: an scroll or a house house. */
export function snailHeld(raw: SnailValue): boolean {
  const lane = snailLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A stub, or a three-character code that is not a house, still wants a fuller name. */
export function snailSoon(raw: SnailValue): boolean {
  if (snailState(raw) !== "set") return false;
  if (snailStub(raw)) return true;
  if (snailHouse(raw)) return false;
  return codeGiven(raw).length === 5;
}

export function snailLength(raw: SnailValue): number | null {
  if (snailState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function snailEven(raw: SnailValue): boolean {
  const length = snailLength(raw);
  return length !== null && length % 2 === 0;
}

export function snailOdd(raw: SnailValue): boolean {
  const length = snailLength(raw);
  return length !== null && length % 2 === 1;
}

export function snailFirst(raw: SnailValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function snailTail(raw: SnailValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function snailCapital(raw: SnailValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function snailSpace(raw: SnailValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function snailVowel(raw: SnailValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function snailDigit(raw: SnailValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function snailLetter(raw: SnailValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function snailMixed(raw: SnailValue): boolean {
  return snailDigit(raw) && snailLetter(raw);
}

export function snailLower(raw: SnailValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function snailUpper(raw: SnailValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function snailHyphen(raw: SnailValue): boolean {
  return codeGiven(raw).includes("-");
}

export function snailPeriod(raw: SnailValue): boolean {
  return codeGiven(raw).includes(".");
}

export function snailStamp(raw: SnailValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function snailCopy(raw: SnailValue): string {
  return codeGiven(raw);
}

export function snailFamily(raw: SnailValue): string {
  if (snailState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function snailLanes(rows: readonly SnailRow[]): SnailLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = snailLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingSnail(rows: readonly SnailRow[]): string {
  const lines = snailLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingSnailHue(rows: readonly SnailRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = snailHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneSnailCount(rows: readonly SnailRow[], lane: SnailLane): number {
  return rows.filter((row) => snailLane(row.code) === lane).length;
}

export function snailShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSnailLanes(rows: readonly SnailRow[]): string[] {
  return snailLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenSnail(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSnail(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSnail(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSnailReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSnailReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSnailLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: SnailRow, shape: SnailShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return snailHouse(row.code);
  if (shape === "join") return snailJoin(row.code);
  if (shape === "span") return snailSpan(row.code);
  if (shape === "digit") return snailDigitLane(row.code);
  if (shape === "stub") return snailStub(row.code);
  if (shape === "scroll") return snailScroll(row.code);
  if (shape === "vowel") return snailVowelLane(row.code);
  if (shape === "path") return snailPath(row.code);
  if (shape === "open") return snailOpen(row.code);
  if (shape === "soon") return snailSoon(row.code);
  if (shape === "letter") return snailLetter(row.code);
  if (shape === "mixed") return snailMixed(row.code);
  if (shape === "upper") return snailUpper(row.code);
  if (shape === "lower") return snailLower(row.code);
  if (shape === "space") return snailSpace(row.code);
  if (shape === "even") return snailEven(row.code);
  if (shape === "odd") return snailOdd(row.code);
  if (shape === "tail") return snailTail(row.code);
  if (shape === "first") return snailFirst(row.code);
  if (shape === "held") return snailHeld(row.code);
  if (shape === "hyphen") return snailHyphen(row.code);
  if (shape === "period") return snailPeriod(row.code);
  return snailLane(row.code) === shape;
}

export function visibleSnail(
  rows: readonly SnailRow[],
  lane: string,
  hue: string,
  query: string,
  review: SnailReview,
  reviewed: readonly string[],
  shape: SnailShape,
): SnailRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (snailState(row.code) === "") return false;
    const found = snailLane(row.code);
    const hueName = snailHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${snailStamp(row.code)} ${snailFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function snailLanesCsv(rows: readonly SnailRow[]): string {
  const lines = ["lane,count"];
  for (const line of snailLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function snailRowsCsv(rows: readonly SnailRow[], reviewed: readonly string[]): string {
  const lines = ["name,agent,stamp,family,lane,hue,length,house,join,span,stub,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(snailCopy(row.code)),
        snailStamp(row.code),
        csvCell(snailFamily(row.code)),
        snailLane(row.code),
        snailHue(row.code),
        snailLength(row.code) ?? "",
        snailHouse(row.code) ? "1" : "0",
        snailJoin(row.code) ? "1" : "0",
        snailSpan(row.code) ? "1" : "0",
        snailStub(row.code) ? "1" : "0",
        snailEven(row.code) ? "1" : "0",
        snailDigit(row.code) ? "1" : "0",
        snailMixed(row.code) ? "1" : "0",
        snailUpper(row.code) ? "1" : "0",
        snailVowel(row.code) ? "1" : "0",
        snailTail(row.code) ? "1" : "0",
        snailHeld(row.code) ? "1" : "0",
        snailSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
