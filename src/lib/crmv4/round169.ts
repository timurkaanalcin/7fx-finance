/**
 * Local atelier passes for document review, and the login-block notice already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_atelier_pass (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   reader text not null default '',
 *   leaf integer,
 *   room text not null default '',
 *   seal text not null default '',
 *   grade text not null default '',
 *   weight integer,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   done boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_notice_hide (
 *   notice text primary key
 * );
 */

export const PASS_KEY = "crmv4-atelier-passes";
export const PASS_VIEW_KEY = "crmv4-atelier-views";
export const NOTICE_KEY = "crmv4-notice-hide";

export type PassGrade = "blank" | "sketch" | "proof" | "press";

export type PassRoom = "blank" | "alcove" | "nave" | "choir" | "cloister";

export type PassTray = "open" | "held" | "done";

export type LeafPick = "blank" | "opening" | "middle" | "closing" | "edge" | "body";

export type PassCard = {
  id: string;
  title: string;
  note: string;
  reader: string;
  leaf: number | null;
  room: string;
  seal: string;
  grade: string;
  weight: number | null;
  pinned: boolean;
  held: boolean;
  done: boolean;
  audit: string;
};

export type PassView = {
  id: string;
  name: string;
  tray: PassTray;
  query: string;
  reader: string;
  room: string;
  seal: string;
  grade: string;
  leaf: string;
  weight: string;
};

export type PassCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  edge: number;
  late: number;
};

export type NoticePost = "" | "set" | "clear";

export type NoticeLength = "" | "slip" | "card" | "sheet";

export type NoticeClose = "" | "stop" | "ask" | "open";

export type NoticeValue =
  | {
      loginBlockedMessage?: unknown;
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
      withdrawalsEnabled?: unknown;
      isTest?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      country?: unknown;
      desk?: unknown;
    }
  | string
  | null
  | undefined;

export type NoticeRow = { notice?: NoticeValue; label?: string | null };

export type NoticeLine = { post: string; count: number };

export type LengthLine = { length: string; count: number };

export type CloseLine = { close: string; count: number };

const AUDITS = ["save", "edit", "grade", "pin", "unpin", "hold", "release", "done", "reopen", "room"] as const;

const ROOMS = ["alcove", "nave", "choir", "cloister"] as const;

const GRADES = ["sketch", "proof", "press"] as const;

const GRADE_ORDER = ["", "sketch", "proof", "press"] as const;

const PICKS = ["blank", "opening", "middle", "closing", "edge", "body"] as const;

const BANDS = ["opening", "middle", "closing"] as const;

const EDGE = new Set([1, 2, 11, 12]);

const POSTS = ["set", "clear"] as const;

const LENGTHS = ["slip", "card", "sheet"] as const;

const CLOSES = ["stop", "ask", "open"] as const;

const NOTICE_BLOCK = [
  "loginEnabled",
  "tradingEnabled",
  "withdrawalsEnabled",
  "isTest",
  "name",
  "email",
  "phone",
  "country",
  "desk",
  "saleStatus",
  "retentionStatus",
  "potentialStatus",
  "documentsStatus",
  "accountType",
  "validationStatus",
  "registrationDate",
  "birthDate",
  "lastContactAt",
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): PassTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function roomName(raw: unknown): Exclude<PassRoom, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (ROOMS as readonly string[]).includes(text) ? (text as Exclude<PassRoom, "blank">) : "";
}

