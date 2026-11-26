/**
 * Damascene watch ribbons kept in this browser,
 * and caption plates read the country name already stored on the account.
 * Windows are dawn, noon, dusk, and night. Finishes are gilt, ash, and mist.
 * Minutes are 15, 30, 45, or 90. Beads are 2, 4, or 8.
 * Dawn and noon are the day. Dusk and night are the night.
 * Home, resident, known, live, yes, and clear are leading. Check, review, ask, and look sit the desk.
 * New, later, queue, and pending wait. Fail, missing, deny, and void are returned.
 * Both and dual are joined. None, no, blank, and unknown stay plain.
 * A plus joins two captions. A colon that is not a time marks a scoped caption.
 * A time today is leading. Within two days is the desk. Within seven days waits. Older is returned.
 * A brief caption is exactly two characters. A digit caption starts with a digit and is not a time.
 * A long caption is eight characters or longer and does not start with a digit. A vowel caption starts with a vowel.
 * The words resident and known are leading. Quiet or hidden is shut.
 * A true caption reads as HOME. A false caption reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved caption.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_damascene_ribbon (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   watcher text not null default '',
 *   watch text not null default '',
 *   sla_min integer,
 *   finish text not null default '',
 *   bead integer not null default 2,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pinned boolean not null default false,
 *   vaulted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_cap_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_cap_review (
 *   trader_id text primary key
 * );
 */

export const DMC_KEY = "crmv4-damascene-373";
export const DMC_VIEW_KEY = "crmv4-damascene-views-373";
export const DMC_DENSITY_KEY = "crmv4-damascene-density-373";
export const DMC_WATCHES = ["dawn", "noon", "dusk", "night"] as const;

export type RibbonWindow = (typeof DMC_WATCHES)[number];
export type RibbonFinish = "blank" | "gilt" | "ash" | "mist";
export type RibbonTray = "bench" | "pin" | "vault";
export type RibbonDensity = "open" | "tight";
export type RibbonSort = "watch" | "watcher";

export type Ribbon = {
  id: string;
  title: string;
  note: string;
  watcher: string;
  watch: string;
  sla: number | null;
  finish: string;
  bead: number;
  tags: string[];
  raised: boolean;
  pinned: boolean;
  vaulted: boolean;
  starred: boolean;
  audit: string;
};

export type RibbonView = {
  id: string;
  name: string;
  tray: RibbonTray;
  query: string;
  watcher: string;
  finish: string;
  watch: string;
  sla: string;
  bead: string;
};

