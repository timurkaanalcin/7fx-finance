/**
 * Foliot rules for a limb kept in this browser, and rutter plates read the retention status already stored on the account.
 * Limbs are bar, bob, verge, and crown. Inks are gilt, ivory, and graphite.
 * Notches are 3, 6, 9, or 12. Swings are 1, 3, or 5.
 * A known retention status is ACTIVE, INACTIVE, VIP, or CHURNED. A splice contains a hyphen. A reach has a space.
 * A mark is three characters or fewer. A passage is ten characters or longer. A cipher contains a number.
 * A true status reads as ACTIVE. A false status reads as NO COURSE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_foliot (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   warden text not null default '',
 *   limb text not null default '',
 *   notch_no integer,
 *   ink text not null default '',
 *   swing_no integer not null default 1,
 *   tags text not null default '',
 *   wound boolean not null default false,
 *   hooked boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_rutter_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_rutter_review (
 *   trader_id text primary key
 * );
 */

export const FLT_KEY = "crmv4-foliot";
export const FLT_VIEW_KEY = "crmv4-foliot-views";
export const FLT_DENSITY_KEY = "crmv4-foliot-density";
export const FLT_LIMBS = ["bar", "bob", "verge", "crown"] as const;

export type FoliotLimb = (typeof FLT_LIMBS)[number];

export type FoliotInk = "blank" | "gilt" | "ivory" | "graphite";

export type FoliotTray = "bench" | "hook" | "coffer";

export type FoliotDensity = "broad" | "tight";

export type FoliotSort = "limb" | "warden";

export type Foliot = {
  id: string;
  title: string;
  note: string;
  warden: string;
  limb: string;
  notch: number | null;
  ink: string;
  swing: number;
  tags: string[];
  wound: boolean;
  hooked: boolean;
  coffered: boolean;
  starred: boolean;
  audit: string;
};

export type FoliotView = {
  id: string;
  name: string;
  tray: FoliotTray;
  query: string;
  warden: string;
  ink: string;
  limb: string;
  notch: string;
  swing: string;
};