function gradeName(raw: unknown): Exclude<PassGrade, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GRADES as readonly string[]).includes(text) ? (text as Exclude<PassGrade, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function passLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function passNote(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank reader stays blank. It is not filled in. */
export function readerLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank seal stays blank. It is not filled in. */
export function passSeal(raw: unknown): string {
  return clip(raw, 3);
}

/**
 * A leaf is an integer from 1 through 12.
 * A blank value stays unset. 0 and 13 are not leaves.
 * A leading zero is the same leaf: 01 is 1, and 09 is 9.
 */
export function leafOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 12) return raw;
  if (typeof raw === "string" && /^(?:[1-9]|0[1-9]|1[0-2])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A weight is an integer from 1 through 4.
 * A blank value stays unset. 0 and 5 are not weights.
 * A leading zero is the same weight: 01 is 1.
 */
export function weightOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 4) return raw;
  if (typeof raw === "string" && /^(?:[1-4]|0[1-4])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Alcove, nave, choir, cloister, or blank. Anything else is blank. */
export function roomOf(raw: unknown): PassRoom {
  return roomName(raw) || "blank";
}

/** Sketch, proof, press, or blank. Anything else is blank. */
export function gradeOf(raw: unknown): PassGrade {
  return gradeName(raw) || "blank";
}

/** Opening is 1–4. Middle is 5–8. Closing is 9–12. An unset leaf is blank. */
export function bandOf(leaf: unknown): "blank" | "opening" | "middle" | "closing" {
  const value = leafOf(leaf);
  if (value === null) return "blank";
  if (value <= 4) return "opening";
  if (value <= 8) return "middle";
  return "closing";
}

/** Edge leaves are 1, 2, 11, and 12. An unset leaf is not an edge. */
export function edgeLeaf(leaf: unknown): boolean {
  const value = leafOf(leaf);
  return value !== null && EDGE.has(value);
}

/** Body leaves are 3 through 10. An unset leaf is not body. */
export function bodyLeaf(leaf: unknown): boolean {
  const value = leafOf(leaf);
  return value !== null && !EDGE.has(value);
}

/**
 * The shortest signed step from the pass leaf to the typed leaf.
 * The quire wraps at 12. A step of 6 stays positive. A step of -6 becomes 6.
 * A positive step means the typed leaf is ahead of the pass.
 */
export function leafGap(leaf: unknown, desk: unknown): number | null {
  const from = leafOf(leaf);
  const at = leafOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 6) diff -= 12;
  if (diff < -5) diff += 12;
  return diff;
}

export function readPasses(raw: unknown): PassCard[] {
  if (!Array.isArray(raw)) return [];
  const out: PassCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PassCard>;
    const id = String(row.id || "").trim();
    const title = passLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: passNote(row.note),
      reader: readerLabel(row.reader),
      leaf: leafOf(row.leaf),
      room: roomName(row.room),
      seal: passSeal(row.seal),
      grade: gradeName(row.grade),
      weight: weightOf(row.weight),
      pinned: row.pinned === true,
      held: row.held === true,
      done: row.done === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 10);
}

export function addPass(
  cards: readonly PassCard[],
  card: { id: string; title: string; note?: string; reader?: string; leaf?: unknown; room?: string; seal?: string; grade?: string; weight?: unknown },
): PassCard[] {
  const current = readPasses(cards);
  const id = String(card.id || "").trim();
  const title = passLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: PassCard = {
    id,
    title,
    note: passNote(card.note),
    reader: readerLabel(card.reader),
    leaf: leafOf(card.leaf),
    room: roomName(card.room),
    seal: passSeal(card.seal),
    grade: gradeName(card.grade),
    weight: weightOf(card.weight),
    pinned: false,
    held: false,
    done: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 10);
}

/** Blank becomes sketch. Sketch becomes proof, proof becomes press, and press returns to sketch. */
export function cyclePassGrade(cards: readonly PassCard[], id: string): PassCard[] {
  return readPasses(cards).map((card) => {
    if (card.id !== id) return card;
    const at = GRADE_ORDER.indexOf(card.grade as (typeof GRADE_ORDER)[number]);
    const next = at < 0 || at >= GRADES.length ? GRADES[0] : GRADES[at % GRADES.length];
    if (!next || next === card.grade) return card;
    return { ...card, grade: next, audit: "grade" };
  });
}

