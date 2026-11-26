/**
 * Paillon spangles kept in this browser,
 * and retention notes read the retention note already stored on the account.
 * Hours are dawn, noon, dusk, and night. Foils are gold, ivory, and ink.
 * Spans are 12, 24, 36, or 48 minutes. Leaves are 3, 6, or 9.
 * Dawn and noon are the warm half. Dusk and night are the cool half.
 * Keep, hold, stay, warm, care, and near are the court. Call, note, ping, and meet sit the bench.
 * Week, month, next, and defer wait. Lost, gone, drop, and cold are returned.
 * Twin and join are paired. None, nil, blank, and empty stay bare.
 * A plus joins two notes. A colon that is not a time marks a scoped note.
 * A time today is the court. Within three days is the bench. Within fourteen days waits. Older is returned.
 * A short note is exactly three characters. A digit note starts with a digit and is not a time.
 * A span note is ten characters or longer and does not start with a digit. A vowel note starts with a vowel.
 * The words follow and retain are the court. Quiet, sealed, or private is shut.
 * A true note reads as KEEP. A false note reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved note.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_paillon_spangle (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   setter text not null default '',
 *   hour text not null default '',
 *   sla_min integer,
 *   foil text not null default '',
 *   leaf integer not null default 3,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pinned boolean not null default false,
 *   vaulted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_retain_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_retain_review (
 *   trader_id text primary key
 * );
 */

export const PLN_KEY = "crmv4-paillon-376";
export const PLN_VIEW_KEY = "crmv4-paillon-views-376";
export const PLN_DENSITY_KEY = "crmv4-paillon-density-376";
export const PLN_POINTS = ["dawn", "noon", "dusk", "night"] as const;

export type SpanglePoint = (typeof PLN_POINTS)[number];
export type SpangleFinish = "blank" | "gold" | "ivory" | "ink";
export type SpangleTray = "bench" | "pin" | "vault";
export type SpangleDensity = "open" | "tight";
export type SpangleSort = "watch" | "watcher";

