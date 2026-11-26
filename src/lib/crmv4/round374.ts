/**
 * Champlevé wells kept in this browser,
 * and void stamps read the invalid-lead time already stored on the account.
 * Seasons are spring, summer, autumn, and winter. Finishes are gold, ivory, and ink.
 * Minutes are 10, 20, 40, or 80. Depths are 3, 6, or 9.
 * Spring and summer are the warm half. Autumn and winter are the cool half.
 * Live, fresh, open, yes, clear, and valid are the court. Call, note, ping, and meet sit the bench.
 * Soon, later, queue, and hold wait. Fail, void, deny, and lost are returned.
 * Both and dual are paired. None, no, blank, and empty stay bare.
 * A plus joins two stamps. A colon that is not a time marks a scoped stamp.
 * A time today is the court. Within three days is the bench. Within fourteen days waits. Older is returned.
 * A short stamp is exactly three characters. A digit stamp starts with a digit and is not a time.
 * A span stamp is ten characters or longer and does not start with a digit. A vowel stamp starts with a vowel.
 * The words valid and fresh are the court. Quiet or hidden is shut.
 * A true stamp reads as LIVE. A false stamp reads as EMPTY.
 * Money fields are not read. The password itself is not read. The plate does not change the saved time.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_champleve_well (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   setter text not null default '',
 *   season text not null default '',
 *   sla_min integer,
 *   finish text not null default '',
 *   depth integer not null default 3,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pinned boolean not null default false,
 *   vaulted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_void_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_void_review (
 *   trader_id text primary key
 * );
 */

export const CHV_KEY = "crmv4-champleve-374";
export const CHV_VIEW_KEY = "crmv4-champleve-views-374";
export const CHV_DENSITY_KEY = "crmv4-champleve-density-374";
export const CHV_SEASONS = ["spring", "summer", "autumn", "winter"] as const;

export type WellSeason = (typeof CHV_SEASONS)[number];
export type WellFinish = "blank" | "gold" | "ivory" | "ink";
export type WellTray = "bench" | "pin" | "vault";
export type WellDensity = "open" | "tight";
export type WellSort = "watch" | "watcher";

