/**
 * Karrusel rules for a rotating platform kept in this browser, and loxodrome plates read the desk already stored on the account.
 * Parts are carriage, arbor, platform, and collet. Inks are gilt, ivory, and graphite.
 * Teeth are 1, 4, 7, or 10. Beats are 4, 8, or 12.
 * A known desk is DAY, NIGHT, SWING, or FLOAT. A slash contains a slash. A gap has a space.
 * A stub is two characters or fewer. A scroll is eighteen characters or longer. A mark contains a number.
 * A true desk reads as DAY. A false desk reads as NO DESK.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_karrusel (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   part text not null default '',
 *   tooth_no integer,
 *   ink text not null default '',
 *   beat_no integer not null default 4,
 *   tags text not null default '',
 *   wound boolean not null default false,
 *   hooked boolean not null default false,
 *   vaulted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_loxodrome_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_loxodrome_review (
 *   trader_id text primary key
 * );
 */

export const KRS_KEY = "crmv4-karrusel";
export const KRS_VIEW_KEY = "crmv4-karrusel-views";
export const KRS_DENSITY_KEY = "crmv4-karrusel-density";
export const KRS_PARTS = ["carriage", "arbor", "platform", "collet"] as const;

export type KarruselPart = (typeof KRS_PARTS)[number];
export type KarruselInk = "blank" | "gilt" | "ivory" | "graphite";
export type KarruselTray = "bench" | "hook" | "vault";
export type KarruselDensity = "broad" | "tight";
export type KarruselSort = "part" | "keeper";

export type Karrusel = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  part: string;
  tooth: number | null;
  ink: string;
  beat: number;
  tags: string[];
  wound: boolean;
  hooked: boolean;
  vaulted: boolean;
  starred: boolean;
  audit: string;
};

export type KarruselView = {
  id: string;
  name: string;
  tray: KarruselTray;
  query: string;
  keeper: string;
  ink: string;
  part: string;
  tooth: string;
  beat: string;
};

