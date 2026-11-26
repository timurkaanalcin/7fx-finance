/**
 * Plique-à-jour lanterns kept in this browser,
 * and frost marks read the registration country already stored on the account.
 * Points are north, east, south, and west. Foils are gold, ivory, and ink.
 * Quarters are 15, 30, 45, or 90 minutes. Panes are 2, 4, or 8.
 * North and east are the warm half. South and west are the cool half.
 * Home, native, born, root, land, and here are the court. Visit, mail, wire, and ping sit the bench.
 * Soon, later, queue, and pause wait. Away, void, deny, and lost are returned.
 * Both and dual are paired. None, no, blank, and empty stay bare.
 * A plus joins two marks. A colon that is not a time marks a scoped mark.
 * A time today is the court. Within two days is the bench. Within ten days waits. Older is returned.
 * A short mark is exactly two characters. A digit mark starts with a digit and is not a time.
 * A span mark is eight characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * The words resident and known are the court. Hush or sealed is shut.
 * A true mark reads as HOME. A false mark reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved country.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_plique_lantern (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   point text not null default '',
 *   sla_min integer,
 *   foil text not null default '',
 *   pane integer not null default 2,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pinned boolean not null default false,
 *   vaulted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_frost_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_frost_review (
 *   trader_id text primary key
 * );
 */

export const PLQ_KEY = "crmv4-plique-375";
export const PLQ_VIEW_KEY = "crmv4-plique-views-375";
export const PLQ_DENSITY_KEY = "crmv4-plique-density-375";
export const PLQ_POINTS = ["north", "east", "south", "west"] as const;

export type LanternPoint = (typeof PLQ_POINTS)[number];
export type LanternFinish = "blank" | "gold" | "ivory" | "ink";
export type LanternTray = "bench" | "pin" | "vault";
export type LanternDensity = "open" | "tight";
export type LanternSort = "watch" | "watcher";