export type Well = {
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

export type WellView = {
  id: string;
  name: string;
  tray: WellTray;
  query: string;
  watcher: string;
  finish: string;
  watch: string;
  sla: string;
  bead: string;
};

export type WellCounts = {
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

export const ROUND374_FEATURES = [
  "champleve-save",
  "well-reminders",
  "champleve-seasons",
  "champleve-search",
  "well-minute-sla",
  "well-coffer",
  "champleve-star",
  "champleve-inline-title",
  "champleve-filters",
  "saved-champleve-views",
  "champleve-density",
  "well-focus",
  "champleve-kpis",
  "well-chart",
  "well-timeline",
  "champleve-bulk",
  "champleve-csv",
  "champleve-keys",
  "champleve-audit",
  "fair-setter",
  "champleve-viewer",
  "suggest-season",
  "overdue-winter",
  "void-stamps",
  "void-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "raise", "free", "pin", "return", "vault", "open", "tag", "bead", "sla", "lower", "star"] as const;
const FINISHES = ["gold", "ivory", "ink"] as const;
const SLA_CYCLE = [10, 20, 40, 80] as const;
const DEPTH_CYCLE = [3, 6, 9] as const;
const DAY = new Set(["spring", "summer"]);
const NIGHT = new Set(["autumn", "winter"]);
const QUIET_FINISH = new Set(["INK"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): WellTray {
  return raw === "pin" || raw === "vault" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<WellFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<WellFinish, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ch]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Well, tray: WellTray): boolean {
  if (tray === "pin") return card.pinned && !card.vaulted;
  if (tray === "vault") return card.vaulted;
  return !card.pinned && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function watchIndex(watch: string): number {
  return CHV_SEASONS.indexOf(watch as WellSeason);
}

function slaIndex(sla: number): number {
  return SLA_CYCLE.indexOf(sla as (typeof SLA_CYCLE)[number]);
}

function depthIndex(bead: number): number {
  return DEPTH_CYCLE.indexOf(bead as (typeof DEPTH_CYCLE)[number]);
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

export function wellSeason(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CHV_SEASONS as readonly string[]).includes(text) ? text : "";
}

/** A minute mark is 15, 30, 45, or 90. Anything else stays blank. */
export function wellSla(raw: unknown): 10 | 20 | 40 | 80 | null {
  const text = wholeToken(raw);
  if (text !== "10" && text !== "20" && text !== "40" && text !== "80") return null;
  return Number(text) as 10 | 20 | 40 | 80;
}

/** A bead count is 2, 4, or 8. Anything else stays blank. */
export function wellDepth(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A finish is gilt, ash, or mist. The saved name is the upper token. */
export function wellFinish(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function wellWarm(watch: unknown): boolean {
  return DAY.has(clip(watch, 12).toLowerCase());
}

export function wellCool(watch: unknown): boolean {
  return NIGHT.has(clip(watch, 12).toLowerCase());
}

/** Dawn is morning. Noon is midday. Dusk is evening. Night is late. */
export function wellBand(watch: unknown): string {
  const text = wellSeason(watch);
  if (!text) return "";
  if (text === "spring") return "morning";
  if (text === "summer") return "midday";
  if (text === "autumn") return "evening";
  return "late";
}

/** Signed distance from one window to another along the day. */
export function wellGap(from: unknown, to: unknown): number | null {
  const left = watchIndex(wellSeason(from));
  const right = watchIndex(wellSeason(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietInk(finish: unknown): boolean {
  return QUIET_FINISH.has(wellFinish(finish));
}

/** A pair bead is 4. Two and eight are not a pair. */
export function pairDepth(bead: unknown): boolean {
  return wellDepth(bead) === 6;
}

/** A full bead is 8. */
export function fullDepth(bead: unknown): boolean {
  return wellDepth(bead) === 9;
}

export function activeSeason(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return wellSeason(text) || "all";
}

export function activeSla(raw: unknown): string {
  const sla = wellSla(raw);
  return sla === null ? "all" : String(sla);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = wellFinish(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const bead = wellDepth(raw);
  return bead === null ? "all" : String(bead);
}

export function moveWellFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The finish the bench uses least. A tie keeps mist, then gilt, then ash. */
export function suggestFinish(cards: readonly Well[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const finish of ["IVORY", "GOLD", "INK"]) {
    const count = counts.get(finish) || 0;
    if (count < score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before four, suggest fifteen. Before eight, suggest thirty. Before sixteen, suggest forty-five. Later, suggest ninety. A saved minute on the bench wins, and a tie keeps the shorter minute. */
export function suggestSla(cards: readonly Well[], hour: number): 10 | 20 | 40 | 80 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.sla === null) continue;
    seen = true;
    counts.set(card.sla, (counts.get(card.sla) || 0) + 1);
  }
  if (seen) {
    let best: 10 | 20 | 40 | 80 = 10;
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
  if (hour < 4) return 10;
  if (hour < 8) return 20;
  if (hour < 16) return 40;
  return 80;
}

export function suggestSeason(hour: number): WellSeason {
  if (hour < 6) return "spring";
  if (hour < 12) return "summer";
  if (hour < 18) return "autumn";
  return "winter";
}

/** The watcher with the fewest unraised ribbons on the bench. A tie keeps the roster order. */
export function fairSetter(cards: readonly Well[], roster: string): string {
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

export function readWells(raw: unknown): Well[] {
  if (!Array.isArray(raw)) return [];
  const out: Well[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Well>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      watcher: clip(row.watcher, 24),
      watch: wellSeason(row.watch),
      sla: wellSla(row.sla),
      finish: wellFinish(row.finish),
      bead: wellDepth(row.bead) ?? 3,
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

export function addWell(
  cards: readonly Well[],
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
): Well[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `w${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readWells([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      watcher: clip(card.watcher, 24),
      watch: wellSeason(card.watch),
      sla: wellSla(card.sla),
      finish: wellFinish(card.finish),
      bead: wellDepth(card.bead) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      vaulted: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Well[], id: string, edit: (card: Well) => Well): Well[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editWell(cards: readonly Well[], id: string, title: string): Well[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editWellNote(cards: readonly Well[], id: string, note: string): Well[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFinish(finish: string): string {
  const order = ["", "GOLD", "IVORY", "INK"];
  const index = order.indexOf(wellFinish(finish));
  return order[(index + 1) % order.length] || "GOLD";
}

export function setWellFinish(cards: readonly Well[], id: string, finish: string): Well[] {
  const next = wellFinish(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "film" }));
}

export function setWellRaised(cards: readonly Well[], id: string, raised: boolean): Well[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setWellPin(cards: readonly Well[], id: string, pinned: boolean): Well[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, vaulted: pinned ? false : card.vaulted, audit: pinned ? "pin" : "return" }));
}

export function setWellCoffer(cards: readonly Well[], id: string, vaulted: boolean): Well[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, pinned: vaulted ? false : card.pinned, audit: vaulted ? "vault" : "open" }));
}

export function setWellStar(cards: readonly Well[], id: string, starred: boolean): Well[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addWellTag(cards: readonly Well[], id: string, tag: string): Well[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSla(sla: number | null, dir: 1 | -1): 10 | 20 | 40 | 80 {
  if (sla === null) return dir > 0 ? 10 : 80;
  const index = slaIndex(sla);
  const next = index < 0 ? 0 : (index + dir + SLA_CYCLE.length) % SLA_CYCLE.length;
  return SLA_CYCLE[next];
}

function stepDepth(bead: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = depthIndex(bead);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseSlaFocused(cards: readonly Well[], id: string): Well[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSla(card.sla, 1), audit: "sla" }));
}

export function lowerSlaFocused(cards: readonly Well[], id: string): Well[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSla(card.sla, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Well[], id: string): Well[] {
  return mapCard(cards, id, (card) => ({ ...card, bead: stepDepth(card.bead, 1), audit: "bead" }));
}

export function lowerDepthFocused(cards: readonly Well[], id: string): Well[] {
  return mapCard(cards, id, (card) => ({ ...card, bead: stepDepth(card.bead, -1), audit: "bead" }));
}

export function setWellFocused(cards: readonly Well[], id: string): Well[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function pinWellFocused(cards: readonly Well[], id: string): Well[] {
  return setWellPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starWellFocused(cards: readonly Well[], id: string): Well[] {
  return setWellStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Well[], id: string): Well[] {
  const card = cards.find((item) => item.id === id);
  return card ? setWellFinish(cards, id, cycleFinish(card.finish)) : [...cards];
}

function bulk(cards: readonly Well[], ids: readonly string[], edit: (card: Well) => Well): Well[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkWellInk(cards: readonly Well[], ids: readonly string[]): Well[] {
  return bulk(cards, ids, (card) => (card.finish === "INK" ? card : { ...card, finish: "INK", audit: "film" }));
}

export function bulkWellRaise(cards: readonly Well[], ids: readonly string[]): Well[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkWellCoffer(cards: readonly Well[], ids: readonly string[]): Well[] {
  return bulk(cards, ids, (card) => (card.vaulted ? card : { ...card, vaulted: true, pinned: false, audit: "vault" }));
}

export function bulkWellTag(cards: readonly Well[], ids: readonly string[]): Well[] {
  return bulk(cards, ids, (card) => (card.tags.includes("d") ? card : { ...card, tags: tagsOf([...card.tags, "d"]), audit: "tag" }));
}

export function readWellViews(raw: unknown): WellView[] {
  if (!Array.isArray(raw)) return [];
  const out: WellView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WellView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      watcher: clip(row.watcher, 24),
      finish: activeFinish(row.finish, ["GOLD", "IVORY", "INK"]),
      watch: activeSeason(row.watch),
      sla: activeSla(row.sla),
      bead: activeDepth(row.bead),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addWellView(views: readonly WellView[], view: WellView): WellView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readWellViews([...views, { ...view, id, name }]);
}

export function dropWellView(views: readonly WellView[], id: string): WellView[] {
  return views.filter((view) => view.id !== id);
}

export function wellDensity(raw: unknown): WellDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortWells(cards: readonly Well[], sort: WellSort): Well[] {
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

export function visibleWells(
  cards: readonly Well[],
  tray: WellTray,
  query: string,
  watcher: string,
  finish: string,
  watch: string,
  sla: string,
  bead: string,
): Well[] {
  const text = query.trim().toLowerCase();
  const wantWatcher = clip(watcher, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : wellFinish(finish);
  const wantWatch = activeSeason(watch);
  const wantSla = activeSla(sla);
  const wantBead = activeDepth(bead);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.watcher}`.toLowerCase().includes(text)) return false;
    if (wantWatcher && card.watcher.toLowerCase() !== wantWatcher) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantWatch === "inner" && !wellWarm(card.watch)) return false;
    if (wantWatch === "outer" && !wellCool(card.watch)) return false;
    if (wantWatch !== "all" && wantWatch !== "inner" && wantWatch !== "outer" && card.watch !== wantWatch) return false;
    if (wantSla !== "all" && String(card.sla ?? "") !== wantSla) return false;
    if (wantBead !== "all" && String(card.bead) !== wantBead) return false;
    return true;
  });
}

/** A night window on bead two, still not raised and not in the vault, is overdue. */
export function overdueWell(card: Well): boolean {
  return wellCool(card.watch) && card.bead === 3 && !card.raised && !card.vaulted;
}

/** No finish, fifteen minutes, bead two, and still on the bench. */
export function idleWell(card: Well): boolean {
  return !card.finish && card.sla === 10 && card.bead === 3 && !card.raised && !card.pinned && !card.vaulted;
}

/** Gilt, ninety minutes, and a full bead, still out of the vault. */
export function briskWell(card: Well): boolean {
  return card.finish === "GOLD" && card.sla === 80 && card.bead === 9 && !card.vaulted;
}

/** Night, mist, and thirty minutes. */
export function restingWell(card: Well): boolean {
  return card.watch === "winter" && card.finish === "IVORY" && card.sla === 20;
}

/** A dawn ribbon is late when the station is already night. */
export function lateWell(card: Well, station: string): boolean {
  return card.watch === "spring" && wellSeason(station) === "winter" && !card.raised;
}

export function wellCounts(cards: readonly Well[], shown: readonly Well[], station: string): WellCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    pin: cards.filter((card) => inTray(card, "pin")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    raised: cards.filter((card) => card.raised).length,
    day: cards.filter((card) => wellWarm(card.watch)).length,
    night: cards.filter((card) => wellCool(card.watch)).length,
    long: cards.filter((card) => card.sla === 80).length,
    quiet: cards.filter((card) => quietInk(card.finish)).length,
    minutes: cards.reduce((sum, card) => sum + (card.sla || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleWell).length,
    brisk: cards.filter(briskWell).length,
    resting: cards.filter(restingWell).length,
    overdue: cards.filter(overdueWell).length,
    pair: cards.filter((card) => pairDepth(card.bead) && lateWell(card, station)).length,
  };
}

export function wellBars(cards: readonly Well[]): { watch: string; count: number }[] {
  return CHV_SEASONS.map((watch) => ({ watch, count: cards.filter((card) => card.watch === watch && !card.vaulted).length }));
}

export function wellTimeline(cards: readonly Well[]): { sla: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return SLA_CYCLE.map((sla) => ({ sla, titles: open.filter((card) => card.sla === sla).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function wellSetters(cards: readonly Well[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.watcher && !out.some((name) => name.toLowerCase() === card.watcher.toLowerCase())) out.push(card.watcher);
  }
  return out;
}

export function busiestSetter(cards: readonly Well[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.raised && card.watcher);
  let best = "";
  let score = 0;
  for (const name of wellSetters(open)) {
    const count = open.filter((card) => card.watcher.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderWells(cards: readonly Well[]): string[] {
  return cards.filter(overdueWell).map((card) => card.title);
}

export function wellCopy(card: Well): string {
  return [card.title, card.watcher, card.watch, card.finish, card.sla ?? "", card.bead, card.note].filter((item) => item !== "").join(" · ");
}

export function wellCsv(cards: readonly Well[], station: string): string {
  const lines = ["title,setter,season,finish,minutes,depth,tags,raised,rim,coffer,starred,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
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
        wellCool(card.watch) ? "1" : "0",
        lateWell(card, station) ? "1" : "0",
        idleWell(card) ? "1" : "0",
        briskWell(card) ? "1" : "0",
        restingWell(card) ? "1" : "0",
        overdueWell(card) ? "1" : "0",
        wellWarm(card.watch) ? "1" : "0",
        quietInk(card.finish) ? "1" : "0",
        wellBand(card.watch),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const VOD_KEY = "crmv4-void-hide-374";
export const VOD_REVIEW_KEY = "crmv4-void-review-374";

export type VodLane = "" | "court" | "shut" | "wait" | "bench" | "return" | "pair" | "scope" | "short" | "span" | "digit" | "openv" | "bare";
export type VodHue = "" | "ivory" | "graphite" | "champagne";
export type VodState = "" | "clear" | "set";
export type VodReview = "all" | "reviewed" | "fresh";
export type VodShape =
  | "all"
  | "court"
  | "shut"
  | "wait"
  | "return"
  | "pair"
  | "scope"
  | "short"
  | "span"
  | "digit"
  | "openv"
  | "bare"
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

export type VodValue = string | { leadInvalidAt?: unknown; [key: string]: unknown } | null | undefined;
export type VodRow = { id: string; label: string; code: VodValue; userId?: string };
export type VodLaneLine = { mail: string; count: number };

const VOID_LANES = ["court", "shut", "wait", "bench", "return", "pair", "scope", "short", "span", "digit", "openv", "bare"] as const;
const VOID_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: VodValue): { leadInvalidAt?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: VodValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: VodValue): string {
  const row = codeRecord(raw);
  if (row && !("leadInvalidAt" in row)) return "";
  const value = row ? row.leadInvalidAt : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LIVE";
  if (value === false || value === "false" || value === "0" || value === 0) return "EMPTY";
  return clip(value, 48);
}

function codeReadable(raw: VodValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("leadInvalidAt" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function vodState(raw: VodValue): VodState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["LIVE", "FRESH", "OPEN", "YES", "CLEAR", "VALID"]);
const BENCH_TITLES = new Set(["CALL", "NOTE", "PING", "MEET"]);
const WAIT_TITLES = new Set(["SOON", "LATER", "QUEUE", "HOLD"]);
const RETURN_TITLES = new Set(["FAIL", "VOID", "DENY", "LOST"]);
const PAIR_TITLES = new Set(["BOTH", "DUAL"]);
const BARE_TITLES = new Set(["NONE", "NO", "BLANK", "EMPTY"]);

/** A known caption maps first. A plus joins two captions. A colon that is not a time marks a scoped caption. A time today is leading. Within two days is the desk. Within seven days waits. Older is returned. Quiet or hidden is shut. A brief caption is exactly two characters. A digit caption starts with a digit and is not a time. A long caption is eight characters or longer. A vowel caption starts with a vowel. The words resident and known lead. */
export function vodLane(raw: VodValue, now = Date.now()): VodLane {
  if (vodState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "court";
  if (BENCH_TITLES.has(upper)) return "bench";
  if (WAIT_TITLES.has(upper)) return "wait";
  if (RETURN_TITLES.has(upper)) return "return";
  if (PAIR_TITLES.has(upper)) return "pair";
  if (BARE_TITLES.has(upper)) return "bare";
  if (/quiet|hidden/i.test(text)) return "shut";
  if (text.includes("+")) return "pair";
  const at = Date.parse(text);
  if (!Number.isNaN(at)) {
    if (at > now) return "court";
    const day = 86400000;
    const left = new Date(at);
    const right = new Date(now);
    const sameDay = left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
    if (sameDay) return "court";
    const age = now - at;
    if (age < 3 * day) return "bench";
    if (age < 14 * day) return "wait";
    return "return";
  }
  if (text.includes(":")) return "scope";
  if (/^[0-9]/.test(text)) return "digit";
  if (text.length === 3) return "short";
  if (/\bvalid\b|\bfresh\b/i.test(text)) return "court";
  if (text.length >= 10) return "span";
  if (/^[aeiou]/i.test(text)) return "openv";
  return "bare";
}

export function vodHue(raw: VodValue, now = Date.now()): VodHue {
  const mail = vodLane(raw, now);
  if (!mail) return "";
  if (mail === "court" || mail === "pair") return "champagne";
  if (mail === "bench" || mail === "return" || mail === "scope" || mail === "span") return "graphite";
  return "ivory";
}

export function vodCourt(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "court";
}

export function vodShut(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "shut";
}

export function vodWait(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "wait";
}

export function vodReturn(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "return";
}

export function vodBench(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "bench";
}

export function vodPair(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "pair";
}

export function vodScope(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "scope";
}

export function vodShort(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "short";
}

export function vodSpan(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "span";
}

export function vodStampLane(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "digit";
}

export function vodVowelLane(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "openv";
}

export function vodBare(raw: VodValue, now = Date.now()): boolean {
  return vodLane(raw, now) === "bare";
}

export function vodOpen(raw: VodValue): boolean {
  return vodState(raw) === "clear";
}

/** A long caption or a digit caption can stay as written. */
export function vodHeld(raw: VodValue): boolean {
  const mail = vodLane(raw);
  return mail === "span" || mail === "digit";
}

/** A brief caption, or a five-character caption that is not a known title, still wants a fuller name. */
export function vodSoon(raw: VodValue, now = Date.now()): boolean {
  if (vodState(raw) !== "set") return false;
  if (vodShort(raw, now)) return true;
  if (vodCourt(raw, now) || vodShut(raw, now) || vodWait(raw, now) || vodReturn(raw, now)) return false;
  return codeGiven(raw).length === 6;
}

export function vodLength(raw: VodValue): number | null {
  if (vodState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function vodEven(raw: VodValue): boolean {
  const length = vodLength(raw);
  return length !== null && length % 2 === 0;
}

export function vodOdd(raw: VodValue): boolean {
  const length = vodLength(raw);
  return length !== null && length % 2 === 1;
}

export function vodFirst(raw: VodValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function vodTail(raw: VodValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function vodSpace(raw: VodValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function vodVowel(raw: VodValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function vodDigit(raw: VodValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function vodLetter(raw: VodValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function vodMixed(raw: VodValue): boolean {
  return vodDigit(raw) && vodLetter(raw);
}

export function vodLower(raw: VodValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital caption is five letters or more, written entirely in capitals. */
export function vodUpper(raw: VodValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function vodStamp(raw: VodValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function vodCopy(raw: VodValue): string {
  return codeGiven(raw);
}

export function vodFamily(raw: VodValue): string {
  if (vodState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function vodLanes(rows: readonly VodRow[]): VodLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of VOID_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = vodLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return VOID_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingVod(rows: readonly VodRow[]): string {
  const lines = vodLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || VOID_LANES.indexOf(a.mail as (typeof VOID_LANES)[number]) - VOID_LANES.indexOf(b.mail as (typeof VOID_LANES)[number]))[0].mail;
}

export function leadingVodHue(rows: readonly VodRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of VOID_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = vodHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = VOID_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || VOID_HUES.indexOf(a.hue) - VOID_HUES.indexOf(b.hue))[0].hue;
}

export function laneVodCount(rows: readonly VodRow[], mail: VodLane): number {
  return rows.filter((row) => vodLane(row.code) === mail).length;
}

export function vodShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentVodLanes(rows: readonly VodRow[]): string[] {
  return vodLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenVod(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedVod(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleVod(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleVodReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkVodReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleVodLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: VodRow, shape: VodShape): boolean {
  if (shape === "all") return true;
  if (shape === "court") return vodCourt(row.code);
  if (shape === "shut") return vodShut(row.code);
  if (shape === "wait") return vodWait(row.code);
  if (shape === "return") return vodReturn(row.code);
  if (shape === "pair") return vodPair(row.code);
  if (shape === "scope") return vodScope(row.code);
  if (shape === "short") return vodShort(row.code);
  if (shape === "span") return vodSpan(row.code);
  if (shape === "digit") return vodStampLane(row.code);
  if (shape === "openv") return vodVowelLane(row.code);
  if (shape === "bare") return vodBare(row.code);
  if (shape === "open") return vodOpen(row.code);
  if (shape === "soon") return vodSoon(row.code);
  if (shape === "letter") return vodLetter(row.code);
  if (shape === "mixed") return vodMixed(row.code);
  if (shape === "upper") return vodUpper(row.code);
  if (shape === "lower") return vodLower(row.code);
  if (shape === "space") return vodSpace(row.code);
  if (shape === "even") return vodEven(row.code);
  if (shape === "odd") return vodOdd(row.code);
  if (shape === "tail") return vodTail(row.code);
  if (shape === "first") return vodFirst(row.code);
  if (shape === "held") return vodHeld(row.code);
  return vodLane(row.code) === shape;
}

export function visibleVod(
  rows: readonly VodRow[],
  mail: string,
  hue: string,
  query: string,
  review: VodReview,
  reviewed: readonly string[],
  shape: VodShape,
): VodRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (vodState(row.code) === "") return false;
    const found = vodLane(row.code);
    const hueName = vodHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${vodStamp(row.code)} ${vodFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function vodLanesCsv(rows: readonly VodRow[]): string {
  const lines = ["lane,count"];
  for (const line of vodLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function vodRowsCsv(rows: readonly VodRow[], reviewed: readonly string[]): string {
  const lines = ["name,leadInvalidAt,stamp,family,lane,hue,length,court,shut,wait,bench,return,pair,scope,short,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(vodCopy(row.code)),
        vodStamp(row.code),
        csvCell(vodFamily(row.code)),
        vodLane(row.code),
        vodHue(row.code),
        vodLength(row.code) ?? "",
        vodCourt(row.code) ? "1" : "0",
        vodShut(row.code) ? "1" : "0",
        vodWait(row.code) ? "1" : "0",
        vodBench(row.code) ? "1" : "0",
        vodReturn(row.code) ? "1" : "0",
        vodPair(row.code) ? "1" : "0",
        vodScope(row.code) ? "1" : "0",
        vodShort(row.code) ? "1" : "0",
        vodEven(row.code) ? "1" : "0",
        vodDigit(row.code) ? "1" : "0",
        vodMixed(row.code) ? "1" : "0",
        vodUpper(row.code) ? "1" : "0",
        vodVowel(row.code) ? "1" : "0",
        vodTail(row.code) ? "1" : "0",
        vodHeld(row.code) ? "1" : "0",
        vodSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