export type Spangle = {
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

export type SpangleView = {
  id: string;
  name: string;
  tray: SpangleTray;
  query: string;
  watcher: string;
  finish: string;
  watch: string;
  sla: string;
  bead: string;
};

export type SpangleCounts = {
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

export const ROUND376_FEATURES = [
  "paillon-save",
  "spangle-reminders",
  "paillon-hours",
  "paillon-search",
  "spangle-span-sla",
  "spangle-casket",
  "paillon-star",
  "paillon-inline-title",
  "paillon-filters",
  "saved-paillon-views",
  "paillon-density",
  "spangle-focus",
  "paillon-kpis",
  "spangle-chart",
  "spangle-timeline",
  "paillon-bulk",
  "paillon-csv",
  "paillon-keys",
  "paillon-audit",
  "least-open-setter",
  "paillon-viewer",
  "suggest-hour",
  "overdue-night",
  "retention-notes",
  "retention-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "raise", "free", "pin", "return", "vault", "open", "tag", "bead", "sla", "lower", "star"] as const;
const FINISHES = ["gold", "ivory", "ink"] as const;
const SLA_CYCLE = [12, 24, 36, 48] as const;
const DEPTH_CYCLE = [3, 6, 9] as const;
const DAY = new Set(["dawn", "noon"]);
const NIGHT = new Set(["dusk", "night"]);
const QUIET_FINISH = new Set(["INK"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SpangleTray {
  return raw === "pin" || raw === "vault" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<SpangleFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<SpangleFinish, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[rs]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Spangle, tray: SpangleTray): boolean {
  if (tray === "pin") return card.pinned && !card.vaulted;
  if (tray === "vault") return card.vaulted;
  return !card.pinned && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function watchIndex(watch: string): number {
  return PLN_POINTS.indexOf(watch as SpanglePoint);
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

export function spanglePoint(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (PLN_POINTS as readonly string[]).includes(text) ? text : "";
}

/** A minute mark is 12, 24, 36, or 48. Anything else stays blank. */
export function spangleSla(raw: unknown): 12 | 24 | 36 | 48 | null {
  const text = wholeToken(raw);
  if (text !== "12" && text !== "24" && text !== "36" && text !== "48") return null;
  return Number(text) as 12 | 24 | 36 | 48;
}

/** A leaf count is 3, 6, or 9. Anything else stays blank. */
export function spangleDepth(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A finish is gilt, ash, or mist. The saved name is the upper token. */
export function spangleFinish(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function spangleWarm(watch: unknown): boolean {
  return DAY.has(clip(watch, 12).toLowerCase());
}

export function spangleCool(watch: unknown): boolean {
  return NIGHT.has(clip(watch, 12).toLowerCase());
}

/** Dawn is first. Noon is second. Dusk is third. Night is fourth. */
export function spangleBand(watch: unknown): string {
  const text = spanglePoint(watch);
  if (!text) return "";
  if (text === "dawn") return "first";
  if (text === "noon") return "second";
  if (text === "dusk") return "third";
  return "fourth";
}

/** Signed distance from one window to another along the day. */
export function spangleGap(from: unknown, to: unknown): number | null {
  const left = watchIndex(spanglePoint(from));
  const right = watchIndex(spanglePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietSoot(finish: unknown): boolean {
  return QUIET_FINISH.has(spangleFinish(finish));
}

/** A pair leaf is 6. Three and nine are not a pair. */
export function pairPane(bead: unknown): boolean {
  return spangleDepth(bead) === 6;
}

/** A full leaf is 9. */
export function fullPane(bead: unknown): boolean {
  return spangleDepth(bead) === 9;
}

export function activePoint(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return spanglePoint(text) || "all";
}

export function activeQuarter(raw: unknown): string {
  const sla = spangleSla(raw);
  return sla === null ? "all" : String(sla);
}

export function activeFoil(raw: unknown, allow: readonly string[]): string {
  const text = spangleFinish(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePane(raw: unknown): string {
  const bead = spangleDepth(raw);
  return bead === null ? "all" : String(bead);
}

export function moveSpangleFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The finish the bench uses least. A tie keeps mist, then gilt, then ash. */
export function suggestFoil(cards: readonly Spangle[]): string {
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

/** Before five, suggest twelve. Before eleven, suggest twenty-four. Before seventeen, suggest thirty-six. Later, suggest forty-eight. A saved minute on the bench wins, and a tie keeps the shorter minute. */
export function suggestQuarter(cards: readonly Spangle[], hour: number): 12 | 24 | 36 | 48 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.sla === null) continue;
    seen = true;
    counts.set(card.sla, (counts.get(card.sla) || 0) + 1);
  }
  if (seen) {
    let best: 12 | 24 | 36 | 48 = 12;
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
  if (hour < 5) return 12;
  if (hour < 11) return 24;
  if (hour < 17) return 36;
  return 48;
}

export function suggestPoint(hour: number): SpanglePoint {
  if (hour < 5) return "dawn";
  if (hour < 11) return "noon";
  if (hour < 17) return "dusk";
  return "night";
}

/** The watcher with the fewest unraised ribbons on the bench. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Spangle[], roster: string): string {
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

export function readSpangles(raw: unknown): Spangle[] {
  if (!Array.isArray(raw)) return [];
  const out: Spangle[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Spangle>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      watcher: clip(row.watcher, 24),
      watch: spanglePoint(row.watch),
      sla: spangleSla(row.sla),
      finish: spangleFinish(row.finish),
      bead: spangleDepth(row.bead) ?? 3,
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

export function addSpangle(
  cards: readonly Spangle[],
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
): Spangle[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `w${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readSpangles([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      watcher: clip(card.watcher, 24),
      watch: spanglePoint(card.watch),
      sla: spangleSla(card.sla),
      finish: spangleFinish(card.finish),
      bead: spangleDepth(card.bead) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      vaulted: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Spangle[], id: string, edit: (card: Spangle) => Spangle): Spangle[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editSpangle(cards: readonly Spangle[], id: string, title: string): Spangle[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSpangleNote(cards: readonly Spangle[], id: string, note: string): Spangle[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFinish(finish: string): string {
  const order = ["", "GOLD", "IVORY", "INK"];
  const index = order.indexOf(spangleFinish(finish));
  return order[(index + 1) % order.length] || "GOLD";
}

export function setSpangleFinish(cards: readonly Spangle[], id: string, finish: string): Spangle[] {
  const next = spangleFinish(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "film" }));
}

export function setSpangleRaised(cards: readonly Spangle[], id: string, raised: boolean): Spangle[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setSpanglePin(cards: readonly Spangle[], id: string, pinned: boolean): Spangle[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, vaulted: pinned ? false : card.vaulted, audit: pinned ? "pin" : "return" }));
}

export function setSpangleCoffer(cards: readonly Spangle[], id: string, vaulted: boolean): Spangle[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, pinned: vaulted ? false : card.pinned, audit: vaulted ? "vault" : "open" }));
}

export function setSpangleStar(cards: readonly Spangle[], id: string, starred: boolean): Spangle[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addSpangleTag(cards: readonly Spangle[], id: string, tag: string): Spangle[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSla(sla: number | null, dir: 1 | -1): 12 | 24 | 36 | 48 {
  if (sla === null) return dir > 0 ? 12 : 48;
  const index = slaIndex(sla);
  const next = index < 0 ? 0 : (index + dir + SLA_CYCLE.length) % SLA_CYCLE.length;
  return SLA_CYCLE[next];
}

function stepDepth(bead: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = depthIndex(bead);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseSlaFocused(cards: readonly Spangle[], id: string): Spangle[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSla(card.sla, 1), audit: "sla" }));
}

export function lowerSlaFocused(cards: readonly Spangle[], id: string): Spangle[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSla(card.sla, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Spangle[], id: string): Spangle[] {
  return mapCard(cards, id, (card) => ({ ...card, bead: stepDepth(card.bead, 1), audit: "bead" }));
}

export function lowerDepthFocused(cards: readonly Spangle[], id: string): Spangle[] {
  return mapCard(cards, id, (card) => ({ ...card, bead: stepDepth(card.bead, -1), audit: "bead" }));
}

export function setSpangleFocused(cards: readonly Spangle[], id: string): Spangle[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function pinSpangleFocused(cards: readonly Spangle[], id: string): Spangle[] {
  return setSpanglePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starSpangleFocused(cards: readonly Spangle[], id: string): Spangle[] {
  return setSpangleStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Spangle[], id: string): Spangle[] {
  const card = cards.find((item) => item.id === id);
  return card ? setSpangleFinish(cards, id, cycleFinish(card.finish)) : [...cards];
}

function bulk(cards: readonly Spangle[], ids: readonly string[], edit: (card: Spangle) => Spangle): Spangle[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkSpangleInk(cards: readonly Spangle[], ids: readonly string[]): Spangle[] {
  return bulk(cards, ids, (card) => (card.finish === "INK" ? card : { ...card, finish: "INK", audit: "film" }));
}

export function bulkSpangleRaise(cards: readonly Spangle[], ids: readonly string[]): Spangle[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkSpangleCoffer(cards: readonly Spangle[], ids: readonly string[]): Spangle[] {
  return bulk(cards, ids, (card) => (card.vaulted ? card : { ...card, vaulted: true, pinned: false, audit: "vault" }));
}

export function bulkSpangleTag(cards: readonly Spangle[], ids: readonly string[]): Spangle[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readSpangleViews(raw: unknown): SpangleView[] {
  if (!Array.isArray(raw)) return [];
  const out: SpangleView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SpangleView>;
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

export function addSpangleView(views: readonly SpangleView[], view: SpangleView): SpangleView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readSpangleViews([...views, { ...view, id, name }]);
}

export function dropSpangleView(views: readonly SpangleView[], id: string): SpangleView[] {
  return views.filter((view) => view.id !== id);
}

export function spangleDensity(raw: unknown): SpangleDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortSpangles(cards: readonly Spangle[], sort: SpangleSort): Spangle[] {
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

export function visibleSpangles(
  cards: readonly Spangle[],
  tray: SpangleTray,
  query: string,
  watcher: string,
  finish: string,
  watch: string,
  sla: string,
  bead: string,
): Spangle[] {
  const text = query.trim().toLowerCase();
  const wantWatcher = clip(watcher, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : spangleFinish(finish);
  const wantWatch = activePoint(watch);
  const wantSla = activeQuarter(sla);
  const wantBead = activePane(bead);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.watcher}`.toLowerCase().includes(text)) return false;
    if (wantWatcher && card.watcher.toLowerCase() !== wantWatcher) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantWatch === "inner" && !spangleWarm(card.watch)) return false;
    if (wantWatch === "outer" && !spangleCool(card.watch)) return false;
    if (wantWatch !== "all" && wantWatch !== "inner" && wantWatch !== "outer" && card.watch !== wantWatch) return false;
    if (wantSla !== "all" && String(card.sla ?? "") !== wantSla) return false;
    if (wantBead !== "all" && String(card.bead) !== wantBead) return false;
    return true;
  });
}

/** Night on leaf three, still not raised and not in the vault, is overdue. */
export function overdueSpangle(card: Spangle): boolean {
  return card.watch === "night" && card.bead === 3 && !card.raised && !card.vaulted;
}

/** No finish, twelve minutes, leaf three, and still on the bench. */
export function idleSpangle(card: Spangle): boolean {
  return !card.finish && card.sla === 12 && card.bead === 3 && !card.raised && !card.pinned && !card.vaulted;
}

/** Gilt, forty-eight minutes, and a full leaf, still out of the vault. */
export function briskSpangle(card: Spangle): boolean {
  return card.finish === "GOLD" && card.sla === 48 && card.bead === 9 && !card.vaulted;
}

/** Night, ivory, and twenty-four minutes. */
export function restingSpangle(card: Spangle): boolean {
  return card.watch === "night" && card.finish === "IVORY" && card.sla === 24;
}

/** A dawn spangle is late when the station is already night. */
export function lateSpangle(card: Spangle, station: string): boolean {
  return card.watch === "dawn" && spanglePoint(station) === "night" && !card.raised;
}

export function spangleCounts(cards: readonly Spangle[], shown: readonly Spangle[], station: string): SpangleCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    pin: cards.filter((card) => inTray(card, "pin")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    raised: cards.filter((card) => card.raised).length,
    day: cards.filter((card) => spangleWarm(card.watch)).length,
    night: cards.filter((card) => spangleCool(card.watch)).length,
    long: cards.filter((card) => card.sla === 48).length,
    quiet: cards.filter((card) => quietSoot(card.finish)).length,
    minutes: cards.reduce((sum, card) => sum + (card.sla || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleSpangle).length,
    brisk: cards.filter(briskSpangle).length,
    resting: cards.filter(restingSpangle).length,
    overdue: cards.filter(overdueSpangle).length,
    pair: cards.filter((card) => pairPane(card.bead) && lateSpangle(card, station)).length,
  };
}

export function spangleBars(cards: readonly Spangle[]): { watch: string; count: number }[] {
  return PLN_POINTS.map((watch) => ({ watch, count: cards.filter((card) => card.watch === watch && !card.vaulted).length }));
}

export function spangleTimeline(cards: readonly Spangle[]): { sla: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return SLA_CYCLE.map((sla) => ({ sla, titles: open.filter((card) => card.sla === sla).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function spangleKeepers(cards: readonly Spangle[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.watcher && !out.some((name) => name.toLowerCase() === card.watcher.toLowerCase())) out.push(card.watcher);
  }
  return out;
}

export function busiestKeeper(cards: readonly Spangle[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.raised && card.watcher);
  let best = "";
  let score = 0;
  for (const name of spangleKeepers(open)) {
    const count = open.filter((card) => card.watcher.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderSpangles(cards: readonly Spangle[]): string[] {
  return cards.filter(overdueSpangle).map((card) => card.title);
}

export function spangleCopy(card: Spangle): string {
  return [card.title, card.watcher, card.watch, card.finish, card.sla ?? "", card.bead, card.note].filter((item) => item !== "").join(" · ");
}

export function spangleCsv(cards: readonly Spangle[], station: string): string {
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
        spangleCool(card.watch) ? "1" : "0",
        lateSpangle(card, station) ? "1" : "0",
        idleSpangle(card) ? "1" : "0",
        briskSpangle(card) ? "1" : "0",
        restingSpangle(card) ? "1" : "0",
        overdueSpangle(card) ? "1" : "0",
        spangleWarm(card.watch) ? "1" : "0",
        quietSoot(card.finish) ? "1" : "0",
        spangleBand(card.watch),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const RTN_HIDE_KEY = "crmv4-retain-hide-376";
export const RTN_REVIEW_KEY = "crmv4-retain-review-376";

export type RtnLane = "" | "court" | "shut" | "wait" | "bench" | "return" | "pair" | "scope" | "short" | "span" | "digit" | "openv" | "bare";
export type RtnHue = "" | "ivory" | "graphite" | "champagne";
export type RtnState = "" | "clear" | "set";
export type RtnReview = "all" | "reviewed" | "fresh";
export type RtnShape =
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

export type RtnValue = string | { retentionNote?: unknown; [key: string]: unknown } | null | undefined;
export type RtnRow = { id: string; label: string; code: RtnValue; userId?: string };
export type RtnLaneLine = { mail: string; count: number };

const VOID_LANES = ["court", "shut", "wait", "bench", "return", "pair", "scope", "short", "span", "digit", "openv", "bare"] as const;
const VOID_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: RtnValue): { retentionNote?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: RtnValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: RtnValue): string {
  const row = codeRecord(raw);
  if (row && !("retentionNote" in row)) return "";
  const value = row ? row.retentionNote : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "KEEP";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: RtnValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("retentionNote" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function rtnState(raw: RtnValue): RtnState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["KEEP", "HOLD", "STAY", "WARM", "CARE", "NEAR"]);
const BENCH_TITLES = new Set(["CALL", "NOTE", "PING", "MEET"]);
const WAIT_TITLES = new Set(["WEEK", "MONTH", "NEXT", "DEFER"]);
const RETURN_TITLES = new Set(["LOST", "GONE", "DROP", "COLD"]);
const PAIR_TITLES = new Set(["TWIN", "JOIN"]);
const BARE_TITLES = new Set(["NONE", "NIL", "BLANK", "EMPTY"]);

/** A known note maps first. A plus joins two notes. A colon that is not a time marks a scoped note. A time today is the court. Within three days is the bench. Within fourteen days waits. Older is returned. Quiet, sealed, or private is shut. A short note is exactly three characters. A digit note starts with a digit and is not a time. A span note is ten characters or longer. A vowel note starts with a vowel. The words follow and retain are the court. */
export function rtnLane(raw: RtnValue, now = Date.now()): RtnLane {
  if (rtnState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "court";
  if (BENCH_TITLES.has(upper)) return "bench";
  if (WAIT_TITLES.has(upper)) return "wait";
  if (RETURN_TITLES.has(upper)) return "return";
  if (PAIR_TITLES.has(upper)) return "pair";
  if (BARE_TITLES.has(upper)) return "bare";
  if (/quiet|sealed|private/i.test(text)) return "shut";
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
  if (/\bfollow\b|\bretain\b/i.test(text)) return "court";
  if (text.length >= 10) return "span";
  if (/^[aeiou]/i.test(text)) return "openv";
  return "bare";
}

export function rtnHue(raw: RtnValue, now = Date.now()): RtnHue {
  const mail = rtnLane(raw, now);
  if (!mail) return "";
  if (mail === "court" || mail === "pair") return "champagne";
  if (mail === "bench" || mail === "return" || mail === "scope" || mail === "span") return "graphite";
  return "ivory";
}

export function rtnCourt(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "court";
}

export function rtnShut(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "shut";
}

export function rtnWait(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "wait";
}

export function rtnReturn(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "return";
}

export function rtnBench(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "bench";
}

export function rtnPair(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "pair";
}

export function rtnScope(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "scope";
}

export function rtnShort(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "short";
}

export function rtnSpan(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "span";
}

export function rtnStampLane(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "digit";
}

export function rtnVowelLane(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "openv";
}

export function rtnBare(raw: RtnValue, now = Date.now()): boolean {
  return rtnLane(raw, now) === "bare";
}

export function rtnOpen(raw: RtnValue): boolean {
  return rtnState(raw) === "clear";
}

/** A long caption or a digit caption can stay as written. */
export function rtnHeld(raw: RtnValue): boolean {
  const mail = rtnLane(raw);
  return mail === "span" || mail === "digit";
}

/** A brief caption, or a five-character caption that is not a known title, still wants a fuller name. */
export function rtnSoon(raw: RtnValue, now = Date.now()): boolean {
  if (rtnState(raw) !== "set") return false;
  if (rtnShort(raw, now)) return true;
  if (rtnCourt(raw, now) || rtnShut(raw, now) || rtnWait(raw, now) || rtnReturn(raw, now)) return false;
  return codeGiven(raw).length === 5;
}

export function rtnLength(raw: RtnValue): number | null {
  if (rtnState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function rtnEven(raw: RtnValue): boolean {
  const length = rtnLength(raw);
  return length !== null && length % 2 === 0;
}

export function rtnOdd(raw: RtnValue): boolean {
  const length = rtnLength(raw);
  return length !== null && length % 2 === 1;
}

export function rtnFirst(raw: RtnValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function rtnTail(raw: RtnValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function rtnSpace(raw: RtnValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function rtnVowel(raw: RtnValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function rtnDigit(raw: RtnValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function rtnLetter(raw: RtnValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function rtnMixed(raw: RtnValue): boolean {
  return rtnDigit(raw) && rtnLetter(raw);
}

export function rtnLower(raw: RtnValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital caption is five letters or more, written entirely in capitals. */
export function rtnUpper(raw: RtnValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function rtnStamp(raw: RtnValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function rtnCopy(raw: RtnValue): string {
  return codeGiven(raw);
}

export function rtnFamily(raw: RtnValue): string {
  if (rtnState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function rtnLanes(rows: readonly RtnRow[]): RtnLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of VOID_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = rtnLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return VOID_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingRtn(rows: readonly RtnRow[]): string {
  const lines = rtnLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || VOID_LANES.indexOf(a.mail as (typeof VOID_LANES)[number]) - VOID_LANES.indexOf(b.mail as (typeof VOID_LANES)[number]))[0].mail;
}

export function leadingRtnHue(rows: readonly RtnRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of VOID_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = rtnHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = VOID_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || VOID_HUES.indexOf(a.hue) - VOID_HUES.indexOf(b.hue))[0].hue;
}

export function laneRtnCount(rows: readonly RtnRow[], mail: RtnLane): number {
  return rows.filter((row) => rtnLane(row.code) === mail).length;
}

export function rtnShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentRtnLanes(rows: readonly RtnRow[]): string[] {
  return rtnLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenRtn(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRtn(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRtn(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleRtnReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRtnReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRtnLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: RtnRow, shape: RtnShape): boolean {
  if (shape === "all") return true;
  if (shape === "court") return rtnCourt(row.code);
  if (shape === "shut") return rtnShut(row.code);
  if (shape === "wait") return rtnWait(row.code);
  if (shape === "return") return rtnReturn(row.code);
  if (shape === "pair") return rtnPair(row.code);
  if (shape === "scope") return rtnScope(row.code);
  if (shape === "short") return rtnShort(row.code);
  if (shape === "span") return rtnSpan(row.code);
  if (shape === "digit") return rtnStampLane(row.code);
  if (shape === "openv") return rtnVowelLane(row.code);
  if (shape === "bare") return rtnBare(row.code);
  if (shape === "open") return rtnOpen(row.code);
  if (shape === "soon") return rtnSoon(row.code);
  if (shape === "letter") return rtnLetter(row.code);
  if (shape === "mixed") return rtnMixed(row.code);
  if (shape === "upper") return rtnUpper(row.code);
  if (shape === "lower") return rtnLower(row.code);
  if (shape === "space") return rtnSpace(row.code);
  if (shape === "even") return rtnEven(row.code);
  if (shape === "odd") return rtnOdd(row.code);
  if (shape === "tail") return rtnTail(row.code);
  if (shape === "first") return rtnFirst(row.code);
  if (shape === "held") return rtnHeld(row.code);
  return rtnLane(row.code) === shape;
}

export function visibleRtn(
  rows: readonly RtnRow[],
  mail: string,
  hue: string,
  query: string,
  review: RtnReview,
  reviewed: readonly string[],
  shape: RtnShape,
): RtnRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (rtnState(row.code) === "") return false;
    const found = rtnLane(row.code);
    const hueName = rtnHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${rtnStamp(row.code)} ${rtnFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function rtnLanesCsv(rows: readonly RtnRow[]): string {
  const lines = ["lane,count"];
  for (const line of rtnLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function rtnRowsCsv(rows: readonly RtnRow[], reviewed: readonly string[]): string {
  const lines = ["name,retentionNote,stamp,family,lane,hue,length,court,shut,wait,bench,return,pair,scope,short,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(rtnCopy(row.code)),
        rtnStamp(row.code),
        csvCell(rtnFamily(row.code)),
        rtnLane(row.code),
        rtnHue(row.code),
        rtnLength(row.code) ?? "",
        rtnCourt(row.code) ? "1" : "0",
        rtnShut(row.code) ? "1" : "0",
        rtnWait(row.code) ? "1" : "0",
        rtnBench(row.code) ? "1" : "0",
        rtnReturn(row.code) ? "1" : "0",
        rtnPair(row.code) ? "1" : "0",
        rtnScope(row.code) ? "1" : "0",
        rtnShort(row.code) ? "1" : "0",
        rtnEven(row.code) ? "1" : "0",
        rtnDigit(row.code) ? "1" : "0",
        rtnMixed(row.code) ? "1" : "0",
        rtnUpper(row.code) ? "1" : "0",
        rtnVowel(row.code) ? "1" : "0",
        rtnTail(row.code) ? "1" : "0",
        rtnHeld(row.code) ? "1" : "0",
        rtnSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
