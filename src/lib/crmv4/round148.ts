/** Local quire leaves, and job-title ranks already on each loaded row. */

export const QUIRE_KEY = "crmv4-quire-leaves";
export const QUIRE_VIEW_KEY = "crmv4-quire-views";
export const COURTESY_KEY = "crmv4-courtesy-hide";

export type QuireWeight = "blank" | "light" | "steady" | "heavy";

export type QuireShelf = "blank" | "desk" | "floor" | "vault";

export type QuireTray = "open" | "folded" | "filed";

export type DayPick = "blank" | "early" | "late" | "weekday" | "weekend";

export type Quire = {
  id: string;
  text: string;
  scribe: string;
  day: number | null;
  shelf: string;
  ribbon: string;
  weight: string;
  starred: boolean;
  filed: boolean;
  folded: boolean;
  audit: string;
};

export type QuireView = {
  id: string;
  name: string;
  tray: QuireTray;
  query: string;
  scribe: string;
  shelf: string;
  ribbon: string;
  weight: string;
  day: string;
};

export type QuireCounts = {
  open: number;
  folded: number;
  filed: number;
  starred: number;
  late: number;
};

export type Rank = "" | "bench" | "desk" | "chair";

export type CourtesyValue =
  | {
      jobTitle?: unknown;
      email?: unknown;
      country?: unknown;
      registrationCountry?: unknown;
      address?: unknown;
      timezone?: unknown;
      city?: unknown;
      lastCountry?: unknown;
      lastCountryName?: unknown;
      lastCity?: unknown;
      lastRegion?: unknown;
      language?: unknown;
      phone?: unknown;
      name?: unknown;
      birthDate?: unknown;
      registrationDate?: unknown;
      username?: unknown;
      isResident?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type CourtesyRow = { title?: CourtesyValue; label?: string | null };

export type RankLine = { rank: string; count: number };

export type TitleLine = { title: string; rank: string; count: number };

export type InitialLine = { initial: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "star", "unstar", "fold", "unfold", "file", "reopen"] as const;

const SHELVES = ["desk", "floor", "vault"] as const;

const WEIGHTS = ["light", "steady", "heavy"] as const;

const WEIGHT_ORDER = ["", "light", "steady", "heavy"] as const;

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const DAY_BANDS = ["blank", "early", "late", "weekday", "weekend"] as const;

const TITLES = [
  "owner_ceo",
  "sales_head",
  "marketing_head",
  "retention_manager",
  "sales_manager",
  "sales_mgr",
  "administrator",
  "project_manager",
  "analyst",
  "marketer",
  "it_specialist",
  "other",
] as const;

const CHAIRS = ["owner_ceo", "sales_head", "marketing_head", "retention_manager"] as const;

const DESKS = ["sales_manager", "sales_mgr", "administrator", "project_manager"] as const;

const BENCHES = ["analyst", "marketer", "it_specialist", "other"] as const;

const RANKS = ["", "bench", "desk", "chair"] as const;

const TITLE_BLOCK = [
  "email",
  "country",
  "registrationCountry",
  "address",
  "timezone",
  "city",
  "lastCountry",
  "lastCountryName",
  "lastCity",
  "lastRegion",
  "language",
  "phone",
  "name",
  "birthDate",
  "registrationDate",
  "username",
  "isResident",
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): QuireTray {
  return raw === "folded" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function shelfName(raw: unknown): Exclude<QuireShelf, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SHELVES as readonly string[]).includes(text) ? (text as Exclude<QuireShelf, "blank">) : "";
}