export type Lantern = {
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

export type LanternView = {
  id: string;
  name: string;
  tray: LanternTray;
  query: string;
  watcher: string;
  finish: string;
  watch: string;
  sla: string;
  bead: string;
};

export type LanternCounts = {
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

export const ROUND375_FEATURES = [
  "plique-save",
  "lantern-reminders",
  "plique-compass",
  "plique-search",
  "lantern-quarter-sla",
  "lantern-casket",
  "plique-star",
  "plique-inline-title",
  "plique-filters",
  "saved-plique-views",
  "plique-density",
  "lantern-focus",
  "plique-kpis",
  "lantern-chart",
  "lantern-timeline",
  "plique-bulk",
  "plique-csv",
  "plique-keys",
  "plique-audit",
  "least-open-keeper",
  "plique-viewer",
  "suggest-compass",
  "overdue-west",
  "frost-marks",
  "frost-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "raise", "free", "pin", "return", "vault", "open", "tag", "bead", "sla", "lower", "star"] as const;
const FINISHES = ["gold", "ivory", "ink"] as const;
const SLA_CYCLE = [15, 30, 45, 90] as const;
const DEPTH_CYCLE = [2, 4, 8] as const;
const DAY = new Set(["north", "east"]);
const NIGHT = new Set(["south", "west"]);
const QUIET_FINISH = new Set(["INK"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LanternTray {
  return raw === "pin" || raw === "vault" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<LanternFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<LanternFinish, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[pq]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Lantern, tray: LanternTray): boolean {
  if (tray === "pin") return card.pinned && !card.vaulted;
  if (tray === "vault") return card.vaulted;
  return !card.pinned && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function watchIndex(watch: string): number {
  return PLQ_POINTS.indexOf(watch as LanternPoint);
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

export function lanternPoint(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (PLQ_POINTS as readonly string[]).includes(text) ? text : "";
}

/** A minute mark is 15, 30, 45, or 90. Anything else stays blank. */
export function lanternSla(raw: unknown): 15 | 30 | 45 | 90 | null {
  const text = wholeToken(raw);
  if (text !== "15" && text !== "30" && text !== "45" && text !== "90") return null;
  return Number(text) as 15 | 30 | 45 | 90;
}

/** A bead count is 2, 4, or 8. Anything else stays blank. */
export function lanternDepth(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A finish is gilt, ash, or mist. The saved name is the upper token. */
export function lanternFinish(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function lanternWarm(watch: unknown): boolean {
  return DAY.has(clip(watch, 12).toLowerCase());
}

export function lanternCool(watch: unknown): boolean {
  return NIGHT.has(clip(watch, 12).toLowerCase());
}

/** Dawn is morning. Noon is midday. Dusk is evening. Night is late. */
export function lanternBand(watch: unknown): string {
  const text = lanternPoint(watch);
  if (!text) return "";
  if (text === "north") return "morning";
  if (text === "east") return "midday";
  if (text === "south") return "evening";
  return "late";
}

/** Signed distance from one window to another along the day. */
export function lanternGap(from: unknown, to: unknown): number | null {
  const left = watchIndex(lanternPoint(from));
  const right = watchIndex(lanternPoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietSoot(finish: unknown): boolean {
  return QUIET_FINISH.has(lanternFinish(finish));
}

/** A pair bead is 4. Two and eight are not a pair. */
export function pairPane(bead: unknown): boolean {
  return lanternDepth(bead) === 4;
}

/** A full bead is 8. */
export function fullPane(bead: unknown): boolean {
  return lanternDepth(bead) === 8;
}

export function activePoint(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return lanternPoint(text) || "all";
}

export function activeQuarter(raw: unknown): string {
  const sla = lanternSla(raw);
  return sla === null ? "all" : String(sla);
}

export function activeFoil(raw: unknown, allow: readonly string[]): string {
  const text = lanternFinish(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePane(raw: unknown): string {
  const bead = lanternDepth(raw);
  return bead === null ? "all" : String(bead);
}

export function moveLanternFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The finish the bench uses least. A tie keeps mist, then gilt, then ash. */
export function suggestFoil(cards: readonly Lantern[]): string {
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
export function suggestQuarter(cards: readonly Lantern[], hour: number): 15 | 30 | 45 | 90 {
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

export function suggestPoint(hour: number): LanternPoint {
  if (hour < 6) return "north";
  if (hour < 12) return "east";
  if (hour < 18) return "south";
  return "west";
}

/** The watcher with the fewest unraised ribbons on the bench. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Lantern[], roster: string): string {
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

export function readLanterns(raw: unknown): Lantern[] {
  if (!Array.isArray(raw)) return [];
  const out: Lantern[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Lantern>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      watcher: clip(row.watcher, 24),
      watch: lanternPoint(row.watch),
      sla: lanternSla(row.sla),
      finish: lanternFinish(row.finish),
      bead: lanternDepth(row.bead) ?? 2,
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

export function addLantern(
  cards: readonly Lantern[],
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
): Lantern[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `w${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readLanterns([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      watcher: clip(card.watcher, 24),
      watch: lanternPoint(card.watch),
      sla: lanternSla(card.sla),
      finish: lanternFinish(card.finish),
      bead: lanternDepth(card.bead) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      vaulted: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Lantern[], id: string, edit: (card: Lantern) => Lantern): Lantern[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editLantern(cards: readonly Lantern[], id: string, title: string): Lantern[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editLanternNote(cards: readonly Lantern[], id: string, note: string): Lantern[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFinish(finish: string): string {
  const order = ["", "GOLD", "IVORY", "INK"];
  const index = order.indexOf(lanternFinish(finish));
  return order[(index + 1) % order.length] || "GOLD";
}

export function setLanternFinish(cards: readonly Lantern[], id: string, finish: string): Lantern[] {
  const next = lanternFinish(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "film" }));
}

export function setLanternRaised(cards: readonly Lantern[], id: string, raised: boolean): Lantern[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setLanternPin(cards: readonly Lantern[], id: string, pinned: boolean): Lantern[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, vaulted: pinned ? false : card.vaulted, audit: pinned ? "pin" : "return" }));
}

export function setLanternCoffer(cards: readonly Lantern[], id: string, vaulted: boolean): Lantern[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, pinned: vaulted ? false : card.pinned, audit: vaulted ? "vault" : "open" }));
}

export function setLanternStar(cards: readonly Lantern[], id: string, starred: boolean): Lantern[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addLanternTag(cards: readonly Lantern[], id: string, tag: string): Lantern[] {
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

function stepDepth(bead: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = depthIndex(bead);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseSlaFocused(cards: readonly Lantern[], id: string): Lantern[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSla(card.sla, 1), audit: "sla" }));
}

export function lowerSlaFocused(cards: readonly Lantern[], id: string): Lantern[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSla(card.sla, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Lantern[], id: string): Lantern[] {
  return mapCard(cards, id, (card) => ({ ...card, bead: stepDepth(card.bead, 1), audit: "bead" }));
}

export function lowerDepthFocused(cards: readonly Lantern[], id: string): Lantern[] {
  return mapCard(cards, id, (card) => ({ ...card, bead: stepDepth(card.bead, -1), audit: "bead" }));
}

export function setLanternFocused(cards: readonly Lantern[], id: string): Lantern[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function pinLanternFocused(cards: readonly Lantern[], id: string): Lantern[] {
  return setLanternPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starLanternFocused(cards: readonly Lantern[], id: string): Lantern[] {
  return setLanternStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Lantern[], id: string): Lantern[] {
  const card = cards.find((item) => item.id === id);
  return card ? setLanternFinish(cards, id, cycleFinish(card.finish)) : [...cards];
}

function bulk(cards: readonly Lantern[], ids: readonly string[], edit: (card: Lantern) => Lantern): Lantern[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkLanternInk(cards: readonly Lantern[], ids: readonly string[]): Lantern[] {
  return bulk(cards, ids, (card) => (card.finish === "INK" ? card : { ...card, finish: "INK", audit: "film" }));
}

export function bulkLanternRaise(cards: readonly Lantern[], ids: readonly string[]): Lantern[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkLanternCoffer(cards: readonly Lantern[], ids: readonly string[]): Lantern[] {
  return bulk(cards, ids, (card) => (card.vaulted ? card : { ...card, vaulted: true, pinned: false, audit: "vault" }));
}

export function bulkLanternTag(cards: readonly Lantern[], ids: readonly string[]): Lantern[] {
  return bulk(cards, ids, (card) => (card.tags.includes("d") ? card : { ...card, tags: tagsOf([...card.tags, "d"]), audit: "tag" }));
}

export function readLanternViews(raw: unknown): LanternView[] {
  if (!Array.isArray(raw)) return [];
  const out: LanternView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LanternView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      watcher: clip(row.watcher, 24),
      finish: activeFoil(row.finish, ["GOLD", "IVORY", "INK"]),
      watch: activePoint(row.watch),
      sla: activeQuarter(row.sla),
      bead: activePane(row.bead),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addLanternView(views: readonly LanternView[], view: LanternView): LanternView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readLanternViews([...views, { ...view, id, name }]);
}

export function dropLanternView(views: readonly LanternView[], id: string): LanternView[] {
  return views.filter((view) => view.id !== id);
}

export function lanternDensity(raw: unknown): LanternDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortLanterns(cards: readonly Lantern[], sort: LanternSort): Lantern[] {
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

export function visibleLanterns(
  cards: readonly Lantern[],
  tray: LanternTray,
  query: string,
  watcher: string,
  finish: string,
  watch: string,
  sla: string,
  bead: string,
): Lantern[] {
  const text = query.trim().toLowerCase();
  const wantWatcher = clip(watcher, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : lanternFinish(finish);
  const wantWatch = activePoint(watch);
  const wantSla = activeQuarter(sla);
  const wantBead = activePane(bead);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.watcher}`.toLowerCase().includes(text)) return false;
    if (wantWatcher && card.watcher.toLowerCase() !== wantWatcher) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantWatch === "inner" && !lanternWarm(card.watch)) return false;
    if (wantWatch === "outer" && !lanternCool(card.watch)) return false;
    if (wantWatch !== "all" && wantWatch !== "inner" && wantWatch !== "outer" && card.watch !== wantWatch) return false;
    if (wantSla !== "all" && String(card.sla ?? "") !== wantSla) return false;
    if (wantBead !== "all" && String(card.bead) !== wantBead) return false;
    return true;
  });
}

/** A night window on bead two, still not raised and not in the vault, is overdue. */
export function overdueLantern(card: Lantern): boolean {
  return lanternCool(card.watch) && card.bead === 2 && !card.raised && !card.vaulted;
}

/** No finish, fifteen minutes, bead two, and still on the bench. */
export function idleLantern(card: Lantern): boolean {
  return !card.finish && card.sla === 15 && card.bead === 2 && !card.raised && !card.pinned && !card.vaulted;
}

/** Gilt, ninety minutes, and a full bead, still out of the vault. */
export function briskLantern(card: Lantern): boolean {
  return card.finish === "GOLD" && card.sla === 90 && card.bead === 8 && !card.vaulted;
}

/** Night, mist, and thirty minutes. */
export function restingLantern(card: Lantern): boolean {
  return card.watch === "west" && card.finish === "IVORY" && card.sla === 30;
}

/** A dawn ribbon is late when the station is already night. */
export function lateLantern(card: Lantern, station: string): boolean {
  return card.watch === "north" && lanternPoint(station) === "west" && !card.raised;
}

export function lanternCounts(cards: readonly Lantern[], shown: readonly Lantern[], station: string): LanternCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    pin: cards.filter((card) => inTray(card, "pin")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    raised: cards.filter((card) => card.raised).length,
    day: cards.filter((card) => lanternWarm(card.watch)).length,
    night: cards.filter((card) => lanternCool(card.watch)).length,
    long: cards.filter((card) => card.sla === 90).length,
    quiet: cards.filter((card) => quietSoot(card.finish)).length,
    minutes: cards.reduce((sum, card) => sum + (card.sla || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleLantern).length,
    brisk: cards.filter(briskLantern).length,
    resting: cards.filter(restingLantern).length,
    overdue: cards.filter(overdueLantern).length,
    pair: cards.filter((card) => pairPane(card.bead) && lateLantern(card, station)).length,
  };
}

export function lanternBars(cards: readonly Lantern[]): { watch: string; count: number }[] {
  return PLQ_POINTS.map((watch) => ({ watch, count: cards.filter((card) => card.watch === watch && !card.vaulted).length }));
}

export function lanternTimeline(cards: readonly Lantern[]): { sla: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return SLA_CYCLE.map((sla) => ({ sla, titles: open.filter((card) => card.sla === sla).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function lanternKeepers(cards: readonly Lantern[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.watcher && !out.some((name) => name.toLowerCase() === card.watcher.toLowerCase())) out.push(card.watcher);
  }
  return out;
}

export function busiestKeeper(cards: readonly Lantern[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.raised && card.watcher);
  let best = "";
  let score = 0;
  for (const name of lanternKeepers(open)) {
    const count = open.filter((card) => card.watcher.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderLanterns(cards: readonly Lantern[]): string[] {
  return cards.filter(overdueLantern).map((card) => card.title);
}

export function lanternCopy(card: Lantern): string {
  return [card.title, card.watcher, card.watch, card.finish, card.sla ?? "", card.bead, card.note].filter((item) => item !== "").join(" · ");
}

export function lanternCsv(cards: readonly Lantern[], station: string): string {
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
        lanternCool(card.watch) ? "1" : "0",
        lateLantern(card, station) ? "1" : "0",
        idleLantern(card) ? "1" : "0",
        briskLantern(card) ? "1" : "0",
        restingLantern(card) ? "1" : "0",
        overdueLantern(card) ? "1" : "0",
        lanternWarm(card.watch) ? "1" : "0",
        quietSoot(card.finish) ? "1" : "0",
        lanternBand(card.watch),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const VOD_KEY = "crmv4-frost-hide-375";
export const VOD_REVIEW_KEY = "crmv4-frost-review-375";

export type FrsLane = "" | "court" | "shut" | "wait" | "bench" | "return" | "pair" | "scope" | "short" | "span" | "digit" | "openv" | "bare";
export type FrsHue = "" | "ivory" | "graphite" | "champagne";
export type FrsState = "" | "clear" | "set";
export type FrsReview = "all" | "reviewed" | "fresh";
export type FrsShape =
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

export type FrsValue = string | { registrationCountry?: unknown; [key: string]: unknown } | null | undefined;
export type FrsRow = { id: string; label: string; code: FrsValue; userId?: string };
export type FrsLaneLine = { mail: string; count: number };

const VOID_LANES = ["court", "shut", "wait", "bench", "return", "pair", "scope", "short", "span", "digit", "openv", "bare"] as const;
const VOID_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: FrsValue): { registrationCountry?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: FrsValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: FrsValue): string {
  const row = codeRecord(raw);
  if (row && !("registrationCountry" in row)) return "";
  const value = row ? row.registrationCountry : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "HOME";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: FrsValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("registrationCountry" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function frsState(raw: FrsValue): FrsState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["HOME", "NATIVE", "BORN", "ROOT", "LAND", "HERE"]);
const BENCH_TITLES = new Set(["VISIT", "MAIL", "WIRE", "PING"]);
const WAIT_TITLES = new Set(["SOON", "LATER", "QUEUE", "PAUSE"]);
const RETURN_TITLES = new Set(["AWAY", "VOID", "DENY", "LOST"]);
const PAIR_TITLES = new Set(["BOTH", "DUAL"]);
const BARE_TITLES = new Set(["NONE", "NO", "BLANK", "EMPTY"]);

/** A known caption maps first. A plus joins two captions. A colon that is not a time marks a scoped caption. A time today is leading. Within two days is the desk. Within seven days waits. Older is returned. Quiet or hidden is shut. A brief caption is exactly two characters. A digit caption starts with a digit and is not a time. A long caption is eight characters or longer. A vowel caption starts with a vowel. The words resident and known lead. */
export function frsLane(raw: FrsValue, now = Date.now()): FrsLane {
  if (frsState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "court";
  if (BENCH_TITLES.has(upper)) return "bench";
  if (WAIT_TITLES.has(upper)) return "wait";
  if (RETURN_TITLES.has(upper)) return "return";
  if (PAIR_TITLES.has(upper)) return "pair";
  if (BARE_TITLES.has(upper)) return "bare";
  if (/hush|sealed/i.test(text)) return "shut";
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
    if (age < 2 * day) return "bench";
    if (age < 10 * day) return "wait";
    return "return";
  }
  if (text.includes(":")) return "scope";
  if (/^[0-9]/.test(text)) return "digit";
  if (text.length === 2) return "short";
  if (/\bresident\b|\bknown\b/i.test(text)) return "court";
  if (text.length >= 8) return "span";
  if (/^[aeiou]/i.test(text)) return "openv";
  return "bare";
}

export function frsHue(raw: FrsValue, now = Date.now()): FrsHue {
  const mail = frsLane(raw, now);
  if (!mail) return "";
  if (mail === "court" || mail === "pair") return "champagne";
  if (mail === "bench" || mail === "return" || mail === "scope" || mail === "span") return "graphite";
  return "ivory";
}

export function frsCourt(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "court";
}

export function frsShut(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "shut";
}

export function frsWait(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "wait";
}

export function frsReturn(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "return";
}

export function frsBench(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "bench";
}

export function frsPair(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "pair";
}

export function frsScope(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "scope";
}

export function frsShort(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "short";
}

export function frsSpan(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "span";
}

export function frsStampLane(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "digit";
}

export function frsVowelLane(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "openv";
}

export function frsBare(raw: FrsValue, now = Date.now()): boolean {
  return frsLane(raw, now) === "bare";
}

export function frsOpen(raw: FrsValue): boolean {
  return frsState(raw) === "clear";
}

/** A long caption or a digit caption can stay as written. */
export function frsHeld(raw: FrsValue): boolean {
  const mail = frsLane(raw);
  return mail === "span" || mail === "digit";
}

/** A brief caption, or a five-character caption that is not a known title, still wants a fuller name. */
export function frsSoon(raw: FrsValue, now = Date.now()): boolean {
  if (frsState(raw) !== "set") return false;
  if (frsShort(raw, now)) return true;
  if (frsCourt(raw, now) || frsShut(raw, now) || frsWait(raw, now) || frsReturn(raw, now)) return false;
  return codeGiven(raw).length === 4;
}

export function frsLength(raw: FrsValue): number | null {
  if (frsState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function frsEven(raw: FrsValue): boolean {
  const length = frsLength(raw);
  return length !== null && length % 2 === 0;
}

export function frsOdd(raw: FrsValue): boolean {
  const length = frsLength(raw);
  return length !== null && length % 2 === 1;
}

export function frsFirst(raw: FrsValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function frsTail(raw: FrsValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function frsSpace(raw: FrsValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function frsVowel(raw: FrsValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function frsDigit(raw: FrsValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function frsLetter(raw: FrsValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function frsMixed(raw: FrsValue): boolean {
  return frsDigit(raw) && frsLetter(raw);
}

export function frsLower(raw: FrsValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital caption is five letters or more, written entirely in capitals. */
export function frsUpper(raw: FrsValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function frsStamp(raw: FrsValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function frsCopy(raw: FrsValue): string {
  return codeGiven(raw);
}

export function frsFamily(raw: FrsValue): string {
  if (frsState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function frsLanes(rows: readonly FrsRow[]): FrsLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of VOID_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = frsLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return VOID_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingFrs(rows: readonly FrsRow[]): string {
  const lines = frsLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || VOID_LANES.indexOf(a.mail as (typeof VOID_LANES)[number]) - VOID_LANES.indexOf(b.mail as (typeof VOID_LANES)[number]))[0].mail;
}

export function leadingFrsHue(rows: readonly FrsRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of VOID_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = frsHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = VOID_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || VOID_HUES.indexOf(a.hue) - VOID_HUES.indexOf(b.hue))[0].hue;
}

export function laneFrsCount(rows: readonly FrsRow[], mail: FrsLane): number {
  return rows.filter((row) => frsLane(row.code) === mail).length;
}

export function frsShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentFrsLanes(rows: readonly FrsRow[]): string[] {
  return frsLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenFrs(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedFrs(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleFrs(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleFrsReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkFrsReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleFrsLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: FrsRow, shape: FrsShape): boolean {
  if (shape === "all") return true;
  if (shape === "court") return frsCourt(row.code);
  if (shape === "shut") return frsShut(row.code);
  if (shape === "wait") return frsWait(row.code);
  if (shape === "return") return frsReturn(row.code);
  if (shape === "pair") return frsPair(row.code);
  if (shape === "scope") return frsScope(row.code);
  if (shape === "short") return frsShort(row.code);
  if (shape === "span") return frsSpan(row.code);
  if (shape === "digit") return frsStampLane(row.code);
  if (shape === "openv") return frsVowelLane(row.code);
  if (shape === "bare") return frsBare(row.code);
  if (shape === "open") return frsOpen(row.code);
  if (shape === "soon") return frsSoon(row.code);
  if (shape === "letter") return frsLetter(row.code);
  if (shape === "mixed") return frsMixed(row.code);
  if (shape === "upper") return frsUpper(row.code);
  if (shape === "lower") return frsLower(row.code);
  if (shape === "space") return frsSpace(row.code);
  if (shape === "even") return frsEven(row.code);
  if (shape === "odd") return frsOdd(row.code);
  if (shape === "tail") return frsTail(row.code);
  if (shape === "first") return frsFirst(row.code);
  if (shape === "held") return frsHeld(row.code);
  return frsLane(row.code) === shape;
}

export function visibleFrs(
  rows: readonly FrsRow[],
  mail: string,
  hue: string,
  query: string,
  review: FrsReview,
  reviewed: readonly string[],
  shape: FrsShape,
): FrsRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (frsState(row.code) === "") return false;
    const found = frsLane(row.code);
    const hueName = frsHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${frsStamp(row.code)} ${frsFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function frsLanesCsv(rows: readonly FrsRow[]): string {
  const lines = ["lane,count"];
  for (const line of frsLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function frsRowsCsv(rows: readonly FrsRow[], reviewed: readonly string[]): string {
  const lines = ["name,registrationCountry,stamp,family,lane,hue,length,court,shut,wait,bench,return,pair,scope,short,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(frsCopy(row.code)),
        frsStamp(row.code),
        csvCell(frsFamily(row.code)),
        frsLane(row.code),
        frsHue(row.code),
        frsLength(row.code) ?? "",
        frsCourt(row.code) ? "1" : "0",
        frsShut(row.code) ? "1" : "0",
        frsWait(row.code) ? "1" : "0",
        frsBench(row.code) ? "1" : "0",
        frsReturn(row.code) ? "1" : "0",
        frsPair(row.code) ? "1" : "0",
        frsScope(row.code) ? "1" : "0",
        frsShort(row.code) ? "1" : "0",
        frsEven(row.code) ? "1" : "0",
        frsDigit(row.code) ? "1" : "0",
        frsMixed(row.code) ? "1" : "0",
        frsUpper(row.code) ? "1" : "0",
        frsVowel(row.code) ? "1" : "0",
        frsTail(row.code) ? "1" : "0",
        frsHeld(row.code) ? "1" : "0",
        frsSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