export type KarruselCounts = {
  bench: number;
  hook: number;
  vault: number;
  wound: number;
  inner: number;
  outer: number;
  tall: number;
  quiet: number;
  tooth: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND323_FEATURES = [
  "karrusel-save",
  "notes",
  "carriage-parts",
  "gilt-ink",
  "beat-sla",
  "vault",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "keeper-sort",
  "desk-kpis",
  "carriage-chart",
  "beat-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-keeper",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "desk-loxodrome",
  "loxodrome-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "set", "clear", "hook", "resume", "vault", "open", "tag", "beat", "tooth", "lower", "star"] as const;
const INKS = ["gilt", "ivory", "graphite"] as const;
const TOOTH_CYCLE = [1, 4, 7, 10] as const;
const BEAT_CYCLE = [4, 8, 12] as const;
const INNER = new Set(["carriage", "arbor"]);
const OUTER = new Set(["platform", "collet"]);
const QUIET_INK = new Set(["IVORY", "GRAPHITE"]);
const DESK_CODES = new Set(["DAY", "NIGHT", "SWING", "FLOAT"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): KarruselTray {
  return raw === "hook" || raw === "vault" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<KarruselInk, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<KarruselInk, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[kr]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Karrusel, tray: KarruselTray): boolean {
  if (tray === "hook") return card.hooked && !card.vaulted;
  if (tray === "vault") return card.vaulted;
  return !card.hooked && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function partIndex(part: string): number {
  return KRS_PARTS.indexOf(part as KarruselPart);
}

function toothIndex(tooth: number): number {
  return TOOTH_CYCLE.indexOf(tooth as (typeof TOOTH_CYCLE)[number]);
}

function beatIndex(beat: number): number {
  return BEAT_CYCLE.indexOf(beat as (typeof BEAT_CYCLE)[number]);
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

export function karruselPart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (KRS_PARTS as readonly string[]).includes(text) ? text : "";
}

/** A tooth is 1, 4, 7, or 10. Anything else stays blank. */
export function karruselTooth(raw: unknown): 1 | 4 | 7 | 10 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "4" && text !== "7" && text !== "10") return null;
  return Number(text) as 1 | 4 | 7 | 10;
}

/** A beat is 4, 8, or 12. Anything else stays blank. */
export function karruselBeat(raw: unknown): 4 | 8 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12") return null;
  return Number(text) as 4 | 8 | 12;
}

/** An ink is gilt, ivory, or graphite. The saved name is the upper token. */
export function karruselInk(raw: unknown): string {
  const text = inkName(raw);
  return text ? text.toUpperCase() : "";
}

export function karruselInner(part: unknown): boolean {
  return INNER.has(clip(part, 12).toLowerCase());
}

export function karruselOuter(part: unknown): boolean {
  return OUTER.has(clip(part, 12).toLowerCase());
}

/** Carriage is the ring. Arbor is the axle. Platform is the deck. Collet is the collar. */
export function karruselBand(part: unknown): string {
  const text = karruselPart(part);
  if (!text) return "";
  if (text === "carriage") return "ring";
  if (text === "arbor") return "axle";
  if (text === "platform") return "deck";
  return "collar";
}

/** Signed distance from one part to another along the karrusel. */
export function karruselGap(from: unknown, to: unknown): number | null {
  const left = partIndex(karruselPart(from));
  const right = partIndex(karruselPart(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietInk(ink: unknown): boolean {
  return QUIET_INK.has(karruselInk(ink));
}

/** A pair beat is 8. Four and twelve are not a pair. */
export function pairBeat(beat: unknown): boolean {
  return karruselBeat(beat) === 8;
}

/** A full beat is 12. */
export function fullBeat(beat: unknown): boolean {
  return karruselBeat(beat) === 12;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return karruselPart(text) || "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = karruselTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = karruselInk(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeBeat(raw: unknown): string {
  const beat = karruselBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function moveKarruselFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ink the bench uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestInk(cards: readonly Karrusel[]): string {
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

/** Before six, suggest one. Morning asks for four. Afternoon asks for seven. Evening asks for ten. A saved tooth on the bench wins, and a tie keeps the shorter tooth. */
export function suggestTooth(cards: readonly Karrusel[], hour: number): 1 | 4 | 7 | 10 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.tooth === null) continue;
    seen = true;
    counts.set(card.tooth, (counts.get(card.tooth) || 0) + 1);
  }
  if (seen) {
    let best: 1 | 4 | 7 | 10 = 1;
    let score = Number.POSITIVE_INFINITY;
    for (const tooth of TOOTH_CYCLE) {
      const count = counts.get(tooth) || 0;
      if (count < score) {
        best = tooth;
        score = count;
      }
    }
    return best;
  }
  if (hour < 6) return 1;
  if (hour < 12) return 4;
  if (hour < 18) return 7;
  return 10;
}

/** Before nine, suggest the carriage. The rest of the day suggests the collet. */
export function suggestPart(hour: number): KarruselPart {
  return hour < 9 ? "carriage" : "collet";
}

/** The keeper with the fewest unwound cards on the bench. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Karrusel[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.wound);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readKarruselRules(raw: unknown): Karrusel[] {
  if (!Array.isArray(raw)) return [];
  const out: Karrusel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Karrusel>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      part: karruselPart(row.part),
      tooth: karruselTooth(row.tooth),
      ink: karruselInk(row.ink),
      beat: karruselBeat(row.beat) ?? 4,
      tags: tagsOf(row.tags),
      wound: row.wound === true,
      hooked: row.hooked === true,
      vaulted: row.vaulted === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addKarrusel(
  cards: readonly Karrusel[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    part?: string;
    tooth?: unknown;
    ink?: string;
    beat?: unknown;
    tags?: unknown;
  },
): Karrusel[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `k${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readKarruselRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      part: karruselPart(card.part),
      tooth: karruselTooth(card.tooth),
      ink: karruselInk(card.ink),
      beat: karruselBeat(card.beat) ?? 4,
      tags: tagsOf(card.tags),
      wound: false,
      hooked: false,
      vaulted: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Karrusel[], id: string, edit: (card: Karrusel) => Karrusel): Karrusel[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editKarrusel(cards: readonly Karrusel[], id: string, title: string): Karrusel[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editKarruselNote(cards: readonly Karrusel[], id: string, note: string): Karrusel[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleInk(ink: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(karruselInk(ink));
  return order[(index + 1) % order.length] || "GILT";
}

export function setKarruselInk(cards: readonly Karrusel[], id: string, ink: string): Karrusel[] {
  const next = karruselInk(ink);
  return mapCard(cards, id, (card) => (card.ink === next ? card : { ...card, ink: next, audit: "ink" }));
}

export function setKarruselWind(cards: readonly Karrusel[], id: string, wound: boolean): Karrusel[] {
  return mapCard(cards, id, (card) => (card.wound === wound ? card : { ...card, wound, audit: wound ? "set" : "clear" }));
}

export function setKarruselHook(cards: readonly Karrusel[], id: string, hooked: boolean): Karrusel[] {
  return mapCard(cards, id, (card) => (card.hooked === hooked ? card : { ...card, hooked, vaulted: hooked ? false : card.vaulted, audit: hooked ? "hook" : "resume" }));
}

export function setKarruselVault(cards: readonly Karrusel[], id: string, vaulted: boolean): Karrusel[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, hooked: vaulted ? false : card.hooked, audit: vaulted ? "vault" : "open" }));
}

export function setKarruselStar(cards: readonly Karrusel[], id: string, starred: boolean): Karrusel[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addKarruselTag(cards: readonly Karrusel[], id: string, tag: string): Karrusel[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepTooth(tooth: number | null, dir: 1 | -1): 1 | 4 | 7 | 10 {
  if (tooth === null) return dir > 0 ? 1 : 10;
  const index = toothIndex(tooth);
  const next = index < 0 ? 0 : (index + dir + TOOTH_CYCLE.length) % TOOTH_CYCLE.length;
  return TOOTH_CYCLE[next];
}

function stepBeat(beat: number, dir: 1 | -1): 4 | 8 | 12 {
  const index = beatIndex(beat);
  const next = index < 0 ? 0 : (index + dir + BEAT_CYCLE.length) % BEAT_CYCLE.length;
  return BEAT_CYCLE[next];
}

export function liftTooth(cards: readonly Karrusel[], id: string): Karrusel[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, 1), audit: "tooth" }));
}

export function lowerTooth(cards: readonly Karrusel[], id: string): Karrusel[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, -1), audit: "lower" }));
}

export function raiseBeat(cards: readonly Karrusel[], id: string): Karrusel[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, 1), audit: "beat" }));
}

export function lowerBeat(cards: readonly Karrusel[], id: string): Karrusel[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, -1), audit: "beat" }));
}

export function setKarruselFocused(cards: readonly Karrusel[], id: string): Karrusel[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, wound: !card.wound, audit: card.wound ? "clear" : "set" })) : [...cards];
}

export function hookKarruselFocused(cards: readonly Karrusel[], id: string): Karrusel[] {
  return setKarruselHook(cards, id, !cards.find((card) => card.id === id)?.hooked);
}

export function starKarruselFocused(cards: readonly Karrusel[], id: string): Karrusel[] {
  return setKarruselStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function inkFocused(cards: readonly Karrusel[], id: string): Karrusel[] {
  const card = cards.find((item) => item.id === id);
  return card ? setKarruselInk(cards, id, cycleInk(card.ink)) : [...cards];
}

export function liftToothFocused(cards: readonly Karrusel[], id: string): Karrusel[] {
  return liftTooth(cards, id);
}

export function lowerToothFocused(cards: readonly Karrusel[], id: string): Karrusel[] {
  return lowerTooth(cards, id);
}

export function raiseBeatFocused(cards: readonly Karrusel[], id: string): Karrusel[] {
  return raiseBeat(cards, id);
}

export function lowerBeatFocused(cards: readonly Karrusel[], id: string): Karrusel[] {
  return lowerBeat(cards, id);
}

function bulk(cards: readonly Karrusel[], ids: readonly string[], edit: (card: Karrusel) => Karrusel): Karrusel[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkKarruselGraphite(cards: readonly Karrusel[], ids: readonly string[]): Karrusel[] {
  return bulk(cards, ids, (card) => (card.ink === "GRAPHITE" ? card : { ...card, ink: "GRAPHITE", audit: "ink" }));
}

export function bulkKarruselWind(cards: readonly Karrusel[], ids: readonly string[]): Karrusel[] {
  return bulk(cards, ids, (card) => (card.wound ? card : { ...card, wound: true, audit: "set" }));
}

export function bulkKarruselVault(cards: readonly Karrusel[], ids: readonly string[]): Karrusel[] {
  return bulk(cards, ids, (card) => (card.vaulted ? card : { ...card, vaulted: true, hooked: false, audit: "vault" }));
}

export function bulkKarruselTag(cards: readonly Karrusel[], ids: readonly string[]): Karrusel[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readKarruselViews(raw: unknown): KarruselView[] {
  if (!Array.isArray(raw)) return [];
  const out: KarruselView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KarruselView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      ink: activeInk(row.ink, ["GILT", "IVORY", "GRAPHITE"]),
      part: activePart(row.part),
      tooth: activeTooth(row.tooth),
      beat: activeBeat(row.beat),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addKarruselView(views: readonly KarruselView[], view: KarruselView): KarruselView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readKarruselViews([...views, { ...view, id, name }]);
}

export function dropKarruselView(views: readonly KarruselView[], id: string): KarruselView[] {
  return views.filter((view) => view.id !== id);
}

export function karruselDensity(raw: unknown): KarruselDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortKarruselRules(cards: readonly Karrusel[], sort: KarruselSort): Karrusel[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    } else {
      const part = partIndex(a.part) - partIndex(b.part);
      if (part) return part;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleKarruselRules(
  cards: readonly Karrusel[],
  tray: KarruselTray,
  query: string,
  keeper: string,
  ink: string,
  part: string,
  tooth: string,
  beat: string,
): Karrusel[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantInk = ink === "all" ? "" : karruselInk(ink);
  const wantPart = activePart(part);
  const wantTooth = activeTooth(tooth);
  const wantBeat = activeBeat(beat);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantInk && card.ink !== wantInk) return false;
    if (wantPart === "inner" && !karruselInner(card.part)) return false;
    if (wantPart === "outer" && !karruselOuter(card.part)) return false;
    if (wantPart !== "all" && wantPart !== "inner" && wantPart !== "outer" && card.part !== wantPart) return false;
    if (wantTooth !== "all" && String(card.tooth ?? "") !== wantTooth) return false;
    if (wantBeat !== "all" && String(card.beat) !== wantBeat) return false;
    return true;
  });
}

/** An outer part on beat four, still unwound and not in the vault, is overdue. */
export function overdueKarrusel(card: Karrusel): boolean {
  return karruselOuter(card.part) && card.beat === 4 && !card.wound && !card.vaulted;
}

/** No ink, the short tooth, beat four, and still on the bench. */
export function idleKarrusel(card: Karrusel): boolean {
  return !card.ink && card.tooth === 1 && card.beat === 4 && !card.wound && !card.hooked && !card.vaulted;
}

/** Gilt, a tall tooth, and a full beat, still out of the vault. */
export function briskKarrusel(card: Karrusel): boolean {
  return card.ink === "GILT" && card.tooth === 10 && card.beat === 12 && !card.vaulted;
}

/** Collet, ivory, and tooth four. */
export function restingKarrusel(card: Karrusel): boolean {
  return card.part === "collet" && card.ink === "IVORY" && card.tooth === 4;
}

/** A carriage is late when the desk is already on the collet. */
export function lateKarrusel(card: Karrusel, desk: string): boolean {
  return card.part === "carriage" && karruselPart(desk) === "collet" && !card.wound;
}

export function karruselCounts(cards: readonly Karrusel[], shown: readonly Karrusel[], desk: string): KarruselCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    hook: cards.filter((card) => inTray(card, "hook")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    wound: cards.filter((card) => card.wound).length,
    inner: cards.filter((card) => karruselInner(card.part)).length,
    outer: cards.filter((card) => karruselOuter(card.part)).length,
    tall: cards.filter((card) => card.tooth === 10).length,
    quiet: cards.filter((card) => quietInk(card.ink)).length,
    tooth: cards.reduce((sum, card) => sum + (card.tooth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleKarrusel).length,
    brisk: cards.filter(briskKarrusel).length,
    resting: cards.filter(restingKarrusel).length,
    overdue: cards.filter(overdueKarrusel).length,
    pair: cards.filter((card) => pairBeat(card.beat) && lateKarrusel(card, desk)).length,
  };
}

export function karruselBars(cards: readonly Karrusel[]): { part: string; count: number }[] {
  return KRS_PARTS.map((part) => ({ part, count: cards.filter((card) => card.part === part && !card.vaulted).length }));
}

export function karruselTimeline(cards: readonly Karrusel[]): { tooth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return TOOTH_CYCLE.map((tooth) => ({ tooth, titles: open.filter((card) => card.tooth === tooth).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function karruselKeepers(cards: readonly Karrusel[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestKeeper(cards: readonly Karrusel[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.wound && card.keeper);
  let best = "";
  let score = 0;
  for (const name of karruselKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderKarruselRules(cards: readonly Karrusel[]): string[] {
  return cards.filter(overdueKarrusel).map((card) => card.title);
}

export function karruselCopy(card: Karrusel): string {
  return [card.title, card.keeper, card.part, card.ink, card.tooth ?? "", card.beat, card.note].filter((item) => item !== "").join(" · ");
}

export function karruselCsv(cards: readonly Karrusel[], desk: string): string {
  const lines = ["title,keeper,part,ink,tooth,beat,tags,wound,hook,vault,starred,outer,late,idle,brisk,resting,overdue,inner,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.keeper),
        card.part,
        card.ink,
        card.tooth ?? "",
        card.beat,
        card.tags.join(" "),
        card.wound ? "1" : "0",
        card.hooked ? "1" : "0",
        card.vaulted ? "1" : "0",
        card.starred ? "1" : "0",
        karruselOuter(card.part) ? "1" : "0",
        lateKarrusel(card, desk) ? "1" : "0",
        idleKarrusel(card) ? "1" : "0",
        briskKarrusel(card) ? "1" : "0",
        restingKarrusel(card) ? "1" : "0",
        overdueKarrusel(card) ? "1" : "0",
        karruselInner(card.part) ? "1" : "0",
        quietInk(card.ink) ? "1" : "0",
        karruselBand(card.part),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const LXD_KEY = "crmv4-loxodrome-hide";
export const LXD_REVIEW_KEY = "crmv4-loxodrome-review";

export type LoxodromeLane = "" | "day" | "slash" | "gap" | "mark" | "stub" | "scroll" | "vowel" | "path";
export type LoxodromeHue = "" | "ivory" | "graphite" | "champagne";
export type LoxodromeState = "" | "clear" | "set";
export type LoxodromeReview = "all" | "reviewed" | "fresh";
export type LoxodromeShape =
  | "all"
  | "day"
  | "slash"
  | "gap"
  | "mark"
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
  | "held";

export type LoxodromeValue = string | { desk?: unknown; [key: string]: unknown } | null | undefined;
export type LoxodromeRow = { id: string; label: string; code: LoxodromeValue };
export type LoxodromeLaneLine = { lane: string; count: number };

const CODE_LANES = ["day", "slash", "gap", "mark", "stub", "scroll", "vowel", "path"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: LoxodromeValue): { desk?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: LoxodromeValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: LoxodromeValue): string {
  const row = codeRecord(raw);
  if (row && !("desk" in row)) return "";
  const value = row ? row.desk : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "DAY";
  if (value === false || value === "false" || value === "0" || value === 0) return "NO DESK";
  return clip(value, 48);
}

function codeReadable(raw: LoxodromeValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("desk" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function loxodromeState(raw: LoxodromeValue): LoxodromeState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known desk is DAY, NIGHT, SWING, or FLOAT. A slash contains a slash. A gap has a space. A stub is two characters or fewer. A scroll is eighteen characters or longer. A mark contains a number. */
export function loxodromeLane(raw: LoxodromeValue): LoxodromeLane {
  if (loxodromeState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (DESK_CODES.has(text.toUpperCase())) return "day";
  if (text.includes("/")) return "slash";
  if (text.includes(" ")) return "gap";
  if (text.length <= 2) return "stub";
  if (text.length >= 18) return "scroll";
  if (/[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "path";
}

export function loxodromeHue(raw: LoxodromeValue): LoxodromeHue {
  const lane = loxodromeLane(raw);
  if (!lane) return "";
  if (lane === "day" || lane === "mark") return "champagne";
  if (lane === "gap" || lane === "slash") return "graphite";
  return "ivory";
}

export function loxodromeDay(raw: LoxodromeValue): boolean {
  return loxodromeLane(raw) === "day";
}

export function loxodromeSlash(raw: LoxodromeValue): boolean {
  return loxodromeLane(raw) === "slash";
}

export function loxodromeGap(raw: LoxodromeValue): boolean {
  return loxodromeLane(raw) === "gap";
}

export function loxodromeMarkLane(raw: LoxodromeValue): boolean {
  return loxodromeLane(raw) === "mark";
}

export function loxodromeStub(raw: LoxodromeValue): boolean {
  return loxodromeLane(raw) === "stub";
}

export function loxodromeScroll(raw: LoxodromeValue): boolean {
  return loxodromeLane(raw) === "scroll";
}

export function loxodromeVowelLane(raw: LoxodromeValue): boolean {
  return loxodromeLane(raw) === "vowel";
}

export function loxodromePath(raw: LoxodromeValue): boolean {
  return loxodromeLane(raw) === "path";
}

export function loxodromeOpen(raw: LoxodromeValue): boolean {
  return loxodromeState(raw) === "clear";
}

/** A scroll or a vowel name can stay as written. */
export function loxodromeHeld(raw: LoxodromeValue): boolean {
  const lane = loxodromeLane(raw);
  return lane === "scroll" || lane === "vowel";
}

/** A stub, or a six-character name that is not a known desk, still wants a fuller name. */
export function loxodromeSoon(raw: LoxodromeValue): boolean {
  if (loxodromeState(raw) !== "set") return false;
  if (loxodromeStub(raw)) return true;
  if (loxodromeDay(raw)) return false;
  return codeGiven(raw).length === 6;
}

export function loxodromeLength(raw: LoxodromeValue): number | null {
  if (loxodromeState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function loxodromeEven(raw: LoxodromeValue): boolean {
  const length = loxodromeLength(raw);
  return length !== null && length % 2 === 0;
}

export function loxodromeOdd(raw: LoxodromeValue): boolean {
  const length = loxodromeLength(raw);
  return length !== null && length % 2 === 1;
}

export function loxodromeFirst(raw: LoxodromeValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function loxodromeTail(raw: LoxodromeValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function loxodromeCapital(raw: LoxodromeValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function loxodromeSpace(raw: LoxodromeValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function loxodromeVowel(raw: LoxodromeValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function loxodromeDigit(raw: LoxodromeValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function loxodromeLetter(raw: LoxodromeValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function loxodromeMixed(raw: LoxodromeValue): boolean {
  return loxodromeDigit(raw) && loxodromeLetter(raw);
}

export function loxodromeLower(raw: LoxodromeValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is six letters or more, written entirely in capitals. */
export function loxodromeUpper(raw: LoxodromeValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function loxodromeStamp(raw: LoxodromeValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function loxodromeCopy(raw: LoxodromeValue): string {
  return codeGiven(raw);
}

export function loxodromeFamily(raw: LoxodromeValue): string {
  if (loxodromeState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function loxodromeLanes(rows: readonly LoxodromeRow[]): LoxodromeLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = loxodromeLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingLoxodrome(rows: readonly LoxodromeRow[]): string {
  const lines = loxodromeLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingLoxodromeHue(rows: readonly LoxodromeRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = loxodromeHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneLoxodromeCount(rows: readonly LoxodromeRow[], lane: LoxodromeLane): number {
  return rows.filter((row) => loxodromeLane(row.code) === lane).length;
}

export function loxodromeShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentLoxodromeLanes(rows: readonly LoxodromeRow[]): string[] {
  return loxodromeLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenLoxodrome(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedLoxodrome(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleLoxodrome(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleLoxodromeReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLoxodromeReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLoxodromeLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: LoxodromeRow, shape: LoxodromeShape): boolean {
  if (shape === "all") return true;
  if (shape === "day") return loxodromeDay(row.code);
  if (shape === "slash") return loxodromeSlash(row.code);
  if (shape === "gap") return loxodromeGap(row.code);
  if (shape === "mark") return loxodromeMarkLane(row.code);
  if (shape === "stub") return loxodromeStub(row.code);
  if (shape === "scroll") return loxodromeScroll(row.code);
  if (shape === "vowel") return loxodromeVowelLane(row.code);
  if (shape === "path") return loxodromePath(row.code);
  if (shape === "open") return loxodromeOpen(row.code);
  if (shape === "soon") return loxodromeSoon(row.code);
  if (shape === "letter") return loxodromeLetter(row.code);
  if (shape === "mixed") return loxodromeMixed(row.code);
  if (shape === "upper") return loxodromeUpper(row.code);
  if (shape === "lower") return loxodromeLower(row.code);
  if (shape === "space") return loxodromeSpace(row.code);
  if (shape === "even") return loxodromeEven(row.code);
  if (shape === "odd") return loxodromeOdd(row.code);
  if (shape === "tail") return loxodromeTail(row.code);
  if (shape === "first") return loxodromeFirst(row.code);
  if (shape === "held") return loxodromeHeld(row.code);
  return loxodromeLane(row.code) === shape;
}

export function visibleLoxodrome(
  rows: readonly LoxodromeRow[],
  lane: string,
  hue: string,
  query: string,
  review: LoxodromeReview,
  reviewed: readonly string[],
  shape: LoxodromeShape,
): LoxodromeRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (loxodromeState(row.code) === "") return false;
    const found = loxodromeLane(row.code);
    const hueName = loxodromeHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${loxodromeStamp(row.code)} ${loxodromeFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function loxodromeLanesCsv(rows: readonly LoxodromeRow[]): string {
  const lines = ["lane,count"];
  for (const line of loxodromeLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function loxodromeRowsCsv(rows: readonly LoxodromeRow[], reviewed: readonly string[]): string {
  const lines = ["name,desk,stamp,family,lane,hue,length,day,slash,gap,stub,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(loxodromeCopy(row.code)),
        loxodromeStamp(row.code),
        csvCell(loxodromeFamily(row.code)),
        loxodromeLane(row.code),
        loxodromeHue(row.code),
        loxodromeLength(row.code) ?? "",
        loxodromeDay(row.code) ? "1" : "0",
        loxodromeSlash(row.code) ? "1" : "0",
        loxodromeGap(row.code) ? "1" : "0",
        loxodromeStub(row.code) ? "1" : "0",
        loxodromeEven(row.code) ? "1" : "0",
        loxodromeDigit(row.code) ? "1" : "0",
        loxodromeMixed(row.code) ? "1" : "0",
        loxodromeUpper(row.code) ? "1" : "0",
        loxodromeVowel(row.code) ? "1" : "0",
        loxodromeTail(row.code) ? "1" : "0",
        loxodromeHeld(row.code) ? "1" : "0",
        loxodromeSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