function weightName(raw: unknown): Exclude<QuireWeight, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WEIGHTS as readonly string[]).includes(text) ? (text as Exclude<QuireWeight, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function quireText(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank scribe stays blank. It is not filled in. */
export function scribeLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A blank ribbon stays blank. It is not filled in. */
export function ribbonMark(raw: unknown): string {
  return clip(raw, 12);
}

/**
 * A weekday is 1 through 7. One is Monday. Seven is Sunday.
 * A blank value stays unset. A leading zero is still a weekday.
 * Zero is not a weekday. Eight is not a weekday.
 */
export function dayCount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 7) return raw;
  if (typeof raw === "string" && /^(?:[1-7]|0[1-7])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Desk, floor, vault, or blank. Anything else is blank. */
export function shelfOf(raw: unknown): QuireShelf {
  return shelfName(raw) || "blank";
}

/** Light, steady, heavy, or blank. Anything else is blank. */
export function weightOf(raw: unknown): QuireWeight {
  return weightName(raw) || "blank";
}

/** Early is Monday through Wednesday. Late is Thursday through Sunday. An unset weekday is blank. */
export function dayBand(day: unknown): "blank" | "early" | "late" {
  const count = dayCount(day);
  if (count === null) return "blank";
  return count <= 3 ? "early" : "late";
}

/** A weekday is Monday through Friday. A weekend is Saturday and Sunday. An unset weekday is blank. */
export function dayKind(day: unknown): "blank" | "weekday" | "weekend" {
  const count = dayCount(day);
  if (count === null) return "blank";
  return count <= 5 ? "weekday" : "weekend";
}

/** Days from the leaf weekday to the desk weekday. A negative gap is still ahead. An unset weekday stays empty. */
export function dayGap(day: unknown, desk: unknown): number | null {
  const from = dayCount(day);
  const at = dayCount(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readQuires(raw: unknown): Quire[] {
  if (!Array.isArray(raw)) return [];
  const out: Quire[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Quire>;
    const id = String(row.id || "").trim();
    const text = quireText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      scribe: scribeLabel(row.scribe),
      day: dayCount(row.day),
      shelf: shelfName(row.shelf),
      ribbon: ribbonMark(row.ribbon),
      weight: weightName(row.weight),
      starred: row.starred === true,
      filed: row.filed === true,
      folded: row.folded === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 24);
}

export function addQuire(
  cards: readonly Quire[],
  card: { id: string; text: string; scribe?: string; day?: unknown; shelf?: string; ribbon?: string; weight?: string },
): Quire[] {
  const current = readQuires(cards);
  const id = String(card.id || "").trim();
  const text = quireText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: Quire = {
    id,
    text,
    scribe: scribeLabel(card.scribe),
    day: dayCount(card.day),
    shelf: shelfName(card.shelf),
    ribbon: ribbonMark(card.ribbon),
    weight: weightName(card.weight),
    starred: false,
    filed: false,
    folded: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 24);
}

export function stepQuireWeight(cards: readonly Quire[], id: string, dir: 1 | -1): Quire[] {
  return readQuires(cards).map((card) => {
    if (card.id !== id) return card;
    const at = WEIGHT_ORDER.indexOf(card.weight as (typeof WEIGHT_ORDER)[number]);
    const next = WEIGHT_ORDER[Math.min(WEIGHTS.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.weight) return card;
    return { ...card, weight: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setQuireStarred(cards: readonly Quire[], id: string, starred: boolean): Quire[] {
  return readQuires(cards).map((card) => (card.id === id ? { ...card, starred, audit: starred ? "star" : "unstar" } : card));
}

export function setQuireFolded(cards: readonly Quire[], id: string, folded: boolean): Quire[] {
  return readQuires(cards).map((card) => (card.id === id ? { ...card, folded, audit: folded ? "fold" : "unfold" } : card));
}

export function setQuireFiled(cards: readonly Quire[], id: string, filed: boolean): Quire[] {
  return readQuires(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another leaf is left out. */
export function editQuire(cards: readonly Quire[], id: string, text: string): Quire[] {
  const current = readQuires(cards);
  const next = quireText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkQuireStarred(cards: readonly Quire[], ids: readonly string[], starred: boolean): Quire[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readQuires(cards).map((card) => (want.has(card.id) ? { ...card, starred, audit: starred ? "star" : "unstar" } : card));
}

export function bulkQuireFiled(cards: readonly Quire[], ids: readonly string[], filed: boolean): Quire[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readQuires(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

export function resetQuires(): Quire[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function quireCopy(raw: unknown): string {
  return quireText(raw);
}

function inTray(card: Quire, tray: QuireTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "folded") return card.folded && !card.filed;
  return !card.folded && !card.filed;
}

function dayHit(day: number | null, exact: number | null, band: DayPick | null): boolean {
  if (exact !== null) return day === exact;
  if (band === null) return true;
  if (band === "weekday" || band === "weekend") return dayKind(day) === band;
  return dayBand(day) === band;
}

function weightScore(weight: string): number {
  if (weight === "heavy") return 3;
  if (weight === "steady") return 2;
  if (weight === "light") return 1;
  return 0;
}

/** Search stays on the note. The scribe, the weekday, the shelf, the ribbon, and the weight are not part of the query. */
export function visibleQuires(
  cards: readonly Quire[],
  tray: QuireTray,
  query: string,
  scribe: string | null,
  shelf: QuireShelf | null,
  ribbon: string | null,
  weight: QuireWeight | null,
  exact: number | null,
  band: DayPick | null,
  heavyOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): Quire[] {
  const text = query.trim().toLowerCase();
  const wantScribe = scribe === null ? null : scribeLabel(scribe);
  const wantRibbon = ribbon === null ? null : ribbonMark(ribbon);
  return readQuires(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (heavyOnly && card.weight !== "heavy") return false;
      if (wantScribe !== null && scribeLabel(card.scribe) !== wantScribe) return false;
      if (shelf !== null && shelfOf(card.shelf) !== shelf) return false;
      if (wantRibbon !== null && ribbonMark(card.ribbon) !== wantRibbon) return false;
      if (weight !== null && weightOf(card.weight) !== weight) return false;
      if (!dayHit(card.day, exact, band)) return false;
      if (lateOnly) {
        const gap = dayGap(card.day, desk);
        if (gap === null || gap <= 0 || !inTray(card, "open")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (weightScore(a.weight) !== weightScore(b.weight)) return weightScore(b.weight) - weightScore(a.weight);
      return a.text.localeCompare(b.text);
    });
}

/** The weekday orders the desk. An unset weekday stays at the end. Search stays on the note. */
export function quireTimeline(cards: readonly Quire[], query: string): Quire[] {
  const text = query.trim().toLowerCase();
  return readQuires(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.day === null && b.day !== null) return 1;
      if (a.day !== null && b.day === null) return -1;
      if (a.day !== null && b.day !== null && a.day !== b.day) return a.day - b.day;
      return a.text.localeCompare(b.text);
    });
}

export function quireCounts(cards: readonly Quire[], desk: unknown): QuireCounts {
  const rows = readQuires(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    folded: rows.filter((card) => inTray(card, "folded")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    starred: rows.filter((card) => card.starred).length,
    late: rows.filter((card) => {
      const gap = dayGap(card.day, desk);
      return gap !== null && gap > 0 && inTray(card, "open");
    }).length,
  };
}

/** Share of the saved leaves. A zero total stays at zero. */
export function quireShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function quireScribes(cards: readonly Quire[]): string[] {
  const out: string[] = [];
  for (const card of readQuires(cards)) {
    if (card.scribe && !out.includes(card.scribe)) out.push(card.scribe);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function quireRibbons(cards: readonly Quire[]): string[] {
  const out: string[] = [];
  for (const card of readQuires(cards)) {
    if (card.ribbon && !out.includes(card.ribbon)) out.push(card.ribbon);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function quireShelves(cards: readonly Quire[]): Exclude<QuireShelf, "blank">[] {
  const seen = new Set<string>();
  for (const card of readQuires(cards)) if (card.shelf) seen.add(card.shelf);
  return SHELVES.filter((shelf) => seen.has(shelf));
}

export function quireWeights(cards: readonly Quire[]): Exclude<QuireWeight, "blank">[] {
  const seen = new Set<string>();
  for (const card of readQuires(cards)) if (card.weight) seen.add(card.weight);
  return WEIGHTS.filter((weight) => seen.has(weight));
}

/** Seven weekdays. Index 0 is Monday. Index 6 is Sunday. */
export function dayCounts(cards: readonly Quire[]): number[] {
  const rows = readQuires(cards);
  return DAYS.map((day) => rows.filter((card) => card.day === day).length);
}

/** "all" and "blank" stay. A scribe that is no longer on a leaf falls back to all. */
export function activeScribe(filter: string, scribes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const scribe = scribeLabel(filter);
  return scribe && scribes.includes(scribe) ? scribe : "all";
}

export function scribeArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return scribeLabel(filter);
}

/** "all" and "blank" stay. A shelf that is no longer on a leaf falls back to all. */
export function activeShelf(filter: string, shelves: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const shelf = shelfName(filter);
  return shelf && shelves.includes(shelf) ? shelf : "all";
}

export function shelfArg(filter: string): QuireShelf | null {
  if (filter === "blank") return "blank";
  return shelfName(filter) || null;
}

/** "all" and "blank" stay. A ribbon that is no longer on a leaf falls back to all. */
export function activeRibbon(filter: string, ribbons: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ribbon = ribbonMark(filter);
  return ribbon && ribbons.includes(ribbon) ? ribbon : "all";
}

export function ribbonArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return ribbonMark(filter);
}

/** "all" and "blank" stay. A weight that is no longer on a leaf falls back to all. */
export function activeWeight(filter: string, weights: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const weight = weightName(filter);
  return weight && weights.includes(weight) ? weight : "all";
}

export function weightArg(filter: string): QuireWeight | null {
  if (filter === "blank") return "blank";
  return weightName(filter) || null;
}

/** All, blank, the two halves, the weekday and weekend bands, and days 1 through 7 stay. Anything else is all. */
export function activeDay(filter: string): string {
  if ((DAY_BANDS as readonly string[]).includes(filter)) return filter;
  const day = dayCount(filter);
  return day === null ? "all" : String(day);
}

export function dayArg(filter: string): { exact: number | null; band: DayPick | null } {
  if ((DAY_BANDS as readonly string[]).includes(filter)) return { exact: null, band: filter as DayPick };
  const day = dayCount(filter);
  return day === null ? { exact: null, band: null } : { exact: day, band: null };
}

/** Other leaves with the same shelf and the same weekday. A blank shelf or an unset weekday clashes with nothing. */
export function quireClashIds(cards: readonly Quire[], id: string): string[] {
  const rows = readQuires(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.shelf || card.day === null) return [];
  return rows
    .filter((item) => item.id !== id && item.shelf === card.shelf && item.day === card.day)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open leaf at or after the weekday. After Sunday, the desk wraps to the earliest open weekday. */
export function nextQuire(cards: readonly Quire[], day: unknown): string {
  const now = dayCount(day);
  if (now === null) return "";
  const waiting = readQuires(cards).filter((card) => inTray(card, "open") && card.day !== null);
  if (!waiting.length) return "";
  const byDay = (a: Quire, b: Quire) => (a.day ?? 0) - (b.day ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.day ?? 0) >= now).sort(byDay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byDay)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the leaves saved in this browser. The gap uses the weekday you pass. */
export function quiresCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,scribe,day,shelf,ribbon,weight,band,starred,filed,folded,gap,audit"];
  for (const card of readQuires(raw)) {
    const gap = dayGap(card.day, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.scribe),
      card.day === null ? "" : String(card.day),
      card.shelf,
      csvCell(card.ribbon),
      card.weight,
      dayBand(card.day),
      card.starred ? "1" : "0",
      card.filed ? "1" : "0",
      card.folded ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function scribeSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return scribeLabel(raw) || "all";
}

function shelfSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return shelfName(raw) || "all";
}

function ribbonSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ribbonMark(raw) || "all";
}

function weightSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return weightName(raw) || "all";
}

export function readQuireViews(raw: unknown): QuireView[] {
  if (!Array.isArray(raw)) return [];
  const out: QuireView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<QuireView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      scribe: scribeSlot(row.scribe),
      shelf: shelfSlot(row.shelf),
      ribbon: ribbonSlot(row.ribbon),
      weight: weightSlot(row.weight),
      day: activeDay(String(row.day ?? "")),
    });
  }
  return out.slice(0, 8);
}

export function addQuireView(
  views: readonly QuireView[],
  view: { id: string; name: string; tray: QuireTray; query: string; scribe: string; shelf: string; ribbon: string; weight: string; day: string },
): QuireView[] {
  const current = readQuireViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    scribe: scribeSlot(view.scribe),
    shelf: shelfSlot(view.shelf),
    ribbon: ribbonSlot(view.ribbon),
    weight: weightSlot(view.weight),
    day: activeDay(view.day),
  }].slice(0, 8);
}

export function dropQuireView(views: readonly QuireView[], id: string): QuireView[] {
  return readQuireViews(views).filter((view) => view.id !== id);
}

function titleKey(raw: unknown): string {
  const text = clip(raw, 32).toLowerCase().replace(/\s+/g, "_");
  return (TITLES as readonly string[]).includes(text) ? text : "";
}

function rankOfTitle(title: string): Rank {
  if ((CHAIRS as readonly string[]).includes(title)) return "chair";
  if ((DESKS as readonly string[]).includes(title)) return "desk";
  if ((BENCHES as readonly string[]).includes(title)) return "bench";
  return "";
}

function resolvedTitle(value: CourtesyValue): string {
  if (typeof value === "string") return titleKey(value);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (TITLE_BLOCK.some((key) => key in value)) return "";
  return titleKey(value.jobTitle);
}

/**
 * A known job title, or blank. A name, an email, and a phone are not a title.
 * An unknown title stays blank and is not filled in.
 */
export function titleOf(value: CourtesyValue): string {
  return resolvedTitle(value);
}

/** Bench, desk, chair, or unmarked. An unknown title stays unmarked. */
export function rankOf(value: CourtesyValue): Rank {
  return rankOfTitle(resolvedTitle(value));
}

function titleInitial(title: string): string {
  const letter = title.slice(0, 1);
  return /^[a-z]$/.test(letter) ? letter : "";
}

export function titleLines(rows: readonly CourtesyRow[]): TitleLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const title = titleOf(row.title);
    map.set(title, (map.get(title) || 0) + 1);
  }
  const out: TitleLine[] = [];
  map.forEach((count, title) => out.push({ title, rank: rankOfTitle(title), count }));
  return out.sort((a, b) => {
    if (!a.title) return -1;
    if (!b.title) return 1;
    return a.title.localeCompare(b.title);
  });
}

export function namedTitles(rows: readonly CourtesyRow[]): string[] {
  return titleLines(rows).map((line) => line.title).filter(Boolean);
}

export function rankLines(rows: readonly CourtesyRow[]): RankLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const rank = rankOf(row.title);
    map.set(rank, (map.get(rank) || 0) + 1);
  }
  const out: RankLine[] = [];
  for (const rank of RANKS) {
    const count = map.get(rank);
    if (count) out.push({ rank, count });
  }
  return out;
}

export function namedRanks(rows: readonly CourtesyRow[]): string[] {
  return rankLines(rows).map((line) => line.rank).filter(Boolean);
}

export function initialLines(rows: readonly CourtesyRow[]): InitialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const initial = titleInitial(titleOf(row.title));
    if (!initial) continue;
    map.set(initial, (map.get(initial) || 0) + 1);
  }
  const out: InitialLine[] = [];
  map.forEach((count, initial) => out.push({ initial, count }));
  return out.sort((a, b) => a.initial.localeCompare(b.initial));
}

export function namedInitials(rows: readonly CourtesyRow[]): string[] {
  return initialLines(rows).map((line) => line.initial);
}

/** The named rank with the most loaded rows. A tie keeps bench, then desk, then chair. An unmarked rank is not a lead. */
export function leadingRank(rows: readonly CourtesyRow[]): string {
  const named = rankLines(rows).filter((line) => line.rank);
  if (!named.length) return "";
  const order = (rank: string) => RANKS.indexOf(rank as (typeof RANKS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.rank) - order(b.rank))[0].rank;
}

/** The named title with the most loaded rows. A tie keeps the earlier title. A blank title is not a lead. */
export function leadingTitle(rows: readonly CourtesyRow[]): string {
  const named = titleLines(rows).filter((line) => line.title);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))[0].title;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function courtesyShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenTitles(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const title = titleKey(item);
    if (!title || !known.has(title) || out.includes(title)) continue;
    out.push(title);
  }
  return out;
}

export function toggleTitle(hidden: readonly string[], title: string, present: readonly string[]): string[] {
  const mark = titleKey(title);
  if (!mark || !present.includes(mark)) return readHiddenTitles(hidden, present);
  const current = readHiddenTitles(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleTitles(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenTitles(hidden, present));
  return present.filter((title) => (showHidden ? gone.has(title) : !gone.has(title)));
}

/** "all" and "blank" stay. A rank that is no longer loaded falls back to all. */
export function activeRank(filter: string, ranks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return ranks.includes(filter) ? filter : "all";
}

export function rankArg(filter: string): Rank | null {
  if (filter === "blank") return "";
  if (filter === "bench" || filter === "desk" || filter === "chair") return filter;
  return null;
}

/** A title that is no longer on a chip falls back to all. */
export function activeTitle(filter: string, titles: readonly string[]): string {
  if (!filter || filter === "all") return "all";
  const title = titleKey(filter);
  return title && titles.includes(title) ? title : "all";
}

export function titleArg(filter: string): string | null {
  if (!filter || filter === "all") return null;
  return titleKey(filter) || null;
}

/** A letter that is no longer loaded falls back to all. */
export function activeInitial(filter: string, initials: readonly string[]): string {
  if (!filter || filter === "all") return "all";
  const letter = filter.trim().toLowerCase();
  return /^[a-z]$/.test(letter) && initials.includes(letter) ? letter : "all";
}

export function initialArg(filter: string): string | null {
  if (!filter || filter === "all") return null;
  const letter = filter.trim().toLowerCase();
  return /^[a-z]$/.test(letter) ? letter : null;
}

/** Search stays on the name. The job title is not part of the query. */
export function visibleCourtesyCustomers<T extends CourtesyRow>(
  rows: readonly T[],
  rank: Rank | null,
  title: string | null,
  initial: string | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (rank !== null && rankOf(row.title) !== rank) return false;
    if (title !== null && titleOf(row.title) !== title) return false;
    if (initial !== null && titleInitial(titleOf(row.title)) !== initial) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the ranks, titles, and counts on this page. */
export function courtesyCsv(rows: readonly CourtesyRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of rankLines(rows)) lines.push(["rank", line.rank, String(line.count)].join(","));
  for (const line of titleLines(rows)) lines.push(["title", csvCell(line.title), String(line.count)].join(","));
  for (const line of initialLines(rows)) lines.push(["initial", line.initial, String(line.count)].join(","));
  return lines.join("\n");
}