export function setPassPin(cards: readonly PassCard[], id: string, pinned: boolean): PassCard[] {
  return readPasses(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setPassHeld(cards: readonly PassCard[], id: string, held: boolean): PassCard[] {
  return readPasses(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setPassDone(cards: readonly PassCard[], id: string, done: boolean): PassCard[] {
  return readPasses(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editPass(cards: readonly PassCard[], id: string, title: string): PassCard[] {
  const current = readPasses(cards);
  const next = passLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editPassNote(cards: readonly PassCard[], id: string, note: string): PassCard[] {
  const current = readPasses(cards);
  const next = passNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkPassPin(cards: readonly PassCard[], ids: readonly string[], pinned: boolean): PassCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readPasses(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkPassDone(cards: readonly PassCard[], ids: readonly string[], done: boolean): PassCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readPasses(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank or unknown room is left out. A pass already in that room is left as it is. */
export function bulkPassRoom(cards: readonly PassCard[], ids: readonly string[], room: string): PassCard[] {
  const name = roomName(room);
  const current = readPasses(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.room !== name ? { ...card, room: name, audit: "room" } : card));
}

export function resetPasses(): PassCard[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function passCopy(raw: unknown): string {
  return passLine(raw);
}

function inTray(card: PassCard, tray: PassTray): boolean {
  if (tray === "done") return card.done;
  if (tray === "held") return card.held && !card.done;
  return !card.held && !card.done;
}

function leafHit(leaf: number | null, exact: number | null, pick: LeafPick | null): boolean {
  if (exact !== null) return leaf === exact;
  if (pick === null) return true;
  if (pick === "blank") return leaf === null;
  if (pick === "edge") return edgeLeaf(leaf);
  if (pick === "body") return bodyLeaf(leaf);
  return bandOf(leaf) === pick;
}

function gradeScore(grade: string): number {
  if (grade === "press") return 3;
  if (grade === "proof") return 2;
  if (grade === "sketch") return 1;
  return 0;
}

function waitingEdge(card: PassCard): boolean {
  return edgeLeaf(card.leaf) && inTray(card, "open");
}

function haystack(card: PassCard): string {
  return `${card.title}\n${card.note}`.toLowerCase();
}

/** An open pass is late when the desk leaf is more than three leaves ahead. */
export function latePass(card: PassCard, desk: unknown): boolean {
  const gap = leafGap(card.leaf, desk);
  return inTray(card, "open") && gap !== null && gap > 3;
}

/** Search matches the title and the note. The reader, the leaf, the room, and the grade are not part of the query. */
export function visiblePasses(
  cards: readonly PassCard[],
  tray: PassTray,
  query: string,
  reader: string | null,
  room: PassRoom | null,
  seal: string | null,
  grade: PassGrade | null,
  exact: number | null,
  pick: LeafPick | null,
  weight: number | "blank" | null,
  pressOnly: boolean,
  edgeOnly: boolean,
): PassCard[] {
  const text = query.trim().toLowerCase();
  const wantReader = reader === null ? null : readerLabel(reader);
  const wantSeal = seal === null ? null : passSeal(seal);
  return readPasses(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (pressOnly && card.grade !== "press") return false;
      if (wantReader !== null && readerLabel(card.reader) !== wantReader) return false;
      if (room !== null && roomOf(card.room) !== room) return false;
      if (wantSeal !== null && passSeal(card.seal) !== wantSeal) return false;
      if (grade !== null && gradeOf(card.grade) !== grade) return false;
      if (!leafHit(card.leaf, exact, pick)) return false;
      if (weight === "blank" && card.weight !== null) return false;
      if (typeof weight === "number" && card.weight !== weight) return false;
      if (edgeOnly && !waitingEdge(card)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (gradeScore(a.grade) !== gradeScore(b.grade)) return gradeScore(b.grade) - gradeScore(a.grade);
      return a.title.localeCompare(b.title);
    });
}

/** The leaf orders the quire. An unset leaf stays at the end. Search matches the title and the note. */
export function passTimeline(cards: readonly PassCard[], query: string): PassCard[] {
  const text = query.trim().toLowerCase();
  return readPasses(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.leaf === null && b.leaf !== null) return 1;
      if (a.leaf !== null && b.leaf === null) return -1;
      if (a.leaf !== null && b.leaf !== null && a.leaf !== b.leaf) return a.leaf - b.leaf;
      return a.title.localeCompare(b.title);
    });
}

export function passCounts(cards: readonly PassCard[], desk: unknown): PassCounts {
  const rows = readPasses(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    edge: rows.filter((card) => waitingEdge(card)).length,
    late: rows.filter((card) => latePass(card, desk)).length,
  };
}

/** Share of the saved passes. A zero total stays at zero. */
export function passShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function passReaders(cards: readonly PassCard[]): string[] {
  const out: string[] = [];
  for (const card of readPasses(cards)) {
    if (card.reader && !out.includes(card.reader)) out.push(card.reader);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function passSeals(cards: readonly PassCard[]): string[] {
  const out: string[] = [];
  for (const card of readPasses(cards)) {
    if (card.seal && !out.includes(card.seal)) out.push(card.seal);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function passRooms(cards: readonly PassCard[]): Exclude<PassRoom, "blank">[] {
  const seen = new Set<string>();
  for (const card of readPasses(cards)) if (card.room) seen.add(card.room);
  return ROOMS.filter((room) => seen.has(room));
}

export function passGrades(cards: readonly PassCard[]): Exclude<PassGrade, "blank">[] {
  const seen = new Set<string>();
  for (const card of readPasses(cards)) if (card.grade) seen.add(card.grade);
  return GRADES.filter((grade) => seen.has(grade));
}

/** How many open passes a reader still holds. A blank reader is not a load. */
export function readerLoad(cards: readonly PassCard[], reader: string): number {
  const name = readerLabel(reader);
  if (!name) return 0;
  return readPasses(cards).filter((card) => card.reader === name && inTray(card, "open")).length;
}

/** Three bands. Index 0 is opening. Index 2 is closing. */
export function bandCounts(cards: readonly PassCard[]): number[] {
  const rows = readPasses(cards);
  return BANDS.map((band) => rows.filter((card) => bandOf(card.leaf) === band).length);
}

/** "all" and "blank" stay. A reader that is no longer on a pass falls back to all. */
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

/** "all" and "blank" stay. A room that is no longer on a pass falls back to all. */
export function activeRoom(filter: string, rooms: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const room = roomName(filter);
  return room && rooms.includes(room) ? room : "all";
}

export function roomArg(filter: string): PassRoom | null {
  if (filter === "blank") return "blank";
  return roomName(filter) || null;
}

/** "all" and "blank" stay. A seal that is no longer on a pass falls back to all. */
export function activeSeal(filter: string, seals: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const seal = passSeal(filter);
  return seal && seals.includes(seal) ? seal : "all";
}

export function sealArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return passSeal(filter);
}

/** "all" and "blank" stay. A grade that is no longer on a pass falls back to all. */
export function activeGrade(filter: string, grades: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const grade = gradeName(filter);
  return grade && grades.includes(grade) ? grade : "all";
}

export function gradeArg(filter: string): PassGrade | null {
  if (filter === "blank") return "blank";
  return gradeName(filter) || null;
}

/** All, blank, the bands, edge, body, and the leaves 1 through 12 stay. Anything else is all. */
export function activeLeaf(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const leaf = leafOf(filter);
  return leaf === null ? "all" : String(leaf);
}

export function leafArg(filter: string): { exact: number | null; pick: LeafPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as LeafPick };
  const leaf = leafOf(filter);
  return leaf === null ? { exact: null, pick: null } : { exact: leaf, pick: null };
}

/** All, blank, and the weights 1 through 4 stay. Anything else is all. */
export function activeWeight(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const weight = weightOf(filter);
  return weight === null ? "all" : String(weight);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

/** Other passes with the same room and the same leaf. A blank room or a blank leaf clashes with nothing. */
export function passClashIds(cards: readonly PassCard[], id: string): string[] {
  const rows = readPasses(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.room || card.leaf === null) return [];
  return rows
    .filter((item) => item.id !== id && item.room === card.room && item.leaf === card.leaf)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved passes share a room and a leaf with another pass. */
export function clashPassCount(cards: readonly PassCard[]): number {
  const rows = readPasses(cards);
  return rows.filter((card) => passClashIds(rows, card.id).length > 0).length;
}

/** Other passes with the same room and the same weight. A blank room or a blank weight clashes with nothing. */
export function weightClashIds(cards: readonly PassCard[], id: string): string[] {
  const rows = readPasses(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.room || card.weight === null) return [];
  return rows
    .filter((item) => item.id !== id && item.room === card.room && item.weight === card.weight)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved passes share a room and a weight with another pass. */
export function weightClashCount(cards: readonly PassCard[]): number {
  const rows = readPasses(cards);
  return rows.filter((card) => weightClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open pass at or after the leaf you type, skipping press grade.
 * After 12, the quire wraps to the earliest open pass that is not press.
 */
export function nextPass(cards: readonly PassCard[], desk: unknown): string {
  const now = leafOf(desk);
  if (now === null) return "";
  const waiting = readPasses(cards).filter((card) => inTray(card, "open") && card.leaf !== null && card.grade !== "press");
  if (!waiting.length) return "";
  const byLeaf = (a: PassCard, b: PassCard) => (a.leaf ?? 0) - (b.leaf ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.leaf ?? 0) >= now).sort(byLeaf);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byLeaf)[0].id;
}

/**
 * The room with the fewest open passes.
 * A tie keeps the earlier room: alcove, then nave, choir, and cloister.
 * Passes with no room are not a load. An empty desk still suggests alcove.
 */
export function suggestRoom(cards: readonly PassCard[]): Exclude<PassRoom, "blank"> {
  const rows = readPasses(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<PassRoom, "blank"> = "alcove";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const room of ROOMS) {
    const count = rows.filter((card) => card.room === room).length;
    if (count < bestCount) {
      best = room;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The reader with the fewest open passes.
 * A tie keeps the earlier name. A blank reader is not a candidate.
 * A desk with no named reader suggests nothing.
 */
export function suggestReader(cards: readonly PassCard[]): string {
  const rows = readPasses(cards).filter((card) => inTray(card, "open") && card.reader);
  const readers: string[] = [];
  for (const card of rows) {
    if (!readers.includes(card.reader)) readers.push(card.reader);
  }
  readers.sort((a, b) => a.localeCompare(b));
  if (!readers.length) return "";
  let best = readers[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const reader of readers) {
    const count = rows.filter((card) => card.reader === reader).length;
    if (count < bestCount) {
      best = reader;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the passes saved in this browser. The gap and the late mark use the leaf you pass. */
export function passesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,reader,leaf,room,seal,grade,weight,band,pinned,held,done,gap,late,note,audit"];
  for (const card of readPasses(raw)) {
    const gap = leafGap(card.leaf, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.reader),
      card.leaf === null ? "" : String(card.leaf),
      card.room,
      csvCell(card.seal),
      card.grade,
      card.weight === null ? "" : String(card.weight),
      bandOf(card.leaf),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.done ? "1" : "0",
      gap === null ? "" : String(gap),
      latePass(card, desk) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function readerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return readerLabel(raw) || "all";
}

function roomSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return roomName(raw) || "all";
}

function sealSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return passSeal(raw) || "all";
}

function gradeSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return gradeName(raw) || "all";
}

function weightSlot(raw: unknown): string {
  return activeWeight(String(raw ?? ""));
}

export function readPassViews(raw: unknown): PassView[] {
  if (!Array.isArray(raw)) return [];
  const out: PassView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PassView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      reader: readerSlot(row.reader),
      room: roomSlot(row.room),
      seal: sealSlot(row.seal),
      grade: gradeSlot(row.grade),
      leaf: activeLeaf(String(row.leaf ?? "")),
      weight: weightSlot(row.weight),
    });
  }
  return out.slice(0, 6);
}

export function addPassView(
  views: readonly PassView[],
  view: { id: string; name: string; tray: PassTray; query: string; reader: string; room: string; seal: string; grade: string; leaf: string; weight: string },
): PassView[] {
  const current = readPassViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    reader: readerSlot(view.reader),
    room: roomSlot(view.room),
    seal: sealSlot(view.seal),
    grade: gradeSlot(view.grade),
    leaf: activeLeaf(view.leaf),
    weight: weightSlot(view.weight),
  }].slice(0, 6);
}

export function dropPassView(views: readonly PassView[], id: string): PassView[] {
  return readPassViews(views).filter((view) => view.id !== id);
}

function noticeBody(value: NoticeValue): { text: string; explicit: boolean } | null {
  if (typeof value === "string") return { text: clip(value, 80), explicit: true };
  if (!value || typeof value !== "object") return { text: "", explicit: false };
  if (NOTICE_BLOCK.some((key) => key in value)) return null;
  if (!("loginBlockedMessage" in value)) return { text: "", explicit: false };
  const inner = value.loginBlockedMessage;
  if (typeof inner !== "string") return { text: "", explicit: false };
  return { text: clip(inner, 80), explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set notice has text. A clear notice is an explicit blank. A missing field stays unmarked.
 * A login flag, a trading flag, a name, and the other blocked fields are not a notice.
 */
export function noticePost(value: NoticeValue): NoticePost {
  const body = noticeBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/**
 * Slip is 1–16 characters. Card is 17–48. Sheet is 49–80.
 * A blank notice has no length. The text is clipped at 80 before it is measured.
 */
export function noticeLength(value: NoticeValue): NoticeLength {
  const body = noticeBody(value);
  if (!body || !body.text) return "";
  const size = body.text.length;
  if (size <= 16) return "slip";
  if (size <= 48) return "card";
  return "sheet";
}

/**
 * Stop ends with a full stop or an exclamation mark.
 * Ask ends with a question mark. Open has a letter and no closing mark.
 * A blank notice, or a notice with no letter and no closing mark, stays unmarked.
 */
export function noticeClose(value: NoticeValue): NoticeClose {
  const body = noticeBody(value);
  if (!body || !body.text) return "";
  const last = body.text.slice(-1);
  if (last === "." || last === "!") return "stop";
  if (last === "?") return "ask";
  if (/[A-Za-z]/.test(body.text)) return "open";
  return "";
}

export function postLines(rows: readonly NoticeRow[]): NoticeLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const post = noticePost(row.notice);
    map.set(post, (map.get(post) || 0) + 1);
  }
  const out: NoticeLine[] = [];
  for (const post of ["", ...POSTS]) {
    const count = map.get(post);
    if (count) out.push({ post, count });
  }
  return out;
}

export function namedPosts(rows: readonly NoticeRow[]): string[] {
  return postLines(rows).map((line) => line.post).filter(Boolean);
}

export function lengthLines(rows: readonly NoticeRow[]): LengthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const length = noticeLength(row.notice);
    map.set(length, (map.get(length) || 0) + 1);
  }
  const out: LengthLine[] = [];
  for (const length of ["", ...LENGTHS]) {
    const count = map.get(length);
    if (count) out.push({ length, count });
  }
  return out;
}

export function namedLengths(rows: readonly NoticeRow[]): string[] {
  return lengthLines(rows).map((line) => line.length).filter(Boolean);
}

export function closeLines(rows: readonly NoticeRow[]): CloseLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const close = noticeClose(row.notice);
    map.set(close, (map.get(close) || 0) + 1);
  }
  const out: CloseLine[] = [];
  for (const close of ["", ...CLOSES]) {
    const count = map.get(close);
    if (count) out.push({ close, count });
  }
  return out;
}

export function namedCloses(rows: readonly NoticeRow[]): string[] {
  return closeLines(rows).map((line) => line.close).filter(Boolean);
}

/** The named post with the most loaded rows. A tie keeps set before clear. An unmarked field is not a lead. */
export function leadingPost(rows: readonly NoticeRow[]): string {
  const named = postLines(rows).filter((line) => line.post);
  if (!named.length) return "";
  const order = (post: string) => POSTS.indexOf(post as (typeof POSTS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.post) - order(b.post))[0].post;
}

/** The closing mark with the most loaded rows. A tie keeps stop, then ask, then open. A blank notice is not a lead. */
export function leadingClose(rows: readonly NoticeRow[]): string {
  const named = closeLines(rows).filter((line) => line.close);
  if (!named.length) return "";
  const order = (close: string) => CLOSES.indexOf(close as (typeof CLOSES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.close) - order(b.close))[0].close;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function noticeShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function noticeToken(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "set" || text === "clear" || text === "blank") return text;
  return "";
}

export function presentNotices(rows: readonly NoticeRow[]): string[] {
  const out: string[] = [];
  for (const line of postLines(rows)) {
    const token = line.post || "blank";
    if (!out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenNotices(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const notice = noticeToken(item);
    if (!notice || !known.has(notice) || out.includes(notice)) continue;
    out.push(notice);
  }
  return out;
}

export function toggleNotice(hidden: readonly string[], notice: string, present: readonly string[]): string[] {
  const token = noticeToken(notice);
  if (!token || !present.includes(token)) return readHiddenNotices(hidden, present);
  const current = readHiddenNotices(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleNotices(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenNotices(hidden, present));
  return present.filter((notice) => (showHidden ? gone.has(notice) : !gone.has(notice)));
}

/** "all" and "blank" stay. A post that is no longer loaded falls back to all. */
export function activePost(filter: string, posts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (POSTS as readonly string[]).includes(filter) && posts.includes(filter) ? filter : "all";
}

export function postArg(filter: string): NoticePost | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (POSTS as readonly string[]).includes(filter) ? (filter as NoticePost) : null;
}

/** "all" and "blank" stay. A length that is no longer loaded falls back to all. */
export function activeLength(filter: string, lengths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (LENGTHS as readonly string[]).includes(filter) && lengths.includes(filter) ? filter : "all";
}

export function lengthArg(filter: string): NoticeLength | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (LENGTHS as readonly string[]).includes(filter) ? (filter as NoticeLength) : null;
}

/** "all" and "blank" stay. A close that is no longer loaded falls back to all. */
export function activeClose(filter: string, closes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (CLOSES as readonly string[]).includes(filter) && closes.includes(filter) ? filter : "all";
}

export function closeArg(filter: string): NoticeClose | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (CLOSES as readonly string[]).includes(filter) ? (filter as NoticeClose) : null;
}

/** Search stays on the name. The post, the length, and the closing mark are not part of the query. */
export function visibleNoticeCustomers<T extends NoticeRow>(
  rows: readonly T[],
  post: NoticePost | null,
  length: NoticeLength | null,
  close: NoticeClose | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (post !== null && noticePost(row.notice) !== post) return false;
    if (length !== null && noticeLength(row.notice) !== length) return false;
    if (close !== null && noticeClose(row.notice) !== close) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the posts, lengths, and closing marks on this page. */
export function noticesCsv(rows: readonly NoticeRow[]): string {
  const lines = ["kind,notice,count"];
  for (const line of postLines(rows)) lines.push(["post", csvCell(line.post), String(line.count)].join(","));
  for (const line of lengthLines(rows)) lines.push(["length", csvCell(line.length), String(line.count)].join(","));
  for (const line of closeLines(rows)) lines.push(["close", csvCell(line.close), String(line.count)].join(","));
  return lines.join("\n");
}