export type FoliotCounts = {
  bench: number;
  hook: number;
  coffer: number;
  wound: number;
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

export const ROUND319_FEATURES = [
  "foliot-save",
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
  "warden-sort",
  "desk-kpis",
  "limb-chart",
  "notch-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-warden",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "retention-rutter",
  "rutter-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "set", "clear", "hook", "resume", "coffer", "open", "tag", "swing", "notch", "lower", "star"] as const;

const INKS = ["gilt", "ivory", "graphite"] as const;

const NOTCH_CYCLE = [3, 6, 9, 12] as const;

const SWING_CYCLE = [1, 3, 5] as const;

const INNER = new Set(["bar", "bob"]);

const OUTER = new Set(["verge", "crown"]);

const HOUSE_INK = new Set(["IVORY", "GILT"]);

const COURSE_CODES = new Set(["ACTIVE", "INACTIVE", "VIP", "CHURNED"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): FoliotTray {
  return raw === "hook" || raw === "coffer" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<FoliotInk, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<FoliotInk, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[fl]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Foliot, tray: FoliotTray): boolean {
  if (tray === "hook") return card.hooked && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.hooked && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(limb: string): number {
  return FLT_LIMBS.indexOf(limb as FoliotLimb);
}

function notchIndex(notch: number): number {
  return NOTCH_CYCLE.indexOf(notch as (typeof NOTCH_CYCLE)[number]);
}

function beatIndex(swing: number): number {
  return SWING_CYCLE.indexOf(swing as (typeof SWING_CYCLE)[number]);
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

export function foliotLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (FLT_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** A notch is 4, 8, 12, or 24. Anything else stays blank. */
export function foliotNotch(raw: unknown): 3 | 6 | 9 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9" && text !== "12") return null;
  return Number(text) as 3 | 6 | 9 | 12;
}

/** A swing is 2, 4, or 8. Anything else stays blank. */
export function foliotSwing(raw: unknown): 1 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "5") return null;
  return Number(text) as 1 | 3 | 5;
}

/** An ink is gilt, ivory, or graphite. The saved name is the upper token. */
export function foliotInk(raw: unknown): string {
  const text = inkName(raw);
  return text ? text.toUpperCase() : "";
}

export function foliotInner(limb: unknown): boolean {
  return INNER.has(clip(limb, 12).toLowerCase());
}

export function foliotOuter(limb: unknown): boolean {
  return OUTER.has(clip(limb, 12).toLowerCase());
}

/** Bar is the lip. Bob is the stem. Verge is the well. Crown is the inlet. */
export function foliotBand(limb: unknown): string {
  const text = foliotLimb(limb);
  if (!text) return "";
  if (text === "bar") return "beam";
  if (text === "bob") return "mass";
  if (text === "verge") return "pallet";
  return "tooth";
}

/** Signed distance from one limb to another along the foliot. */
export function foliotGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(foliotLimb(from));
  const right = limbIndex(foliotLimb(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseInk(ink: unknown): boolean {
  return HOUSE_INK.has(foliotInk(ink));
}

/** A pair swing is 4. Two and eight are not a pair. */
export function pairSwing(swing: unknown): boolean {
  return foliotSwing(swing) === 3;
}

/** A full swing is 8. */
export function fullSwing(swing: unknown): boolean {
  return foliotSwing(swing) === 5;
}

export function activeLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return foliotLimb(text) || "all";
}

export function activeNotch(raw: unknown): string {
  const notch = foliotNotch(raw);
  return notch === null ? "all" : String(notch);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = foliotInk(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeSwing(raw: unknown): string {
  const swing = foliotSwing(raw);
  return swing === null ? "all" : String(swing);
}

export function moveFoliotFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ink the bench uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestInk(cards: readonly Foliot[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.ink) continue;
    counts.set(card.ink, (counts.get(card.ink) || 0) + 1);
  }
  let best = "GRAPHITE";
  let score = Number.POSITIVE_INFINITY;
  for (const ink of ["GRAPHITE", "IVORY", "GILT"]) {
    const count = counts.get(ink) || 0;
    if (count < score) {
      best = ink;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest three. Late morning asks for six. Afternoon asks for nine. Evening asks for twelve. A saved notch on the bench wins, and a tie keeps the shorter notch. */
export function suggestNotch(cards: readonly Foliot[], hour: number): 3 | 6 | 9 | 12 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.notch === null) continue;
    seen = true;
    counts.set(card.notch, (counts.get(card.notch) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 9 | 12 = 3;
    let score = Number.POSITIVE_INFINITY;
    for (const notch of NOTCH_CYCLE) {
      const count = counts.get(notch) || 0;
      if (count < score) {
        best = notch;
        score = count;
      }
    }
    return best;
  }
  if (hour < 8) return 3;
  if (hour < 14) return 6;
  if (hour < 20) return 9;
  return 12;
}

/** Before eight, suggest the bar. The rest of the day suggests the crown. */
export function suggestLimb(hour: number): FoliotLimb {
  return hour < 8 ? "bar" : "crown";
}

/** The warden with the fewest unwound limbs on the bench. A tie keeps the roster order. */
export function fairWarden(cards: readonly Foliot[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.wound);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.warden.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readFoliotRules(raw: unknown): Foliot[] {
  if (!Array.isArray(raw)) return [];
  const out: Foliot[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Foliot>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      warden: clip(row.warden, 24),
      limb: foliotLimb(row.limb),
      notch: foliotNotch(row.notch),
      ink: foliotInk(row.ink),
      swing: foliotSwing(row.swing) ?? 1,
      tags: tagsOf(row.tags),
      wound: row.wound === true,
      hooked: row.hooked === true,
      coffered: row.coffered === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addFoliot(
  cards: readonly Foliot[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    warden?: string;
    limb?: string;
    notch?: unknown;
    ink?: string;
    swing?: unknown;
    tags?: unknown;
  },
): Foliot[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `w${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readFoliotRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      warden: clip(card.warden, 24),
      limb: foliotLimb(card.limb),
      notch: foliotNotch(card.notch),
      ink: foliotInk(card.ink),
      swing: foliotSwing(card.swing) ?? 1,
      tags: tagsOf(card.tags),
      wound: false,
      hooked: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Foliot[], id: string, edit: (card: Foliot) => Foliot): Foliot[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editFoliot(cards: readonly Foliot[], id: string, title: string): Foliot[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editFoliotNote(cards: readonly Foliot[], id: string, note: string): Foliot[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleInk(ink: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(foliotInk(ink));
  return order[(index + 1) % order.length] || "GILT";
}

export function setFoliotInk(cards: readonly Foliot[], id: string, ink: string): Foliot[] {
  const next = foliotInk(ink);
  return mapCard(cards, id, (card) => (card.ink === next ? card : { ...card, ink: next, audit: "ink" }));
}

export function setFoliotWind(cards: readonly Foliot[], id: string, wound: boolean): Foliot[] {
  return mapCard(cards, id, (card) => (card.wound === wound ? card : { ...card, wound, audit: wound ? "set" : "clear" }));
}

export function setFoliotHook(cards: readonly Foliot[], id: string, hooked: boolean): Foliot[] {
  return mapCard(cards, id, (card) => (card.hooked === hooked ? card : { ...card, hooked, coffered: hooked ? false : card.coffered, audit: hooked ? "hook" : "resume" }));
}

export function setFoliotCoffer(cards: readonly Foliot[], id: string, coffered: boolean): Foliot[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, hooked: coffered ? false : card.hooked, audit: coffered ? "coffer" : "open" }));
}

export function setFoliotStar(cards: readonly Foliot[], id: string, starred: boolean): Foliot[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addFoliotTag(cards: readonly Foliot[], id: string, tag: string): Foliot[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepNotch(notch: number | null, dir: 1 | -1): 3 | 6 | 9 | 12 {
  if (notch === null) return dir > 0 ? 3 : 12;
  const index = notchIndex(notch);
  const next = index < 0 ? 0 : (index + dir + NOTCH_CYCLE.length) % NOTCH_CYCLE.length;
  return NOTCH_CYCLE[next];
}

function stepSwing(swing: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = beatIndex(swing);
  const next = index < 0 ? 0 : (index + dir + SWING_CYCLE.length) % SWING_CYCLE.length;
  return SWING_CYCLE[next];
}

export function liftNotch(cards: readonly Foliot[], id: string): Foliot[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, 1), audit: "notch" }));
}

export function lowerNotch(cards: readonly Foliot[], id: string): Foliot[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, -1), audit: "lower" }));
}

export function raiseSwing(cards: readonly Foliot[], id: string): Foliot[] {
  return mapCard(cards, id, (card) => ({ ...card, swing: stepSwing(card.swing, 1), audit: "swing" }));
}

export function lowerSwing(cards: readonly Foliot[], id: string): Foliot[] {
  return mapCard(cards, id, (card) => ({ ...card, swing: stepSwing(card.swing, -1), audit: "swing" }));
}

export function setFoliotFocused(cards: readonly Foliot[], id: string): Foliot[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, wound: !card.wound, audit: card.wound ? "clear" : "set" })) : [...cards];
}

export function hookFoliotFocused(cards: readonly Foliot[], id: string): Foliot[] {
  return setFoliotHook(cards, id, !cards.find((card) => card.id === id)?.hooked);
}

export function starFoliotFocused(cards: readonly Foliot[], id: string): Foliot[] {
  return setFoliotStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagFoliotFocused(cards: readonly Foliot[], id: string): Foliot[] {
  return addFoliotTag(cards, id, "p");
}

export function inkFocused(cards: readonly Foliot[], id: string): Foliot[] {
  const card = cards.find((item) => item.id === id);
  return card ? setFoliotInk(cards, id, cycleInk(card.ink)) : [...cards];
}

export function liftNotchFocused(cards: readonly Foliot[], id: string): Foliot[] {
  return liftNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Foliot[], id: string): Foliot[] {
  return lowerNotch(cards, id);
}

export function raiseSwingFocused(cards: readonly Foliot[], id: string): Foliot[] {
  return raiseSwing(cards, id);
}

export function lowerSwingFocused(cards: readonly Foliot[], id: string): Foliot[] {
  return lowerSwing(cards, id);
}

function bulk(cards: readonly Foliot[], ids: readonly string[], edit: (card: Foliot) => Foliot): Foliot[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkFoliotGraphite(cards: readonly Foliot[], ids: readonly string[]): Foliot[] {
  return bulk(cards, ids, (card) => (card.ink === "GRAPHITE" ? card : { ...card, ink: "GRAPHITE", audit: "ink" }));
}

export function bulkFoliotWind(cards: readonly Foliot[], ids: readonly string[]): Foliot[] {
  return bulk(cards, ids, (card) => (card.wound ? card : { ...card, wound: true, audit: "set" }));
}

export function bulkFoliotCoffer(cards: readonly Foliot[], ids: readonly string[]): Foliot[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, hooked: false, audit: "coffer" }));
}

export function bulkFoliotTag(cards: readonly Foliot[], ids: readonly string[]): Foliot[] {
  return bulk(cards, ids, (card) => (card.tags.includes("l") ? card : { ...card, tags: tagsOf([...card.tags, "l"]), audit: "tag" }));
}

export function readFoliotViews(raw: unknown): FoliotView[] {
  if (!Array.isArray(raw)) return [];
  const out: FoliotView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FoliotView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      warden: clip(row.warden, 24),
      ink: activeInk(row.ink, ["GILT", "IVORY", "GRAPHITE"]),
      limb: activeLimb(row.limb),
      notch: activeNotch(row.notch),
      swing: activeSwing(row.swing),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addFoliotView(views: readonly FoliotView[], view: FoliotView): FoliotView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readFoliotViews([...views, { ...view, id, name }]);
}

export function dropFoliotView(views: readonly FoliotView[], id: string): FoliotView[] {
  return views.filter((view) => view.id !== id);
}

export function foliotDensity(raw: unknown): FoliotDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortFoliotRules(cards: readonly Foliot[], sort: FoliotSort): Foliot[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "warden") {
      const warden = a.warden.localeCompare(b.warden);
      if (warden) return warden;
    } else {
      const limb = limbIndex(a.limb) - limbIndex(b.limb);
      if (limb) return limb;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleFoliotRules(
  cards: readonly Foliot[],
  tray: FoliotTray,
  query: string,
  warden: string,
  ink: string,
  limb: string,
  notch: string,
  swing: string,
): Foliot[] {
  const text = query.trim().toLowerCase();
  const wantWarden = clip(warden, 24).toLowerCase();
  const wantInk = ink === "all" ? "" : foliotInk(ink);
  const wantLimb = activeLimb(limb);
  const wantNotch = activeNotch(notch);
  const wantSwing = activeSwing(swing);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.warden}`.toLowerCase().includes(text)) return false;
    if (wantWarden && card.warden.toLowerCase() !== wantWarden) return false;
    if (wantInk && card.ink !== wantInk) return false;
    if (wantLimb === "inner" && !foliotInner(card.limb)) return false;
    if (wantLimb === "outer" && !foliotOuter(card.limb)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.limb !== wantLimb) return false;
    if (wantNotch !== "all" && String(card.notch ?? "") !== wantNotch) return false;
    if (wantSwing !== "all" && String(card.swing) !== wantSwing) return false;
    return true;
  });
}

/** An outer limb on swing one, still unwound and not in the coffer, is overdue. */
export function overdueFoliot(card: Foliot): boolean {
  return foliotOuter(card.limb) && card.swing === 1 && !card.wound && !card.coffered;
}

/** No ink, the short notch, swing two, and still on the bench. */
export function idleFoliot(card: Foliot): boolean {
  return !card.ink && card.notch === 3 && card.swing === 1 && !card.wound && !card.hooked && !card.coffered;
}

/** Graphite, a tall notch, and a full swing, still out of the coffer. */
export function briskFoliot(card: Foliot): boolean {
  return card.ink === "GILT" && card.notch === 12 && card.swing === 5 && !card.coffered;
}

/** Crown, ivory, and notch eight. */
export function restingFoliot(card: Foliot): boolean {
  return card.limb === "crown" && card.ink === "IVORY" && card.notch === 6;
}

/** A bar is late when the desk is already on the crown. */
export function lateFoliot(card: Foliot, desk: string): boolean {
  return card.limb === "bar" && foliotLimb(desk) === "crown" && !card.wound;
}

export function foliotCounts(cards: readonly Foliot[], shown: readonly Foliot[], desk: string): FoliotCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    hook: cards.filter((card) => inTray(card, "hook")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    wound: cards.filter((card) => card.wound).length,
    inner: cards.filter((card) => foliotInner(card.limb)).length,
    outer: cards.filter((card) => foliotOuter(card.limb)).length,
    wide: cards.filter((card) => card.notch === 12).length,
    house: cards.filter((card) => houseInk(card.ink)).length,
    notch: cards.reduce((sum, card) => sum + (card.notch || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleFoliot).length,
    brisk: cards.filter(briskFoliot).length,
    resting: cards.filter(restingFoliot).length,
    overdue: cards.filter(overdueFoliot).length,
    pair: cards.filter((card) => pairSwing(card.swing) && lateFoliot(card, desk)).length,
  };
}

export function foliotBars(cards: readonly Foliot[]): { limb: string; count: number }[] {
  return FLT_LIMBS.map((limb) => ({ limb, count: cards.filter((card) => card.limb === limb && !card.coffered).length }));
}

export function foliotTimeline(cards: readonly Foliot[]): { notch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return NOTCH_CYCLE.map((notch) => ({ notch, titles: open.filter((card) => card.notch === notch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function foliotWardens(cards: readonly Foliot[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.warden && !out.some((name) => name.toLowerCase() === card.warden.toLowerCase())) out.push(card.warden);
  }
  return out;
}

export function busiestWarden(cards: readonly Foliot[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.wound && card.warden);
  let best = "";
  let score = 0;
  for (const name of foliotWardens(open)) {
    const count = open.filter((card) => card.warden.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderFoliotRules(cards: readonly Foliot[]): string[] {
  return cards.filter(overdueFoliot).map((card) => card.title);
}

export function foliotCopy(card: Foliot): string {
  return [card.title, card.warden, card.limb, card.ink, card.notch ?? "", card.swing, card.note].filter((item) => item !== "").join(" · ");
}

export function foliotCsv(cards: readonly Foliot[], desk: string): string {
  const lines = ["title,warden,limb,ink,notch,swing,tags,wound,hook,coffer,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.warden),
        card.limb,
        card.ink,
        card.notch ?? "",
        card.swing,
        card.tags.join(" "),
        card.wound ? "1" : "0",
        card.hooked ? "1" : "0",
        card.coffered ? "1" : "0",
        card.starred ? "1" : "0",
        foliotOuter(card.limb) ? "1" : "0",
        lateFoliot(card, desk) ? "1" : "0",
        idleFoliot(card) ? "1" : "0",
        briskFoliot(card) ? "1" : "0",
        restingFoliot(card) ? "1" : "0",
        overdueFoliot(card) ? "1" : "0",
        foliotInner(card.limb) ? "1" : "0",
        houseInk(card.ink) ? "1" : "0",
        foliotBand(card.limb),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const RTR_KEY = "crmv4-rutter-hide";
export const RTR_REVIEW_KEY = "crmv4-rutter-review";

export type RutterLane = "" | "berth" | "splice" | "reach" | "cipher" | "mark" | "passage" | "inlet" | "road";

export type RutterHue = "" | "ivory" | "graphite" | "champagne";

export type RutterState = "" | "clear" | "set";

export type RutterReview = "all" | "reviewed" | "fresh";

export type RutterShape =
  | "all"
  | "berth"
  | "splice"
  | "reach"
  | "cipher"
  | "mark"
  | "passage"
  | "inlet"
  | "road"
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

export type RutterValue = string | { retention?: unknown; [key: string]: unknown } | null | undefined;

export type RutterRow = { id: string; label: string; code: RutterValue };

export type RutterLaneLine = { lane: string; count: number };

const CODE_LANES = ["berth", "splice", "reach", "cipher", "mark", "passage", "inlet", "road"] as const;

const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: RutterValue): { retention?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: RutterValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: RutterValue): string {
  const row = codeRecord(raw);
  if (row && !("retention" in row)) return "";
  const value = row ? row.retention : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "ACTIVE";
  if (value === false || value === "false" || value === "0" || value === 0) return "NO COURSE";
  return clip(value, 48);
}

function codeReadable(raw: RutterValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("retention" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function rutterState(raw: RutterValue): RutterState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known retention status is ACTIVE, INACTIVE, VIP, or CHURNED. A splice contains a hyphen. A reach has a space. A mark is three characters or fewer. A passage is ten characters or longer. A cipher contains a number. */
export function rutterLane(raw: RutterValue): RutterLane {
  if (rutterState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (COURSE_CODES.has(text.toUpperCase())) return "berth";
  if (text.includes("-")) return "splice";
  if (text.includes(" ")) return "reach";
  if (text.length <= 3) return "mark";
  if (text.length >= 10) return "passage";
  if (/[0-9]/.test(text)) return "cipher";
  if (/^[aeiou]/i.test(text)) return "inlet";
  return "road";
}

export function rutterHue(raw: RutterValue): RutterHue {
  const lane = rutterLane(raw);
  if (!lane) return "";
  if (lane === "berth" || lane === "mark") return "champagne";
  if (lane === "reach" || lane === "splice" || lane === "passage") return "graphite";
  return "ivory";
}

export function rutterBerth(raw: RutterValue): boolean {
  return rutterLane(raw) === "berth";
}

export function rutterSplice(raw: RutterValue): boolean {
  return rutterLane(raw) === "splice";
}

export function rutterReach(raw: RutterValue): boolean {
  return rutterLane(raw) === "reach";
}

export function rutterCipherLane(raw: RutterValue): boolean {
  return rutterLane(raw) === "cipher";
}

export function rutterMark(raw: RutterValue): boolean {
  return rutterLane(raw) === "mark";
}

export function rutterPassage(raw: RutterValue): boolean {
  return rutterLane(raw) === "passage";
}

export function rutterInletLane(raw: RutterValue): boolean {
  return rutterLane(raw) === "inlet";
}

export function rutterRoad(raw: RutterValue): boolean {
  return rutterLane(raw) === "road";
}

export function rutterOpen(raw: RutterValue): boolean {
  return rutterState(raw) === "clear";
}

/** A code the desk can keep without a rewrite: an passage or a house berth. */
export function rutterHeld(raw: RutterValue): boolean {
  const lane = rutterLane(raw);
  return lane === "passage" || lane === "berth";
}

/** A mark, or a three-character code that is not a berth, still wants a fuller name. */
export function rutterSoon(raw: RutterValue): boolean {
  if (rutterState(raw) !== "set") return false;
  if (rutterMark(raw)) return true;
  if (rutterBerth(raw)) return false;
  return codeGiven(raw).length === 4;
}

export function rutterLength(raw: RutterValue): number | null {
  if (rutterState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function rutterEven(raw: RutterValue): boolean {
  const length = rutterLength(raw);
  return length !== null && length % 2 === 0;
}

export function rutterOdd(raw: RutterValue): boolean {
  const length = rutterLength(raw);
  return length !== null && length % 2 === 1;
}

export function rutterFirst(raw: RutterValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function rutterTail(raw: RutterValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function rutterCapital(raw: RutterValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function rutterSpace(raw: RutterValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function rutterInlet(raw: RutterValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function rutterCipher(raw: RutterValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function rutterLetter(raw: RutterValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function rutterMixed(raw: RutterValue): boolean {
  return rutterCipher(raw) && rutterLetter(raw);
}

export function rutterLower(raw: RutterValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function rutterUpper(raw: RutterValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function rutterHyphen(raw: RutterValue): boolean {
  return codeGiven(raw).includes("-");
}

export function rutterPeriod(raw: RutterValue): boolean {
  return codeGiven(raw).includes(".");
}

export function rutterStamp(raw: RutterValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function rutterCopy(raw: RutterValue): string {
  return codeGiven(raw);
}

export function rutterFamily(raw: RutterValue): string {
  if (rutterState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function rutterLanes(rows: readonly RutterRow[]): RutterLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = rutterLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingRutter(rows: readonly RutterRow[]): string {
  const lines = rutterLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingRutterHue(rows: readonly RutterRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = rutterHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneRutterCount(rows: readonly RutterRow[], lane: RutterLane): number {
  return rows.filter((row) => rutterLane(row.code) === lane).length;
}

export function rutterShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentRutterLanes(rows: readonly RutterRow[]): string[] {
  return rutterLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenRutter(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRutter(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRutter(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleRutterReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRutterReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRutterLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: RutterRow, shape: RutterShape): boolean {
  if (shape === "all") return true;
  if (shape === "berth") return rutterBerth(row.code);
  if (shape === "splice") return rutterSplice(row.code);
  if (shape === "reach") return rutterReach(row.code);
  if (shape === "cipher") return rutterCipherLane(row.code);
  if (shape === "mark") return rutterMark(row.code);
  if (shape === "passage") return rutterPassage(row.code);
  if (shape === "inlet") return rutterInletLane(row.code);
  if (shape === "road") return rutterRoad(row.code);
  if (shape === "open") return rutterOpen(row.code);
  if (shape === "soon") return rutterSoon(row.code);
  if (shape === "letter") return rutterLetter(row.code);
  if (shape === "mixed") return rutterMixed(row.code);
  if (shape === "upper") return rutterUpper(row.code);
  if (shape === "lower") return rutterLower(row.code);
  if (shape === "space") return rutterSpace(row.code);
  if (shape === "even") return rutterEven(row.code);
  if (shape === "odd") return rutterOdd(row.code);
  if (shape === "tail") return rutterTail(row.code);
  if (shape === "first") return rutterFirst(row.code);
  if (shape === "held") return rutterHeld(row.code);
  if (shape === "hyphen") return rutterHyphen(row.code);
  if (shape === "period") return rutterPeriod(row.code);
  return rutterLane(row.code) === shape;
}

export function visibleRutter(
  rows: readonly RutterRow[],
  lane: string,
  hue: string,
  query: string,
  review: RutterReview,
  reviewed: readonly string[],
  shape: RutterShape,
): RutterRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (rutterState(row.code) === "") return false;
    const found = rutterLane(row.code);
    const hueName = rutterHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${rutterStamp(row.code)} ${rutterFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function rutterLanesCsv(rows: readonly RutterRow[]): string {
  const lines = ["lane,count"];
  for (const line of rutterLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function rutterRowsCsv(rows: readonly RutterRow[], reviewed: readonly string[]): string {
  const lines = ["name,retention,stamp,family,lane,hue,length,berth,splice,reach,mark,even,cipher,mixed,upper,inlet,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(rutterCopy(row.code)),
        rutterStamp(row.code),
        csvCell(rutterFamily(row.code)),
        rutterLane(row.code),
        rutterHue(row.code),
        rutterLength(row.code) ?? "",
        rutterBerth(row.code) ? "1" : "0",
        rutterSplice(row.code) ? "1" : "0",
        rutterReach(row.code) ? "1" : "0",
        rutterMark(row.code) ? "1" : "0",
        rutterEven(row.code) ? "1" : "0",
        rutterCipher(row.code) ? "1" : "0",
        rutterMixed(row.code) ? "1" : "0",
        rutterUpper(row.code) ? "1" : "0",
        rutterInlet(row.code) ? "1" : "0",
        rutterTail(row.code) ? "1" : "0",
        rutterHeld(row.code) ? "1" : "0",
        rutterSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