export type RibbonCounts = {
  bench: number;
  pin: number;
  vault: number;
  raised: number;
  day: number;
  night: number;
  long: number;
  quiet: number;
  minutes: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND373_FEATURES = [
  "damascene-save",
  "ribbon-reminders",
  "damascene-windows",
  "damascene-search",
  "ribbon-minute-sla",
  "ribbon-vault",
  "damascene-star",
  "damascene-inline-title",
  "damascene-filters",
  "saved-damascene-views",
  "damascene-density",
  "ribbon-focus",
  "damascene-kpis",
  "ribbon-chart",
  "ribbon-timeline",
  "damascene-bulk",
  "damascene-csv",
  "damascene-keys",
  "damascene-audit",
  "fair-watcher",
  "damascene-viewer",
  "suggest-window",
  "overdue-night",
  "caption-plates",
  "caption-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "raise", "free", "pin", "return", "vault", "open", "tag", "bead", "sla", "lower", "star"] as const;
const FINISHES = ["gilt", "ash", "mist"] as const;
const SLA_CYCLE = [15, 30, 45, 90] as const;
const BEAD_CYCLE = [2, 4, 8] as const;
const DAY = new Set(["dawn", "noon"]);
const NIGHT = new Set(["dusk", "night"]);
const QUIET_FINISH = new Set(["ASH"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RibbonTray {
  return raw === "pin" || raw === "vault" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<RibbonFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<RibbonFinish, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[dm]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Ribbon, tray: RibbonTray): boolean {
  if (tray === "pin") return card.pinned && !card.vaulted;
  if (tray === "vault") return card.vaulted;
  return !card.pinned && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function watchIndex(watch: string): number {
  return DMC_WATCHES.indexOf(watch as RibbonWindow);
}

function slaIndex(sla: number): number {
  return SLA_CYCLE.indexOf(sla as (typeof SLA_CYCLE)[number]);
}

function beadIndex(bead: number): number {
  return BEAD_CYCLE.indexOf(bead as (typeof BEAD_CYCLE)[number]);
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

export function ribbonWatch(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (DMC_WATCHES as readonly string[]).includes(text) ? text : "";
}

/** A minute mark is 15, 30, 45, or 90. Anything else stays blank. */
export function ribbonSla(raw: unknown): 15 | 30 | 45 | 90 | null {
  const text = wholeToken(raw);
  if (text !== "15" && text !== "30" && text !== "45" && text !== "90") return null;
  return Number(text) as 15 | 30 | 45 | 90;
}

/** A bead count is 2, 4, or 8. Anything else stays blank. */
export function ribbonBead(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A finish is gilt, ash, or mist. The saved name is the upper token. */
export function ribbonFinish(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function ribbonInner(watch: unknown): boolean {
  return DAY.has(clip(watch, 12).toLowerCase());
}

export function ribbonOuter(watch: unknown): boolean {
  return NIGHT.has(clip(watch, 12).toLowerCase());
}

/** Dawn is morning. Noon is midday. Dusk is evening. Night is late. */
export function ribbonBand(watch: unknown): string {
  const text = ribbonWatch(watch);
  if (!text) return "";
  if (text === "dawn") return "morning";
  if (text === "noon") return "midday";
  if (text === "dusk") return "evening";
  return "late";
}

/** Signed distance from one window to another along the day. */
export function ribbonGap(from: unknown, to: unknown): number | null {
  const left = watchIndex(ribbonWatch(from));
  const right = watchIndex(ribbonWatch(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietAsh(finish: unknown): boolean {
  return QUIET_FINISH.has(ribbonFinish(finish));
}

/** A pair bead is 4. Two and eight are not a pair. */
export function pairBead(bead: unknown): boolean {
  return ribbonBead(bead) === 4;
}

/** A full bead is 8. */
export function fullBead(bead: unknown): boolean {
  return ribbonBead(bead) === 8;
}

export function activeWatch(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return ribbonWatch(text) || "all";
}

export function activeSla(raw: unknown): string {
  const sla = ribbonSla(raw);
  return sla === null ? "all" : String(sla);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = ribbonFinish(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeBead(raw: unknown): string {
  const bead = ribbonBead(raw);
  return bead === null ? "all" : String(bead);
}

export function moveRibbonFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The finish the bench uses least. A tie keeps mist, then gilt, then ash. */
export function suggestFinish(cards: readonly Ribbon[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "MIST";
  let score = Number.POSITIVE_INFINITY;
  for (const finish of ["MIST", "GILT", "ASH"]) {
    const count = counts.get(finish) || 0;
    if (count < score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before four, suggest fifteen. Before eight, suggest thirty. Before sixteen, suggest forty-five. Later, suggest ninety. A saved minute on the bench wins, and a tie keeps the shorter minute. */
export function suggestSla(cards: readonly Ribbon[], hour: number): 15 | 30 | 45 | 90 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.sla === null) continue;
    seen = true;
    counts.set(card.sla, (counts.get(card.sla) || 0) + 1);
  }
  if (seen) {
    let best: 15 | 30 | 45 | 90 = 15;
    let score = Number.POSITIVE_INFINITY;
    for (const sla of SLA_CYCLE) {
      const count = counts.get(sla) || 0;
      if (count < score) {
        best = sla;
        score = count;
      }
    }
    return best;
  }
  if (hour < 4) return 15;
  if (hour < 8) return 30;
  if (hour < 16) return 45;
  return 90;
}

export function suggestWatch(hour: number): RibbonWindow {
  if (hour < 6) return "dawn";
  if (hour < 12) return "noon";
  if (hour < 18) return "dusk";
  return "night";
}

/** The watcher with the fewest unraised ribbons on the bench. A tie keeps the roster order. */
export function fairWatcher(cards: readonly Ribbon[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.raised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.watcher.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readRibbonCards(raw: unknown): Ribbon[] {
  if (!Array.isArray(raw)) return [];
  const out: Ribbon[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Ribbon>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      watcher: clip(row.watcher, 24),
      watch: ribbonWatch(row.watch),
      sla: ribbonSla(row.sla),
      finish: ribbonFinish(row.finish),
      bead: ribbonBead(row.bead) ?? 2,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      pinned: row.pinned === true,
      vaulted: row.vaulted === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addRibbon(
  cards: readonly Ribbon[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    watcher?: string;
    watch?: string;
    sla?: unknown;
    finish?: string;
    bead?: unknown;
    tags?: unknown;
  },
): Ribbon[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `d${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readRibbonCards([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      watcher: clip(card.watcher, 24),
      watch: ribbonWatch(card.watch),
      sla: ribbonSla(card.sla),
      finish: ribbonFinish(card.finish),
      bead: ribbonBead(card.bead) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      vaulted: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Ribbon[], id: string, edit: (card: Ribbon) => Ribbon): Ribbon[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editRibbon(cards: readonly Ribbon[], id: string, title: string): Ribbon[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editRibbonNote(cards: readonly Ribbon[], id: string, note: string): Ribbon[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFinish(finish: string): string {
  const order = ["", "GILT", "MIST", "ASH"];
  const index = order.indexOf(ribbonFinish(finish));
  return order[(index + 1) % order.length] || "GILT";
}

export function setRibbonFinish(cards: readonly Ribbon[], id: string, finish: string): Ribbon[] {
  const next = ribbonFinish(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "film" }));
}

export function setRibbonRaised(cards: readonly Ribbon[], id: string, raised: boolean): Ribbon[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setRibbonPin(cards: readonly Ribbon[], id: string, pinned: boolean): Ribbon[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, vaulted: pinned ? false : card.vaulted, audit: pinned ? "pin" : "return" }));
}

export function setRibbonVault(cards: readonly Ribbon[], id: string, vaulted: boolean): Ribbon[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, pinned: vaulted ? false : card.pinned, audit: vaulted ? "vault" : "open" }));
}

export function setRibbonStar(cards: readonly Ribbon[], id: string, starred: boolean): Ribbon[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addRibbonTag(cards: readonly Ribbon[], id: string, tag: string): Ribbon[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSla(sla: number | null, dir: 1 | -1): 15 | 30 | 45 | 90 {
  if (sla === null) return dir > 0 ? 15 : 90;
  const index = slaIndex(sla);
  const next = index < 0 ? 0 : (index + dir + SLA_CYCLE.length) % SLA_CYCLE.length;
  return SLA_CYCLE[next];
}

function stepBead(bead: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = beadIndex(bead);
  const next = index < 0 ? 0 : (index + dir + BEAD_CYCLE.length) % BEAD_CYCLE.length;
  return BEAD_CYCLE[next];
}

export function raiseSlaFocused(cards: readonly Ribbon[], id: string): Ribbon[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSla(card.sla, 1), audit: "sla" }));
}

export function lowerSlaFocused(cards: readonly Ribbon[], id: string): Ribbon[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSla(card.sla, -1), audit: "lower" }));
}

export function raiseBeadFocused(cards: readonly Ribbon[], id: string): Ribbon[] {
  return mapCard(cards, id, (card) => ({ ...card, bead: stepBead(card.bead, 1), audit: "bead" }));
}

export function lowerBeadFocused(cards: readonly Ribbon[], id: string): Ribbon[] {
  return mapCard(cards, id, (card) => ({ ...card, bead: stepBead(card.bead, -1), audit: "bead" }));
}

export function setRibbonFocused(cards: readonly Ribbon[], id: string): Ribbon[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function pinRibbonFocused(cards: readonly Ribbon[], id: string): Ribbon[] {
  return setRibbonPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starRibbonFocused(cards: readonly Ribbon[], id: string): Ribbon[] {
  return setRibbonStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Ribbon[], id: string): Ribbon[] {
  const card = cards.find((item) => item.id === id);
  return card ? setRibbonFinish(cards, id, cycleFinish(card.finish)) : [...cards];
}

function bulk(cards: readonly Ribbon[], ids: readonly string[], edit: (card: Ribbon) => Ribbon): Ribbon[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkRibbonAsh(cards: readonly Ribbon[], ids: readonly string[]): Ribbon[] {
  return bulk(cards, ids, (card) => (card.finish === "ASH" ? card : { ...card, finish: "ASH", audit: "film" }));
}

export function bulkRibbonRaise(cards: readonly Ribbon[], ids: readonly string[]): Ribbon[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkRibbonVault(cards: readonly Ribbon[], ids: readonly string[]): Ribbon[] {
  return bulk(cards, ids, (card) => (card.vaulted ? card : { ...card, vaulted: true, pinned: false, audit: "vault" }));
}

export function bulkRibbonTag(cards: readonly Ribbon[], ids: readonly string[]): Ribbon[] {
  return bulk(cards, ids, (card) => (card.tags.includes("d") ? card : { ...card, tags: tagsOf([...card.tags, "d"]), audit: "tag" }));
}

export function readRibbonViews(raw: unknown): RibbonView[] {
  if (!Array.isArray(raw)) return [];
  const out: RibbonView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RibbonView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      watcher: clip(row.watcher, 24),
      finish: activeFinish(row.finish, ["GILT", "ASH", "MIST"]),
      watch: activeWatch(row.watch),
      sla: activeSla(row.sla),
      bead: activeBead(row.bead),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addRibbonView(views: readonly RibbonView[], view: RibbonView): RibbonView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readRibbonViews([...views, { ...view, id, name }]);
}

export function dropRibbonView(views: readonly RibbonView[], id: string): RibbonView[] {
  return views.filter((view) => view.id !== id);
}

export function ribbonDensity(raw: unknown): RibbonDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortRibbonCards(cards: readonly Ribbon[], sort: RibbonSort): Ribbon[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "watcher") {
      const watcher = a.watcher.localeCompare(b.watcher);
      if (watcher) return watcher;
    } else {
      const watch = watchIndex(a.watch) - watchIndex(b.watch);
      if (watch) return watch;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleRibbonCards(
  cards: readonly Ribbon[],
  tray: RibbonTray,
  query: string,
  watcher: string,
  finish: string,
  watch: string,
  sla: string,
  bead: string,
): Ribbon[] {
  const text = query.trim().toLowerCase();
  const wantWatcher = clip(watcher, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : ribbonFinish(finish);
  const wantWatch = activeWatch(watch);
  const wantSla = activeSla(sla);
  const wantBead = activeBead(bead);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.watcher}`.toLowerCase().includes(text)) return false;
    if (wantWatcher && card.watcher.toLowerCase() !== wantWatcher) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantWatch === "inner" && !ribbonInner(card.watch)) return false;
    if (wantWatch === "outer" && !ribbonOuter(card.watch)) return false;
    if (wantWatch !== "all" && wantWatch !== "inner" && wantWatch !== "outer" && card.watch !== wantWatch) return false;
    if (wantSla !== "all" && String(card.sla ?? "") !== wantSla) return false;
    if (wantBead !== "all" && String(card.bead) !== wantBead) return false;
    return true;
  });
}

/** A night window on bead two, still not raised and not in the vault, is overdue. */
export function overdueRibbon(card: Ribbon): boolean {
  return ribbonOuter(card.watch) && card.bead === 2 && !card.raised && !card.vaulted;
}

/** No finish, fifteen minutes, bead two, and still on the bench. */
export function idleRibbon(card: Ribbon): boolean {
  return !card.finish && card.sla === 15 && card.bead === 2 && !card.raised && !card.pinned && !card.vaulted;
}

/** Gilt, ninety minutes, and a full bead, still out of the vault. */
export function briskRibbon(card: Ribbon): boolean {
  return card.finish === "GILT" && card.sla === 90 && card.bead === 8 && !card.vaulted;
}

/** Night, mist, and thirty minutes. */
export function restingRibbon(card: Ribbon): boolean {
  return card.watch === "night" && card.finish === "MIST" && card.sla === 30;
}

/** A dawn ribbon is late when the station is already night. */
export function lateRibbon(card: Ribbon, station: string): boolean {
  return card.watch === "dawn" && ribbonWatch(station) === "night" && !card.raised;
}

export function ribbonCounts(cards: readonly Ribbon[], shown: readonly Ribbon[], station: string): RibbonCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    pin: cards.filter((card) => inTray(card, "pin")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    raised: cards.filter((card) => card.raised).length,
    day: cards.filter((card) => ribbonInner(card.watch)).length,
    night: cards.filter((card) => ribbonOuter(card.watch)).length,
    long: cards.filter((card) => card.sla === 90).length,
    quiet: cards.filter((card) => quietAsh(card.finish)).length,
    minutes: cards.reduce((sum, card) => sum + (card.sla || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleRibbon).length,
    brisk: cards.filter(briskRibbon).length,
    resting: cards.filter(restingRibbon).length,
    overdue: cards.filter(overdueRibbon).length,
    pair: cards.filter((card) => pairBead(card.bead) && lateRibbon(card, station)).length,
  };
}

export function ribbonBars(cards: readonly Ribbon[]): { watch: string; count: number }[] {
  return DMC_WATCHES.map((watch) => ({ watch, count: cards.filter((card) => card.watch === watch && !card.vaulted).length }));
}

export function ribbonTimeline(cards: readonly Ribbon[]): { sla: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return SLA_CYCLE.map((sla) => ({ sla, titles: open.filter((card) => card.sla === sla).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function ribbonWatchers(cards: readonly Ribbon[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.watcher && !out.some((name) => name.toLowerCase() === card.watcher.toLowerCase())) out.push(card.watcher);
  }
  return out;
}

export function busiestWatcher(cards: readonly Ribbon[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.raised && card.watcher);
  let best = "";
  let score = 0;
  for (const name of ribbonWatchers(open)) {
    const count = open.filter((card) => card.watcher.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderRibbonCards(cards: readonly Ribbon[]): string[] {
  return cards.filter(overdueRibbon).map((card) => card.title);
}

export function ribbonCopy(card: Ribbon): string {
  return [card.title, card.watcher, card.watch, card.finish, card.sla ?? "", card.bead, card.note].filter((item) => item !== "").join(" · ");
}

export function ribbonCsv(cards: readonly Ribbon[], station: string): string {
  const lines = ["title,watcher,watch,finish,sla,bead,tags,raised,pin,vault,starred,night,late,idle,brisk,resting,overdue,day,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.watcher),
        card.watch,
        card.finish,
        card.sla ?? "",
        card.bead,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.pinned ? "1" : "0",
        card.vaulted ? "1" : "0",
        card.starred ? "1" : "0",
        ribbonOuter(card.watch) ? "1" : "0",
        lateRibbon(card, station) ? "1" : "0",
        idleRibbon(card) ? "1" : "0",
        briskRibbon(card) ? "1" : "0",
        restingRibbon(card) ? "1" : "0",
        overdueRibbon(card) ? "1" : "0",
        ribbonInner(card.watch) ? "1" : "0",
        quietAsh(card.finish) ? "1" : "0",
        ribbonBand(card.watch),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const CAP_KEY = "crmv4-cap-hide-373";
export const CAP_REVIEW_KEY = "crmv4-cap-review-373";

export type CapLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type CapHue = "" | "ivory" | "graphite" | "champagne";
export type CapState = "" | "clear" | "set";
export type CapReview = "all" | "reviewed" | "fresh";
export type CapShape =
  | "all"
  | "hall"
  | "vacant"
  | "hold"
  | "guest"
  | "join"
  | "route"
  | "brief"
  | "long"
  | "stamp"
  | "vowel"
  | "plain"
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

export type CapValue = string | { lastCountryName?: unknown; [key: string]: unknown } | null | undefined;
export type CapRow = { id: string; label: string; code: CapValue; userId?: string };
export type CapLaneLine = { mail: string; count: number };

const CAPTION_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const CAPTION_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: CapValue): { lastCountryName?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: CapValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: CapValue): string {
  const row = codeRecord(raw);
  if (row && !("lastCountryName" in row)) return "";
  const value = row ? row.lastCountryName : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "HOME";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: CapValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("lastCountryName" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function capState(raw: CapValue): CapState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["HOME", "RESIDENT", "KNOWN", "LIVE", "YES", "CLEAR"]);
const DESK_TITLES = new Set(["CHECK", "REVIEW", "ASK", "LOOK"]);
const HOLD_TITLES = new Set(["NEW", "LATER", "QUEUE", "PENDING"]);
const GUEST_TITLES = new Set(["FAIL", "MISSING", "DENY", "VOID"]);
const JOIN_TITLES = new Set(["BOTH", "DUAL"]);
const PLAIN_TITLES = new Set(["NONE", "NO", "BLANK", "UNKNOWN"]);

/** A known caption maps first. A plus joins two captions. A colon that is not a time marks a scoped caption. A time today is leading. Within two days is the desk. Within seven days waits. Older is returned. Quiet or hidden is shut. A brief caption is exactly two characters. A digit caption starts with a digit and is not a time. A long caption is eight characters or longer. A vowel caption starts with a vowel. The words resident and known lead. */
export function capLane(raw: CapValue, now = Date.now()): CapLane {
  if (capState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/quiet|hidden/i.test(text)) return "vacant";
  if (text.includes("+")) return "join";
  const at = Date.parse(text);
  if (!Number.isNaN(at)) {
    if (at > now) return "hall";
    const day = 86400000;
    const left = new Date(at);
    const right = new Date(now);
    const sameDay = left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
    if (sameDay) return "hall";
    const age = now - at;
    if (age < 2 * day) return "desk";
    if (age < 7 * day) return "hold";
    return "guest";
  }
  if (text.includes(":")) return "route";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length === 2) return "brief";
  if (/\bresident\b|\bknown\b/i.test(text)) return "hall";
  if (text.length >= 8) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function capHue(raw: CapValue, now = Date.now()): CapHue {
  const mail = capLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "join") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function capHome(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "hall";
}

export function capAway(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "vacant";
}

export function capHold(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "hold";
}

export function capReturned(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "guest";
}

export function capDesk(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "desk";
}

export function capJoin(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "join";
}

export function capRoute(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "route";
}

export function capBrief(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "brief";
}

export function capLong(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "long";
}

export function capStampLane(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "stamp";
}

export function capVowelLane(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "vowel";
}

export function capPlain(raw: CapValue, now = Date.now()): boolean {
  return capLane(raw, now) === "plain";
}

export function capOpen(raw: CapValue): boolean {
  return capState(raw) === "clear";
}

/** A long caption or a digit caption can stay as written. */
export function capHeld(raw: CapValue): boolean {
  const mail = capLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief caption, or a five-character caption that is not a known title, still wants a fuller name. */
export function capSoon(raw: CapValue, now = Date.now()): boolean {
  if (capState(raw) !== "set") return false;
  if (capBrief(raw, now)) return true;
  if (capHome(raw, now) || capAway(raw, now) || capHold(raw, now) || capReturned(raw, now)) return false;
  return codeGiven(raw).length === 5;
}

export function capLength(raw: CapValue): number | null {
  if (capState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function capEven(raw: CapValue): boolean {
  const length = capLength(raw);
  return length !== null && length % 2 === 0;
}

export function capOdd(raw: CapValue): boolean {
  const length = capLength(raw);
  return length !== null && length % 2 === 1;
}

export function capFirst(raw: CapValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function capTail(raw: CapValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function capSpace(raw: CapValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function capVowel(raw: CapValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function capDigit(raw: CapValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function capLetter(raw: CapValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function capMixed(raw: CapValue): boolean {
  return capDigit(raw) && capLetter(raw);
}

export function capLower(raw: CapValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital caption is five letters or more, written entirely in capitals. */
export function capUpper(raw: CapValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function capStamp(raw: CapValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function capCopy(raw: CapValue): string {
  return codeGiven(raw);
}

export function capFamily(raw: CapValue): string {
  if (capState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function capLanes(rows: readonly CapRow[]): CapLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of CAPTION_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = capLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return CAPTION_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingCap(rows: readonly CapRow[]): string {
  const lines = capLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CAPTION_LANES.indexOf(a.mail as (typeof CAPTION_LANES)[number]) - CAPTION_LANES.indexOf(b.mail as (typeof CAPTION_LANES)[number]))[0].mail;
}

export function leadingCapHue(rows: readonly CapRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CAPTION_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = capHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CAPTION_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CAPTION_HUES.indexOf(a.hue) - CAPTION_HUES.indexOf(b.hue))[0].hue;
}

export function laneCapCount(rows: readonly CapRow[], mail: CapLane): number {
  return rows.filter((row) => capLane(row.code) === mail).length;
}

export function capShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCapLanes(rows: readonly CapRow[]): string[] {
  return capLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenCap(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mail = clip(item, 12);
    if (!allow.has(mail) || out.includes(mail)) continue;
    out.push(mail);
  }
  return out;
}

export function readReviewedCap(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCap(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleCapReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCapReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCapLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: CapRow, shape: CapShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return capHome(row.code);
  if (shape === "vacant") return capAway(row.code);
  if (shape === "hold") return capHold(row.code);
  if (shape === "guest") return capReturned(row.code);
  if (shape === "join") return capJoin(row.code);
  if (shape === "route") return capRoute(row.code);
  if (shape === "brief") return capBrief(row.code);
  if (shape === "long") return capLong(row.code);
  if (shape === "stamp") return capStampLane(row.code);
  if (shape === "vowel") return capVowelLane(row.code);
  if (shape === "plain") return capPlain(row.code);
  if (shape === "open") return capOpen(row.code);
  if (shape === "soon") return capSoon(row.code);
  if (shape === "letter") return capLetter(row.code);
  if (shape === "mixed") return capMixed(row.code);
  if (shape === "upper") return capUpper(row.code);
  if (shape === "lower") return capLower(row.code);
  if (shape === "space") return capSpace(row.code);
  if (shape === "even") return capEven(row.code);
  if (shape === "odd") return capOdd(row.code);
  if (shape === "tail") return capTail(row.code);
  if (shape === "first") return capFirst(row.code);
  if (shape === "held") return capHeld(row.code);
  return capLane(row.code) === shape;
}

export function visibleCap(
  rows: readonly CapRow[],
  mail: string,
  hue: string,
  query: string,
  review: CapReview,
  reviewed: readonly string[],
  shape: CapShape,
): CapRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (capState(row.code) === "") return false;
    const found = capLane(row.code);
    const hueName = capHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${capStamp(row.code)} ${capFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function capLanesCsv(rows: readonly CapRow[]): string {
  const lines = ["lane,count"];
  for (const line of capLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function capRowsCsv(rows: readonly CapRow[], reviewed: readonly string[]): string {
  const lines = ["name,lastCountryName,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(capCopy(row.code)),
        capStamp(row.code),
        csvCell(capFamily(row.code)),
        capLane(row.code),
        capHue(row.code),
        capLength(row.code) ?? "",
        capHome(row.code) ? "1" : "0",
        capAway(row.code) ? "1" : "0",
        capHold(row.code) ? "1" : "0",
        capDesk(row.code) ? "1" : "0",
        capReturned(row.code) ? "1" : "0",
        capJoin(row.code) ? "1" : "0",
        capRoute(row.code) ? "1" : "0",
        capBrief(row.code) ? "1" : "0",
        capEven(row.code) ? "1" : "0",
        capDigit(row.code) ? "1" : "0",
        capMixed(row.code) ? "1" : "0",
        capUpper(row.code) ? "1" : "0",
        capVowel(row.code) ? "1" : "0",
        capTail(row.code) ? "1" : "0",
        capHeld(row.code) ? "1" : "0",
        capSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
