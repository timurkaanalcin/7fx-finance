/**
 * Libella rules for a level frame kept in this browser, and sigil plates read the account login already stored on the account.
 * Legs are stem, brace, plumb, and foot. Woods are cedar, oak, and pine.
 * Rungs are 5, 10, 15, or 20. Bobs are 1, 3, or 7.
 * A known login is ALPHA, BRAVO, CEDAR, or DELTA. A dash contains a hyphen. A gap has a space.
 * A chip is two characters or fewer. A tome is fourteen characters or longer. A mark contains a number.
 * A true login mark reads as ALPHA. A false login mark reads as OPEN MARK.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_libella (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   bearer text not null default '',
 *   staff text not null default '',
 *   wood text not null default '',
 *   rung_no integer,
 *   bob_no integer not null default 1,
 *   tags text not null default '',
 *   sighted boolean not null default false,
 *   racked boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_sigil_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_sigil_review (
 *   trader_id text primary key
 * );
 */


export const LBL_KEY = "crmv4-libella";
export const LBL_VIEW_KEY = "crmv4-libella-views";
export const LBL_DENSITY_KEY = "crmv4-libella-density";
export const LBL_STAVES = ["stem", "brace", "plumb", "foot"] as const;

export type LibellaStaff = (typeof LBL_STAVES)[number];

export type LibellaWood = "blank" | "ash" | "elm" | "box";

export type LibellaTray = "yard" | "rack" | "case";

export type LibellaDensity = "broad" | "tight";

export type LibellaSort = "staff" | "bearer";

export type Libella = {
  id: string;
  title: string;
  note: string;
  bearer: string;
  staff: string;
  notch: number | null;
  wood: string;
  vane: number;
  tags: string[];
  sighted: boolean;
  racked: boolean;
  cased: boolean;
  starred: boolean;
  audit: string;
};

export type LibellaView = {
  id: string;
  name: string;
  tray: LibellaTray;
  query: string;
  bearer: string;
  wood: string;
  staff: string;
  notch: string;
  vane: string;
};

export type LibellaCounts = {
  court: number;
  rack: number;
  vault: number;
  sighted: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  notch: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND312_FEATURES = [
  "save",
  "note",
  "legs",
  "wood",
  "rung",
  "chest",
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
  "fair-level",
  "viewer",
  "suggest",
  "sla",
  "sigil",
  "sigil-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wood", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "vane", "notch", "lower", "star"] as const;

const WOODS = ["cedar", "oak", "pine"] as const;

const NOTCH_CYCLE = [5, 10, 15, 20] as const;

const VANE_CYCLE = [1, 3, 7] as const;

const INNER = new Set(["stem", "brace"]);

const OUTER = new Set(["plumb", "foot"]);

const HOUSE_WEAVE = new Set(["CEDAR", "PINE"]);

const HOUSE_STATUSES = new Set(["ALPHA", "BRAVO", "CEDAR", "DELTA"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LibellaTray {
  return raw === "rack" || raw === "case" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function woodName(raw: unknown): Exclude<LibellaWood, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WOODS as readonly string[]).includes(text) ? (text as Exclude<LibellaWood, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Libella, tray: LibellaTray): boolean {
  if (tray === "rack") return card.racked && !card.cased;
  if (tray === "case") return card.cased;
  return !card.racked && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function staffIndex(staff: string): number {
  return LBL_STAVES.indexOf(staff as LibellaStaff);
}

function notchIndex(notch: number): number {
  return NOTCH_CYCLE.indexOf(notch as (typeof NOTCH_CYCLE)[number]);
}

function vaneIndex(vane: number): number {
  return VANE_CYCLE.indexOf(vane as (typeof VANE_CYCLE)[number]);
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

export function libellaStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (LBL_STAVES as readonly string[]).includes(text) ? text : "";
}

/** A rung is 5, 10, 15, or 20. Anything else stays blank. */
export function libellaNotch(raw: unknown): 5 | 10 | 15 | 20 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "15" && text !== "20") return null;
  return Number(text) as 5 | 10 | 15 | 20;
}

/** A bob is 1, 3, or 7. Anything else stays blank. */
export function libellaVane(raw: unknown): 1 | 3 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "7") return null;
  return Number(text) as 1 | 3 | 7;
}

/** A wood is cedar, oak, or pine. The saved name is the upper token. */
export function libellaWood(raw: unknown): string {
  const text = woodName(raw);
  return text ? text.toUpperCase() : "";
}

export function libellaInner(staff: unknown): boolean {
  return INNER.has(clip(staff, 12).toLowerCase());
}

export function libellaOuter(staff: unknown): boolean {
  return OUTER.has(clip(staff, 12).toLowerCase());
}

/** Stem is the ridge. Brace is the span. Plumb is the line. Foot is the base. */
export function libellaBand(staff: unknown): string {
  const text = libellaStaff(staff);
  if (!text) return "";
  if (text === "stem") return "ridge";
  if (text === "brace") return "span";
  if (text === "plumb") return "line";
  return "base";
}

/** Signed distance from one watch to another along the libella. */
export function libellaGap(from: unknown, to: unknown): number | null {
  const left = staffIndex(libellaStaff(from));
  const right = staffIndex(libellaStaff(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseWood(wood: unknown): boolean {
  return HOUSE_WEAVE.has(libellaWood(wood));
}

/** A pair bob is 3. One and seven are not a pair. */
export function pairVane(vane: unknown): boolean {
  return libellaVane(vane) === 3;
}

/** A full bob is 7. */
export function fullVane(vane: unknown): boolean {
  return libellaVane(vane) === 7;
}

export function activeStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return libellaStaff(text) || "all";
}

export function activeNotch(raw: unknown): string {
  const notch = libellaNotch(raw);
  return notch === null ? "all" : String(notch);
}

export function activeWood(raw: unknown, allow: readonly string[]): string {
  const text = libellaWood(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeVane(raw: unknown): string {
  const vane = libellaVane(raw);
  return vane === null ? "all" : String(vane);
}

export function moveLibellaFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wood the frame uses least. A tie keeps pine, then cedar, then oak. */
export function suggestWood(cards: readonly Libella[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || !card.wood) continue;
    counts.set(card.wood, (counts.get(card.wood) || 0) + 1);
  }
  let best = "PINE";
  let score = Number.POSITIVE_INFINITY;
  for (const wood of ["PINE", "CEDAR", "OAK"]) {
    const count = counts.get(wood) || 0;
    if (count < score) {
      best = wood;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest five. Morning asks for ten. Afternoon asks for fifteen. Evening asks for twenty. A saved rung on the leg wins, and a tie keeps the taller rung. */
export function suggestNotch(cards: readonly Libella[], hour: number): 5 | 10 | 15 | 20 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "yard") || card.notch === null) continue;
    seen = true;
    counts.set(card.notch, (counts.get(card.notch) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 10 | 15 | 20 = 20;
    let score = Number.POSITIVE_INFINITY;
    for (const notch of [...NOTCH_CYCLE].reverse()) {
      const count = counts.get(notch) || 0;
      if (count < score) {
        best = notch;
        score = count;
      }
    }
    return best;
  }
  if (hour < 5) return 5;
  if (hour < 9) return 10;
  if (hour < 14) return 15;
  return 20;
}

/** Before six, suggest the stem. The rest of the day suggests the foot. */
export function suggestStaff(hour: number): LibellaStaff {
  return hour < 6 ? "stem" : "foot";
}

/** The bearer with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairBearer(cards: readonly Libella[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "yard") && !card.sighted);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readLibellaRules(raw: unknown): Libella[] {
  if (!Array.isArray(raw)) return [];
  const out: Libella[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Libella>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      bearer: clip(row.bearer, 24),
      staff: libellaStaff(row.staff),
      notch: libellaNotch(row.notch),
      wood: libellaWood(row.wood),
      vane: libellaVane(row.vane) ?? 1,
      tags: tagsOf(row.tags),
      sighted: row.sighted === true,
      racked: row.racked === true,
      cased: row.cased === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addLibella(
  cards: readonly Libella[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    bearer?: string;
    staff?: string;
    notch?: unknown;
    wood?: string;
    vane?: unknown;
    tags?: unknown;
  },
): Libella[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readLibellaRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      bearer: clip(card.bearer, 24),
      staff: libellaStaff(card.staff),
      notch: libellaNotch(card.notch),
      wood: libellaWood(card.wood),
      vane: libellaVane(card.vane) ?? 1,
      tags: tagsOf(card.tags),
      sighted: false,
      racked: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Libella[], id: string, edit: (card: Libella) => Libella): Libella[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editLibella(cards: readonly Libella[], id: string, title: string): Libella[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editLibellaNote(cards: readonly Libella[], id: string, note: string): Libella[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWood(wood: string): string {
  const order = ["", "CEDAR", "OAK", "PINE"];
  const index = order.indexOf(libellaWood(wood));
  return order[(index + 1) % order.length] || "CEDAR";
}

export function setLibellaWood(cards: readonly Libella[], id: string, wood: string): Libella[] {
  const next = libellaWood(wood);
  return mapCard(cards, id, (card) => (card.wood === next ? card : { ...card, wood: next, audit: "wood" }));
}

export function setLibellaSighted(cards: readonly Libella[], id: string, sighted: boolean): Libella[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "set" : "clear" }));
}

export function setLibellaRack(cards: readonly Libella[], id: string, racked: boolean): Libella[] {
  return mapCard(cards, id, (card) => (card.racked === racked ? card : { ...card, racked, cased: racked ? false : card.cased, audit: racked ? "sheath" : "resume" }));
}

export function setLibellaVault(cards: readonly Libella[], id: string, cased: boolean): Libella[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, racked: cased ? false : card.racked, audit: cased ? "crypt" : "open" }));
}

export function setLibellaStar(cards: readonly Libella[], id: string, starred: boolean): Libella[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addLibellaTag(cards: readonly Libella[], id: string, tag: string): Libella[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepNotch(notch: number | null, dir: 1 | -1): 5 | 10 | 15 | 20 {
  if (notch === null) return dir > 0 ? 5 : 20;
  const index = notchIndex(notch);
  const next = index < 0 ? 0 : (index + dir + NOTCH_CYCLE.length) % NOTCH_CYCLE.length;
  return NOTCH_CYCLE[next];
}

function stepVane(vane: number, dir: 1 | -1): 1 | 3 | 7 {
  const index = vaneIndex(vane);
  const next = index < 0 ? 0 : (index + dir + VANE_CYCLE.length) % VANE_CYCLE.length;
  return VANE_CYCLE[next];
}

export function liftNotch(cards: readonly Libella[], id: string): Libella[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, 1), audit: "notch" }));
}

export function lowerNotch(cards: readonly Libella[], id: string): Libella[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, -1), audit: "lower" }));
}

export function raiseVane(cards: readonly Libella[], id: string): Libella[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, 1), audit: "vane" }));
}

export function lowerVane(cards: readonly Libella[], id: string): Libella[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, -1), audit: "vane" }));
}

export function setLibellaFocused(cards: readonly Libella[], id: string): Libella[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, sighted: !card.sighted, audit: card.sighted ? "clear" : "set" })) : [...cards];
}

export function rackLibellaFocused(cards: readonly Libella[], id: string): Libella[] {
  return setLibellaRack(cards, id, !cards.find((card) => card.id === id)?.racked);
}

export function starLibellaFocused(cards: readonly Libella[], id: string): Libella[] {
  return setLibellaStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagLibellaFocused(cards: readonly Libella[], id: string): Libella[] {
  return addLibellaTag(cards, id, "c");
}

export function woodFocused(cards: readonly Libella[], id: string): Libella[] {
  const card = cards.find((item) => item.id === id);
  return card ? setLibellaWood(cards, id, cycleWood(card.wood)) : [...cards];
}

export function liftNotchFocused(cards: readonly Libella[], id: string): Libella[] {
  return liftNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Libella[], id: string): Libella[] {
  return lowerNotch(cards, id);
}

export function raiseVaneFocused(cards: readonly Libella[], id: string): Libella[] {
  return raiseVane(cards, id);
}

export function lowerVaneFocused(cards: readonly Libella[], id: string): Libella[] {
  return lowerVane(cards, id);
}

function bulk(cards: readonly Libella[], ids: readonly string[], edit: (card: Libella) => Libella): Libella[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkLibellaOak(cards: readonly Libella[], ids: readonly string[]): Libella[] {
  return bulk(cards, ids, (card) => (card.wood === "PINE" ? card : { ...card, wood: "PINE", audit: "wood" }));
}

export function bulkLibellaSighted(cards: readonly Libella[], ids: readonly string[]): Libella[] {
  return bulk(cards, ids, (card) => (card.sighted ? card : { ...card, sighted: true, audit: "set" }));
}

export function bulkLibellaVault(cards: readonly Libella[], ids: readonly string[]): Libella[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, racked: false, audit: "crypt" }));
}

export function bulkLibellaTag(cards: readonly Libella[], ids: readonly string[]): Libella[] {
  return bulk(cards, ids, (card) => (card.tags.includes("d") ? card : { ...card, tags: tagsOf([...card.tags, "d"]), audit: "tag" }));
}

export function readLibellaViews(raw: unknown): LibellaView[] {
  if (!Array.isArray(raw)) return [];
  const out: LibellaView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LibellaView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      bearer: clip(row.bearer, 24),
      wood: activeWood(row.wood, ["CEDAR", "OAK", "PINE"]),
      staff: activeStaff(row.staff),
      notch: activeNotch(row.notch),
      vane: activeVane(row.vane),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addLibellaView(views: readonly LibellaView[], view: LibellaView): LibellaView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readLibellaViews([...views, { ...view, id, name }]);
}

export function dropLibellaView(views: readonly LibellaView[], id: string): LibellaView[] {
  return views.filter((view) => view.id !== id);
}

export function libellaDensity(raw: unknown): LibellaDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortLibellaRules(cards: readonly Libella[], sort: LibellaSort): Libella[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "bearer") {
      const bearer = a.bearer.localeCompare(b.bearer);
      if (bearer) return bearer;
    } else {
      const staff = staffIndex(a.staff) - staffIndex(b.staff);
      if (staff) return staff;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleLibellaRules(
  cards: readonly Libella[],
  tray: LibellaTray,
  query: string,
  bearer: string,
  wood: string,
  staff: string,
  notch: string,
  vane: string,
): Libella[] {
  const text = query.trim().toLowerCase();
  const wantBearer = clip(bearer, 24).toLowerCase();
  const wantWood = wood === "all" ? "" : libellaWood(wood);
  const wantStaff = activeStaff(staff);
  const wantNotch = activeNotch(notch);
  const wantVane = activeVane(vane);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.bearer}`.toLowerCase().includes(text)) return false;
    if (wantBearer && card.bearer.toLowerCase() !== wantBearer) return false;
    if (wantWood && card.wood !== wantWood) return false;
    if (wantStaff === "inner" && !libellaInner(card.staff)) return false;
    if (wantStaff === "outer" && !libellaOuter(card.staff)) return false;
    if (wantStaff !== "all" && wantStaff !== "inner" && wantStaff !== "outer" && card.staff !== wantStaff) return false;
    if (wantNotch !== "all" && String(card.notch ?? "") !== wantNotch) return false;
    if (wantVane !== "all" && String(card.vane) !== wantVane) return false;
    return true;
  });
}

/** An outer leg on bob one, still unlevelled and not in the chest, is overdue. */
export function overdueLibella(card: Libella): boolean {
  return libellaOuter(card.staff) && card.vane === 1 && !card.sighted && !card.cased;
}

/** No wood, the short rung, bob one, and still on the yard. */
export function idleLibella(card: Libella): boolean {
  return !card.wood && card.notch === 5 && card.vane === 1 && !card.sighted && !card.racked && !card.cased;
}

/** Pine, a tall rung, and a full bob, still out of the chest. */
export function briskLibella(card: Libella): boolean {
  return card.wood === "PINE" && card.notch === 20 && card.vane === 7 && !card.cased;
}

/** Foot, oak, and rung ten. */
export function restingLibella(card: Libella): boolean {
  return card.staff === "foot" && card.wood === "OAK" && card.notch === 10;
}

/** A stem is late when the desk is already on the foot. */
export function lateLibella(card: Libella, desk: string): boolean {
  return card.staff === "stem" && libellaStaff(desk) === "foot" && !card.sighted;
}

export function libellaCounts(cards: readonly Libella[], shown: readonly Libella[], desk: string): LibellaCounts {
  return {
    court: cards.filter((card) => inTray(card, "yard")).length,
    rack: cards.filter((card) => inTray(card, "rack")).length,
    vault: cards.filter((card) => inTray(card, "case")).length,
    sighted: cards.filter((card) => card.sighted).length,
    inner: cards.filter((card) => libellaInner(card.staff)).length,
    outer: cards.filter((card) => libellaOuter(card.staff)).length,
    wide: cards.filter((card) => card.notch === 20).length,
    house: cards.filter((card) => houseWood(card.wood)).length,
    notch: cards.reduce((sum, card) => sum + (card.notch || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleLibella).length,
    brisk: cards.filter(briskLibella).length,
    resting: cards.filter(restingLibella).length,
    overdue: cards.filter(overdueLibella).length,
    pair: cards.filter((card) => pairVane(card.vane) && lateLibella(card, desk)).length,
  };
}

export function libellaBars(cards: readonly Libella[]): { staff: string; count: number }[] {
  return LBL_STAVES.map((staff) => ({ staff, count: cards.filter((card) => card.staff === staff && !card.cased).length }));
}

export function libellaTimeline(cards: readonly Libella[]): { notch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return NOTCH_CYCLE.map((notch) => ({ notch, titles: open.filter((card) => card.notch === notch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function libellaBearers(cards: readonly Libella[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.bearer && !out.some((name) => name.toLowerCase() === card.bearer.toLowerCase())) out.push(card.bearer);
  }
  return out;
}

export function busiestBearer(cards: readonly Libella[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.sighted && card.bearer);
  let best = "";
  let score = 0;
  for (const name of libellaBearers(open)) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderLibellaRules(cards: readonly Libella[]): string[] {
  return cards.filter(overdueLibella).map((card) => card.title);
}

export function libellaCopy(card: Libella): string {
  return [card.title, card.bearer, card.staff, card.wood, card.notch ?? "", card.vane, card.note].filter((item) => item !== "").join(" · ");
}

export function libellaCsv(cards: readonly Libella[], desk: string): string {
  const lines = ["title,leveler,leg,wood,rung,bob,tags,levelled,sling,chest,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.bearer),
        card.staff,
        card.wood,
        card.notch ?? "",
        card.vane,
        card.tags.join(" "),
        card.sighted ? "1" : "0",
        card.racked ? "1" : "0",
        card.cased ? "1" : "0",
        card.starred ? "1" : "0",
        libellaOuter(card.staff) ? "1" : "0",
        lateLibella(card, desk) ? "1" : "0",
        idleLibella(card) ? "1" : "0",
        briskLibella(card) ? "1" : "0",
        restingLibella(card) ? "1" : "0",
        overdueLibella(card) ? "1" : "0",
        libellaInner(card.staff) ? "1" : "0",
        houseWood(card.wood) ? "1" : "0",
        libellaBand(card.staff),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const SIG_KEY = "crmv4-sigil-hide";
export const SIG_REVIEW_KEY = "crmv4-sigil-review";

export type SigilLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type SigilHue = "" | "ivory" | "graphite" | "champagne";

export type SigilState = "" | "clear" | "set";

export type SigilReview = "all" | "reviewed" | "fresh";

export type SigilShape =
  | "all"
  | "house"
  | "fort"
  | "harbor"
  | "digit"
  | "spark"
  | "scroll"
  | "vowel"
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
  | "tail"
  | "first"
  | "cased"
  | "hyphen"
  | "period";

export type SigilValue = string | { accountLoginId?: unknown; [key: string]: unknown } | null | undefined;

export type SigilRow = { id: string; label: string; sigil: SigilValue };

export type SigilLaneLine = { lane: string; count: number };

const DATUM_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const DATUM_HUES = ["champagne", "ivory", "graphite"] as const;

function sigilRecord(raw: SigilValue): { accountLoginId?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function sigilBlocked(raw: SigilValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function sigilGiven(raw: SigilValue): string {
  const row = sigilRecord(raw);
  if (row && !("accountLoginId" in row)) return "";
  const value = row ? row.accountLoginId : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "ALPHA";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN MARK";
  return clip(value, 48);
}

function sigilReadable(raw: SigilValue): boolean {
  if (sigilBlocked(raw)) return false;
  const row = sigilRecord(raw);
  if (row && !("accountLoginId" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function sigilState(raw: SigilValue): SigilState {
  if (!sigilReadable(raw)) return "";
  return sigilGiven(raw) ? "set" : "clear";
}

/** A known login is ALPHA, BRAVO, CEDAR, or DELTA. A dash contains a hyphen. A gap has a space. A cipher contains a number. A chip is two characters or fewer. A tome is fourteen characters or longer. */
export function sigilLane(raw: SigilValue): SigilLane {
  if (sigilState(raw) !== "set") return "";
  const text = sigilGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (/[0-9]/.test(text)) return "digit";
  if (text.length <= 2) return "spark";
  if (text.length >= 14) return "scroll";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function sigilHue(raw: SigilValue): SigilHue {
  const lane = sigilLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function sigilHouse(raw: SigilValue): boolean {
  return sigilLane(raw) === "house";
}

export function sigilFort(raw: SigilValue): boolean {
  return sigilLane(raw) === "fort";
}

export function sigilHarbor(raw: SigilValue): boolean {
  return sigilLane(raw) === "harbor";
}

export function sigilDigitLane(raw: SigilValue): boolean {
  return sigilLane(raw) === "digit";
}

export function sigilSpark(raw: SigilValue): boolean {
  return sigilLane(raw) === "spark";
}

export function sigilScroll(raw: SigilValue): boolean {
  return sigilLane(raw) === "scroll";
}

export function sigilVowelLane(raw: SigilValue): boolean {
  return sigilLane(raw) === "vowel";
}

export function sigilPost(raw: SigilValue): boolean {
  return sigilLane(raw) === "post";
}

export function sigilOpen(raw: SigilValue): boolean {
  return sigilState(raw) === "clear";
}

/** A mark the desk can keep without a rewrite: a scroll or a house mark. */
export function sigilHeld(raw: SigilValue): boolean {
  const lane = sigilLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a mark of two characters or fewer that is not a house, still wants a fuller name. */
export function sigilSoon(raw: SigilValue): boolean {
  if (sigilState(raw) !== "set") return false;
  if (sigilSpark(raw)) return true;
  if (sigilHouse(raw)) return false;
  const length = sigilGiven(raw).length;
  return length > 0 && length <= 1;
}

export function sigilLength(raw: SigilValue): number | null {
  if (sigilState(raw) !== "set") return null;
  return sigilGiven(raw).length;
}

export function sigilEven(raw: SigilValue): boolean {
  const length = sigilLength(raw);
  return length !== null && length % 2 === 0;
}

export function sigilOdd(raw: SigilValue): boolean {
  const length = sigilLength(raw);
  return length !== null && length % 2 === 1;
}

export function sigilFirst(raw: SigilValue): boolean {
  return /^[A-Za-z]/.test(sigilGiven(raw));
}

export function sigilTail(raw: SigilValue): boolean {
  return /[0-9]$/.test(sigilGiven(raw));
}

export function sigilCapital(raw: SigilValue): boolean {
  return /[A-Z]/.test(sigilGiven(raw));
}

export function sigilSpace(raw: SigilValue): boolean {
  return sigilGiven(raw).includes(" ");
}

export function sigilVowel(raw: SigilValue): boolean {
  return /^[aeiou]/i.test(sigilGiven(raw));
}

export function sigilDigit(raw: SigilValue): boolean {
  return /[0-9]/.test(sigilGiven(raw));
}

export function sigilLetter(raw: SigilValue): boolean {
  return /[A-Za-z]/.test(sigilGiven(raw));
}

export function sigilMixed(raw: SigilValue): boolean {
  return sigilDigit(raw) && sigilLetter(raw);
}

export function sigilLower(raw: SigilValue): boolean {
  const text = sigilGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function sigilUpper(raw: SigilValue): boolean {
  const text = sigilGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function sigilHyphen(raw: SigilValue): boolean {
  return sigilGiven(raw).includes("-");
}

export function sigilPeriod(raw: SigilValue): boolean {
  return sigilGiven(raw).includes(".");
}

export function sigilStamp(raw: SigilValue): string {
  const text = sigilGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function sigilCopy(raw: SigilValue): string {
  return sigilGiven(raw);
}

export function sigilFamily(raw: SigilValue): string {
  if (sigilState(raw) !== "set") return "";
  return firstToken(sigilGiven(raw));
}

export function sigilLanes(rows: readonly SigilRow[]): SigilLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of DATUM_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = sigilLane(row.sigil);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return DATUM_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingSigil(rows: readonly SigilRow[]): string {
  const lines = sigilLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || DATUM_LANES.indexOf(a.lane as (typeof DATUM_LANES)[number]) - DATUM_LANES.indexOf(b.lane as (typeof DATUM_LANES)[number]))[0].lane;
}

export function leadingSigilHue(rows: readonly SigilRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of DATUM_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = sigilHue(row.sigil);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = DATUM_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || DATUM_HUES.indexOf(a.hue) - DATUM_HUES.indexOf(b.hue))[0].hue;
}

export function laneSigilCount(rows: readonly SigilRow[], lane: SigilLane): number {
  return rows.filter((row) => sigilLane(row.sigil) === lane).length;
}

export function sigilShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSigilLanes(rows: readonly SigilRow[]): string[] {
  return sigilLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenSigils(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSigils(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSigil(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSigilReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSigilReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSigilLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: SigilRow, shape: SigilShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return sigilHouse(row.sigil);
  if (shape === "fort") return sigilFort(row.sigil);
  if (shape === "harbor") return sigilHarbor(row.sigil);
  if (shape === "digit") return sigilDigitLane(row.sigil);
  if (shape === "spark") return sigilSpark(row.sigil);
  if (shape === "scroll") return sigilScroll(row.sigil);
  if (shape === "vowel") return sigilVowelLane(row.sigil);
  if (shape === "post") return sigilPost(row.sigil);
  if (shape === "open") return sigilOpen(row.sigil);
  if (shape === "soon") return sigilSoon(row.sigil);
  if (shape === "letter") return sigilLetter(row.sigil);
  if (shape === "mixed") return sigilMixed(row.sigil);
  if (shape === "upper") return sigilUpper(row.sigil);
  if (shape === "lower") return sigilLower(row.sigil);
  if (shape === "space") return sigilSpace(row.sigil);
  if (shape === "even") return sigilEven(row.sigil);
  if (shape === "odd") return sigilOdd(row.sigil);
  if (shape === "tail") return sigilTail(row.sigil);
  if (shape === "first") return sigilFirst(row.sigil);
  if (shape === "cased") return sigilHeld(row.sigil);
  if (shape === "hyphen") return sigilHyphen(row.sigil);
  if (shape === "period") return sigilPeriod(row.sigil);
  return sigilLane(row.sigil) === shape;
}

export function visibleSigils(
  rows: readonly SigilRow[],
  lane: string,
  hue: string,
  query: string,
  review: SigilReview,
  reviewed: readonly string[],
  shape: SigilShape,
): SigilRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (sigilState(row.sigil) === "") return false;
    const found = sigilLane(row.sigil);
    const hueName = sigilHue(row.sigil);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${sigilGiven(row.sigil)} ${sigilStamp(row.sigil)} ${sigilFamily(row.sigil)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function sigilLanesCsv(rows: readonly SigilRow[]): string {
  const lines = ["lane,count"];
  for (const line of sigilLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function sigilRowsCsv(rows: readonly SigilRow[], reviewed: readonly string[]): string {
  const lines = ["name,login,stamp,family,lane,hue,length,hall,dash,gap,chip,even,cipher,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(sigilGiven(row.sigil)),
        sigilStamp(row.sigil),
        csvCell(sigilFamily(row.sigil)),
        sigilLane(row.sigil),
        sigilHue(row.sigil),
        sigilLength(row.sigil) ?? "",
        sigilHouse(row.sigil) ? "1" : "0",
        sigilFort(row.sigil) ? "1" : "0",
        sigilHarbor(row.sigil) ? "1" : "0",
        sigilSpark(row.sigil) ? "1" : "0",
        sigilEven(row.sigil) ? "1" : "0",
        sigilDigit(row.sigil) ? "1" : "0",
        sigilMixed(row.sigil) ? "1" : "0",
        sigilUpper(row.sigil) ? "1" : "0",
        sigilVowel(row.sigil) ? "1" : "0",
        sigilTail(row.sigil) ? "1" : "0",
        sigilHeld(row.sigil) ? "1" : "0",
        sigilSoon(row.sigil) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
