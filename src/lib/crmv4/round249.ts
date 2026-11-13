/**
 * Ferry passes for a harbor crossing follow-up, and campaign marks already stored on a trader.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_ferry_pass (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   coxswain text not null default '',
 *   crossing text not null default '',
 *   sail text not null default '',
 *   weather text not null default '',
 *   wait_min integer,
 *   rung integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   flagged boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_campaign_mark_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_campaign_mark_review (
 *   trader_id text primary key
 * );
 */

export const FRY_KEY = "crmv4-ferry-pass";
export const FRY_VIEW_KEY = "crmv4-ferry-views";
export const FRY_DENSITY_KEY = "crmv4-ferry-density";
export const RFR_KEY = "crmv4-ribbon-hide";
export const RFR_REVIEW_KEY = "crmv4-ribbon-review";

export const FERRY_CROSSINGS = ["quay", "mole", "pier", "jetty", "slipway", "dock"] as const;

export type FerryCrossing = (typeof FERRY_CROSSINGS)[number];

export type SailName = "blank" | "canvas" | "oak" | "tar";

export type WeatherName = "blank" | "calm" | "breeze" | "gale";

export type PassTray = "open" | "held" | "archived";

export type PassDensity = "airy" | "tight";

export type PassSort = "crossing" | "coxswain";

export type FerryPass = {
  id: string;
  title: string;
  note: string;
  coxswain: string;
  crossing: string;
  wait: number | null;
  sail: string;
  weather: string;
  rung: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  flagged: boolean;
  audit: string;
};

export type FerryView = {
  id: string;
  name: string;
  tray: PassTray;
  query: string;
  coxswain: string;
  sail: string;
  weather: string;
  crossing: string;
  wait: string;
  rung: string;
};

export type PassCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  rung: number;
  house: number;
  wait: number;
  matched: number;
  flagged: number;
  idle: number;
  rush: number;
  resting: number;
  overdue: number;
};

export type RibbonLane = "" | "twin" | "digit" | "brief" | "name" | "split" | "full" | "mixed";

export type RibbonHue = "" | "gilt" | "slate" | "sand" | "clay" | "soot" | "pearl" | "mist";

export type RibbonState = "" | "clear" | "set";

export type RibbonShape = "all" | "twin" | "wide" | "bound" | "notch" | "digit";

export type RibbonReview = "all" | "reviewed" | "fresh";

export type RibbonValue = string | { campaign?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type RibbonRow = { id: string; label: string; note: RibbonValue };

export type RibbonLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "weather", "pin", "unpin", "hold", "resume", "archive", "open", "sail", "tag", "rung", "wait", "short", "flag"] as const;

const SAILS = ["canvas", "oak", "tar"] as const;

const WEATHERS = ["calm", "breeze", "gale"] as const;

const WEATHER_CYCLE = ["calm", "breeze", "gale"] as const;

const RUNG_CYCLE = [1, 3, 5, 9] as const;

const WAITS = [12, 24, 36] as const;

const PEAK = new Set(["quay", "dock"]);

const QUIET = new Set(["mole", "slipway"]);

const HOUSE = new Set(["CANVAS", "OAK"]);

const EARLY = new Set(["quay", "mole"]);

const MID = new Set(["pier", "jetty"]);

const LATE = new Set(["slipway", "dock"]);

const LANE_ORDER = ["twin", "digit", "brief", "name", "split", "full", "mixed"] as const;

const HUE_ORDER = ["gilt", "slate", "sand", "clay", "soot", "pearl", "mist"] as const;

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const PASS_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): PassTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function sailName(raw: unknown): Exclude<SailName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SAILS as readonly string[]).includes(text) ? (text as Exclude<SailName, "blank">) : "";
}

function weatherName(raw: unknown): Exclude<WeatherName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WEATHERS as readonly string[]).includes(text) ? (text as Exclude<WeatherName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[abc]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(pass: FerryPass, tray: PassTray): boolean {
  if (tray === "held") return pass.held && !pass.archived;
  if (tray === "archived") return pass.archived;
  return !pass.held && !pass.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function crossingIndex(crossing: string): number {
  return FERRY_CROSSINGS.indexOf(crossing as FerryCrossing);
}

function rungIndex(rung: number): number {
  return RUNG_CYCLE.indexOf(rung as (typeof RUNG_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function passLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function passNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A crossing outside the six berths is left blank. */
export function crossingOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (FERRY_CROSSINGS as readonly string[]).includes(text) ? text : "";
}

/** The SLA timer is 12, 24, or 36 minutes. Anything else stays blank. */
export function waitOf(raw: unknown): 12 | 24 | 36 | null {
  const value = Number(clip(raw, 2));
  return (WAITS as readonly number[]).includes(value) ? (value as 12 | 24 | 36) : null;
}

/** Rung is 1, 3, 5, or 9. Anything else stays blank. */
export function rungOf(raw: unknown): 1 | 3 | 5 | 9 | null {
  const value = Number(clip(raw, 1));
  return (RUNG_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 9) : null;
}

/** Sail is canvas, oak, or tar. The saved sail is CANVAS, OAK, or TAR. */
export function sailOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "canvas") return "CANVAS";
  if (text === "oak") return "OAK";
  if (text === "tar") return "TAR";
  return "";
}

/** Weather is calm, breeze, or gale. A blank weather stays blank. */
export function weatherOf(raw: unknown): string {
  return weatherName(raw);
}

export function peakCrossing(crossing: unknown): boolean {
  return PEAK.has(crossingOf(crossing));
}

export function quietCrossing(crossing: unknown): boolean {
  return QUIET.has(crossingOf(crossing));
}

/** Early is quay and mole. Mid is pier and jetty. Late is slipway and dock. */
export function crossingBand(crossing: unknown): "early" | "mid" | "late" | "" {
  const name = crossingOf(crossing);
  if (EARLY.has(name)) return "early";
  if (MID.has(name)) return "mid";
  if (LATE.has(name)) return "late";
  return "";
}

/** Steps from the pass crossing to the desk crossing. A blank crossing has no gap. */
export function crossingGap(passCrossing: unknown, deskCrossing: unknown): number | null {
  const from = crossingIndex(crossingOf(passCrossing));
  const to = crossingIndex(crossingOf(deskCrossing));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseSail(sail: unknown): boolean {
  return HOUSE.has(sailOf(sail));
}

export function activeCrossing(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return crossingOf(text) || "all";
}

export function activeWait(raw: unknown): string {
  const value = waitOf(raw);
  return value === null ? "all" : String(value);
}

export function activeWeather(raw: unknown, weathers: readonly string[]): string {
  const weather = weatherOf(raw);
  return weather && weathers.includes(weather) ? weather : "all";
}

export function activeRung(raw: unknown): string {
  const value = rungOf(raw);
  return value === null ? "all" : String(value);
}

export function activeSail(raw: unknown): string {
  const name = sailName(raw);
  return name || "all";
}

export function moveFerryFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestSail(passes: readonly FerryPass[]): string {
  const counts = new Map<string, number>();
  for (const pass of passes) {
    if (!pass.sail) continue;
    counts.set(pass.sail, (counts.get(pass.sail) || 0) + 1);
  }
  let best = "CANVAS";
  let score = 0;
  for (const sail of ["CANVAS", "OAK", "TAR"]) {
    const count = counts.get(sail) || 0;
    if (count > score) {
      best = sail;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short SLA. An evening desk asks for a long one. A tie among saved passes keeps 24. */
export function suggestWait(passes: readonly FerryPass[], hour: number): 12 | 24 | 36 {
  const counts = new Map<number, number>();
  for (const pass of passes) {
    if (pass.wait === null) continue;
    counts.set(pass.wait, (counts.get(pass.wait) || 0) + 1);
  }
  let best: 12 | 24 | 36 | null = null;
  let score = 0;
  for (const wait of WAITS) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 5) return 12;
  if (hour >= 17) return 36;
  return 24;
}

/** The coxswain with the fewest open passes. A tie keeps the roster order. */
export function fairCoxswain(passes: readonly FerryPass[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = passes.filter((pass) => inTray(pass, "open"));
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((pass) => pass.coxswain.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readFerryPasses(raw: unknown): FerryPass[] {
  if (!Array.isArray(raw)) return [];
  const out: FerryPass[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FerryPass>;
    const id = clip(row.id, 40);
    const title = passLine(row.title);
    if (!id || !title || out.some((pass) => pass.id === id || pass.title === title)) continue;
    out.push({
      id,
      title,
      note: passNote(row.note),
      coxswain: clip(row.coxswain, 24),
      crossing: crossingOf(row.crossing),
      wait: waitOf(row.wait),
      sail: sailOf(row.sail),
      weather: weatherOf(row.weather),
      rung: rungOf(row.rung) ?? 1,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      archived: row.archived === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, PASS_CAP);
}

export function addFerryPass(
  passes: readonly FerryPass[],
  pass: {
    id: string;
    title: string;
    note?: string;
    coxswain?: string;
    crossing?: unknown;
    sail?: string;
    weather?: string;
    wait?: unknown;
    rung?: unknown;
    tags?: unknown;
  },
): FerryPass[] {
  const current = readFerryPasses(passes);
  const id = clip(pass.id, 40);
  const title = passLine(pass.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: FerryPass = {
    id,
    title,
    note: passNote(pass.note),
    coxswain: clip(pass.coxswain, 24),
    crossing: crossingOf(pass.crossing),
    wait: waitOf(pass.wait),
    sail: sailOf(pass.sail),
    weather: weatherOf(pass.weather),
    rung: rungOf(pass.rung) ?? 1,
    tags: tagsOf(pass.tags),
    pinned: false,
    held: false,
    archived: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, PASS_CAP);
}

function mapPass(passes: readonly FerryPass[], id: string, change: (pass: FerryPass) => FerryPass): FerryPass[] {
  return readFerryPasses(passes).map((pass) => (pass.id === id ? change(pass) : pass));
}

function touchIds(passes: readonly FerryPass[], ids: readonly string[], change: (pass: FerryPass) => FerryPass): FerryPass[] {
  const picked = new Set(ids);
  return readFerryPasses(passes).map((pass) => (picked.has(pass.id) ? change(pass) : pass));
}

export function editFerry(passes: readonly FerryPass[], id: string, title: string): FerryPass[] {
  const next = passLine(title);
  if (!next) return readFerryPasses(passes);
  return mapPass(passes, id, (pass) => (pass.title === next ? pass : { ...pass, title: next, audit: "edit" }));
}

export function editFerryNote(passes: readonly FerryPass[], id: string, note: string): FerryPass[] {
  const next = passNote(note);
  return mapPass(passes, id, (pass) => (pass.note === next ? pass : { ...pass, note: next, audit: "note" }));
}

export function setPassPin(passes: readonly FerryPass[], id: string, pinned: boolean): FerryPass[] {
  return mapPass(passes, id, (pass) => (pass.pinned === pinned ? pass : { ...pass, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setPassHold(passes: readonly FerryPass[], id: string, held: boolean): FerryPass[] {
  return mapPass(passes, id, (pass) => (pass.held === held || pass.archived ? pass : { ...pass, held, audit: held ? "hold" : "resume" }));
}

export function setPassArchive(passes: readonly FerryPass[], id: string, archived: boolean): FerryPass[] {
  return mapPass(passes, id, (pass) => (pass.archived === archived ? pass : { ...pass, archived, held: archived ? false : pass.held, audit: archived ? "archive" : "open" }));
}

export function setPassFlag(passes: readonly FerryPass[], id: string, flagged: boolean): FerryPass[] {
  return mapPass(passes, id, (pass) => (pass.flagged === flagged ? pass : { ...pass, flagged, audit: "flag" }));
}

export function setPassRung(passes: readonly FerryPass[], id: string, rung: unknown): FerryPass[] {
  const next = rungOf(rung);
  if (next === null) return readFerryPasses(passes);
  return mapPass(passes, id, (pass) => (pass.rung === next ? pass : { ...pass, rung: next, audit: "rung" }));
}

export function setPassSail(passes: readonly FerryPass[], id: string, sail: unknown): FerryPass[] {
  const next = sailOf(sail);
  if (!next) return readFerryPasses(passes);
  return mapPass(passes, id, (pass) => (pass.sail === next ? pass : { ...pass, sail: next, audit: "sail" }));
}

/** Weather steps calm, breeze, gale, then calm again. A blank weather starts at calm. */
export function cycleWeather(passes: readonly FerryPass[], id: string): FerryPass[] {
  return mapPass(passes, id, (pass) => {
    const at = WEATHER_CYCLE.indexOf(pass.weather as (typeof WEATHER_CYCLE)[number]);
    const next = at < 0 ? WEATHER_CYCLE[0] : WEATHER_CYCLE[(at + 1) % WEATHER_CYCLE.length];
    return next === pass.weather ? pass : { ...pass, weather: next, audit: "weather" };
  });
}

export function addFerryTag(passes: readonly FerryPass[], id: string, tag: string): FerryPass[] {
  const next = tagsOf(tag)[0];
  if (!next) return readFerryPasses(passes);
  return mapPass(passes, id, (pass) => {
    if (pass.tags.includes(next) || pass.tags.length >= TAG_CAP) return pass;
    return { ...pass, tags: [...pass.tags, next], audit: "tag" };
  });
}

/** A blank wait becomes 12, 12 becomes 24, and 24 becomes 36. A wait of 36 stays. */
export function lengthenWait(passes: readonly FerryPass[], id: string): FerryPass[] {
  return mapPass(passes, id, (pass) => {
    if (pass.wait === 36) return pass;
    const next = pass.wait === 24 ? 36 : pass.wait === 12 ? 24 : 12;
    return { ...pass, wait: next, audit: "wait" };
  });
}

/** A blank wait becomes 36, 36 becomes 24, and 24 becomes 12. A wait of 12 stays. */
export function shortenWait(passes: readonly FerryPass[], id: string): FerryPass[] {
  return mapPass(passes, id, (pass) => {
    if (pass.wait === 12) return pass;
    const next = pass.wait === 24 ? 12 : pass.wait === 36 ? 24 : 36;
    return { ...pass, wait: next, audit: "short" };
  });
}

export function raiseRung(passes: readonly FerryPass[], id: string): FerryPass[] {
  return mapPass(passes, id, (pass) => {
    const at = rungIndex(pass.rung);
    const next = at < 0 ? RUNG_CYCLE[0] : RUNG_CYCLE[(at + 1) % RUNG_CYCLE.length];
    return next === pass.rung ? pass : { ...pass, rung: next, audit: "rung" };
  });
}

export function lowerRung(passes: readonly FerryPass[], id: string): FerryPass[] {
  return mapPass(passes, id, (pass) => {
    const at = rungIndex(pass.rung);
    const next = at < 0 ? RUNG_CYCLE[0] : RUNG_CYCLE[(at + RUNG_CYCLE.length - 1) % RUNG_CYCLE.length];
    return next === pass.rung ? pass : { ...pass, rung: next, audit: "rung" };
  });
}

function focusedPass(passes: readonly FerryPass[], shownIds: readonly string[], index: number): FerryPass | undefined {
  const id = shownIds[index];
  return id ? readFerryPasses(passes).find((item) => item.id === id) : undefined;
}

export function pinFocusedPass(passes: readonly FerryPass[], shownIds: readonly string[], index: number): FerryPass[] {
  const pass = focusedPass(passes, shownIds, index);
  if (!pass) return readFerryPasses(passes);
  return setPassPin(passes, pass.id, !pass.pinned);
}

export function holdFocusedPass(passes: readonly FerryPass[], shownIds: readonly string[], index: number): FerryPass[] {
  const pass = focusedPass(passes, shownIds, index);
  if (!pass) return readFerryPasses(passes);
  return setPassHold(passes, pass.id, !pass.held);
}

export function weatherFocusedPass(passes: readonly FerryPass[], shownIds: readonly string[], index: number): FerryPass[] {
  const id = shownIds[index];
  return id ? cycleWeather(passes, id) : readFerryPasses(passes);
}

export function flagFocusedPass(passes: readonly FerryPass[], shownIds: readonly string[], index: number): FerryPass[] {
  const pass = focusedPass(passes, shownIds, index);
  if (!pass) return readFerryPasses(passes);
  return setPassFlag(passes, pass.id, !pass.flagged);
}

export function tagFocusedPass(passes: readonly FerryPass[], shownIds: readonly string[], index: number, tag: string): FerryPass[] {
  const id = shownIds[index];
  return id ? addFerryTag(passes, id, tag) : readFerryPasses(passes);
}

export function raiseFocusedPass(passes: readonly FerryPass[], shownIds: readonly string[], index: number): FerryPass[] {
  const id = shownIds[index];
  return id ? raiseRung(passes, id) : readFerryPasses(passes);
}

export function lowerFocusedPass(passes: readonly FerryPass[], shownIds: readonly string[], index: number): FerryPass[] {
  const id = shownIds[index];
  return id ? lowerRung(passes, id) : readFerryPasses(passes);
}

export function lengthenFocusedPass(passes: readonly FerryPass[], shownIds: readonly string[], index: number): FerryPass[] {
  const id = shownIds[index];
  return id ? lengthenWait(passes, id) : readFerryPasses(passes);
}

export function shortenFocusedPass(passes: readonly FerryPass[], shownIds: readonly string[], index: number): FerryPass[] {
  const id = shownIds[index];
  return id ? shortenWait(passes, id) : readFerryPasses(passes);
}

export function bulkFerryPin(passes: readonly FerryPass[], ids: readonly string[]): FerryPass[] {
  return touchIds(passes, ids, (pass) => (pass.pinned ? pass : { ...pass, pinned: true, audit: "pin" }));
}

export function bulkFerryArchive(passes: readonly FerryPass[], ids: readonly string[]): FerryPass[] {
  return touchIds(passes, ids, (pass) => (pass.archived ? pass : { ...pass, archived: true, held: false, audit: "archive" }));
}

export function bulkFerryGale(passes: readonly FerryPass[], ids: readonly string[]): FerryPass[] {
  return touchIds(passes, ids, (pass) => (pass.weather === "gale" ? pass : { ...pass, weather: "gale", audit: "weather" }));
}

export function bulkFerryTag(passes: readonly FerryPass[], ids: readonly string[], tag: string): FerryPass[] {
  const next = tagsOf(tag)[0];
  if (!next) return readFerryPasses(passes);
  return touchIds(passes, ids, (pass) => {
    if (pass.tags.includes(next) || pass.tags.length >= TAG_CAP) return pass;
    return { ...pass, tags: [...pass.tags, next], audit: "tag" };
  });
}

export function bulkFerryOak(passes: readonly FerryPass[], ids: readonly string[], sail: unknown): FerryPass[] {
  const next = sailOf(sail);
  if (!next) return readFerryPasses(passes);
  return touchIds(passes, ids, (pass) => (pass.sail === next ? pass : { ...pass, sail: next, audit: "sail" }));
}

export function readFerryViews(raw: unknown): FerryView[] {
  if (!Array.isArray(raw)) return [];
  const out: FerryView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FerryView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      coxswain: clip(row.coxswain, 24),
      sail: activeSail(row.sail),
      weather: activeWeather(row.weather, WEATHERS),
      crossing: activeCrossing(row.crossing),
      wait: activeWait(row.wait),
      rung: activeRung(row.rung),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addFerryView(
  views: readonly FerryView[],
  view: {
    id: string;
    name: string;
    tray?: unknown;
    query?: string;
    coxswain?: string;
    sail?: string;
    weather?: string;
    crossing?: string;
    wait?: string;
    rung?: string;
  },
): FerryView[] {
  const current = readFerryViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: FerryView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    coxswain: clip(view.coxswain, 24),
    sail: activeSail(view.sail),
    weather: activeWeather(view.weather, WEATHERS),
    crossing: activeCrossing(view.crossing),
    wait: activeWait(view.wait),
    rung: activeRung(view.rung),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropFerryView(views: readonly FerryView[], id: string): FerryView[] {
  return readFerryViews(views).filter((view) => view.id !== id);
}

export function ferryDensity(raw: unknown): PassDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function ferrySort(raw: unknown): PassSort {
  return raw === "coxswain" ? "coxswain" : "crossing";
}

export function latePass(pass: FerryPass, deskCrossing: unknown): boolean {
  const gap = crossingGap(pass.crossing, deskCrossing);
  return gap !== null && gap > 0;
}

export function idlePass(pass: FerryPass): boolean {
  return pass.weather === "calm" && quietCrossing(pass.crossing) && pass.rung === 1;
}

export function rushPass(pass: FerryPass): boolean {
  return pass.rung === 5 && pass.weather === "gale" && peakCrossing(pass.crossing);
}

export function restingPass(pass: FerryPass): boolean {
  return pass.wait === 36 && pass.weather === "breeze" && !pass.flagged;
}

/** A twelve-minute wait on a peak crossing is overdue unless the pass is pinned. */
export function overduePass(pass: FerryPass): boolean {
  return pass.wait === 12 && peakCrossing(pass.crossing) && !pass.pinned;
}

export function visibleFerry(
  passes: readonly FerryPass[],
  tray: PassTray,
  query: string,
  coxswain: string,
  sail: string,
  weather: string,
  crossing: string,
  wait: string,
  rung: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): FerryPass[] {
  const text = query.trim().toLowerCase();
  const coxOn = coxswain === "all" ? "" : coxswain.trim().toLowerCase();
  const sailOn = sail === "all" ? "" : sailOf(sail);
  const weatherOn = weather === "all" ? "" : weatherOf(weather);
  const crossingOn = crossing === "all" ? "" : activeCrossing(crossing);
  const waitOn = wait === "all" ? "" : activeWait(wait);
  const rungOn = rung === "all" ? "" : activeRung(rung);
  return readFerryPasses(passes).filter((pass) => {
    if (!inTray(pass, tray)) return false;
    if (text && !`${pass.title} ${pass.note}`.toLowerCase().includes(text)) return false;
    if (coxOn && pass.coxswain.toLowerCase() !== coxOn) return false;
    if (sailOn && pass.sail !== sailOn) return false;
    if (weatherOn && pass.weather !== weatherOn) return false;
    if (crossingOn === "peak" && !peakCrossing(pass.crossing)) return false;
    if (crossingOn === "quiet" && !quietCrossing(pass.crossing)) return false;
    if (crossingOn && crossingOn !== "peak" && crossingOn !== "quiet" && pass.crossing !== crossingOn) return false;
    if (waitOn && String(pass.wait ?? "") !== waitOn) return false;
    if (rungOn && String(pass.rung) !== rungOn) return false;
    if (houseOnly && !houseSail(pass.sail)) return false;
    if (peakOnly && !peakCrossing(pass.crossing)) return false;
    if (quietOnly && !quietCrossing(pass.crossing)) return false;
    return true;
  });
}

export function sortFerry(passes: readonly FerryPass[], sort: PassSort): FerryPass[] {
  return passes.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "coxswain") {
      const cox = a.coxswain.localeCompare(b.coxswain);
      if (cox) return cox;
    }
    const crossing = (crossingIndex(a.crossing) < 0 ? 99 : crossingIndex(a.crossing)) - (crossingIndex(b.crossing) < 0 ? 99 : crossingIndex(b.crossing));
    if (crossing) return crossing;
    return a.title.localeCompare(b.title);
  });
}

export function ferryCounts(passes: readonly FerryPass[], shown: readonly FerryPass[], deskCrossing: unknown): PassCounts {
  const open = passes.filter((pass) => inTray(pass, "open"));
  void shown;
  return {
    open: open.length,
    held: passes.filter((pass) => inTray(pass, "held")).length,
    archived: passes.filter((pass) => inTray(pass, "archived")).length,
    pinned: open.filter((pass) => pass.pinned).length,
    peak: open.filter((pass) => peakCrossing(pass.crossing)).length,
    quiet: open.filter((pass) => quietCrossing(pass.crossing)).length,
    soon: open.filter((pass) => pass.wait === 12).length,
    rung: open.reduce((sum, pass) => sum + pass.rung, 0),
    house: open.filter((pass) => houseSail(pass.sail)).length,
    wait: open.filter((pass) => pass.wait !== null).length,
    matched: open.filter((pass) => pass.crossing && pass.crossing === crossingOf(deskCrossing)).length,
    flagged: open.filter((pass) => pass.flagged).length,
    idle: open.filter((pass) => idlePass(pass)).length,
    rush: open.filter((pass) => rushPass(pass)).length,
    resting: open.filter((pass) => restingPass(pass)).length,
    overdue: open.filter((pass) => overduePass(pass)).length,
  };
}

export function ferryShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function clashCrossingCount(passes: readonly FerryPass[]): number {
  const open = passes.filter((pass) => inTray(pass, "open") && pass.crossing);
  return open.filter((pass) => open.some((other) => other.id !== pass.id && other.crossing === pass.crossing && other.rung === pass.rung)).length;
}

export function waitClashCount(passes: readonly FerryPass[]): number {
  const open = passes.filter((pass) => inTray(pass, "open") && pass.crossing && pass.wait !== null);
  return open.filter((pass) => open.some((other) => other.id !== pass.id && other.crossing === pass.crossing && other.wait === pass.wait)).length;
}

export function neighborPassCount(passes: readonly FerryPass[]): number {
  const open = passes.filter((pass) => inTray(pass, "open") && rungIndex(pass.rung) >= 0);
  return open.filter((pass) => open.some((other) => {
    if (other.id === pass.id) return false;
    const gap = Math.abs(rungIndex(other.rung) - rungIndex(pass.rung));
    const ring = Math.min(gap, RUNG_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestCoxswain(passes: readonly FerryPass[]): string {
  const open = passes.filter((pass) => inTray(pass, "open") && pass.coxswain);
  let best = "";
  let score = 0;
  for (const pass of open) {
    const count = open.filter((item) => item.coxswain.toLowerCase() === pass.coxswain.toLowerCase()).length;
    if (count > score) {
      best = pass.coxswain;
      score = count;
    }
  }
  return best;
}

export function pairCoxCount(passes: readonly FerryPass[]): number {
  const open = passes.filter((pass) => inTray(pass, "open") && pass.coxswain);
  return open.filter((pass) => open.filter((item) => item.coxswain.toLowerCase() === pass.coxswain.toLowerCase()).length >= 2).length;
}

export function rungLoad(passes: readonly FerryPass[]): number {
  return passes.filter((pass) => inTray(pass, "open")).reduce((sum, pass) => sum + pass.rung, 0);
}

export function reminderPasses(passes: readonly FerryPass[]): FerryPass[] {
  return passes.filter((pass) => inTray(pass, "open") && overduePass(pass));
}

export function idlePasses(passes: readonly FerryPass[]): FerryPass[] {
  return passes.filter((pass) => inTray(pass, "open") && idlePass(pass));
}

export function matchedPasses(passes: readonly FerryPass[], deskCrossing: unknown): FerryPass[] {
  const crossing = crossingOf(deskCrossing);
  if (!crossing) return [];
  return passes.filter((pass) => inTray(pass, "open") && pass.crossing === crossing);
}

export function nextPass(passes: readonly FerryPass[], id: string): FerryPass | null {
  const open = sortFerry(passes.filter((pass) => inTray(pass, "open")), "crossing");
  const at = open.findIndex((pass) => pass.id === id);
  if (at < 0) return null;
  return open[at + 1] || null;
}

export function ferryTimeline(passes: readonly FerryPass[]): { rung: number; titles: string[] }[] {
  const open = passes.filter((pass) => inTray(pass, "open"));
  return RUNG_CYCLE.map((rung) => ({ rung, titles: open.filter((pass) => pass.rung === rung).map((pass) => pass.title) })).filter((lane) => lane.titles.length);
}

export function ferryCoxswains(passes: readonly FerryPass[]): string[] {
  const out: string[] = [];
  for (const pass of passes) {
    if (!pass.coxswain || out.some((item) => item.toLowerCase() === pass.coxswain.toLowerCase())) continue;
    out.push(pass.coxswain);
  }
  return out;
}

export function ferryCopy(pass: FerryPass): string {
  return [pass.title, pass.coxswain, pass.crossing, pass.sail, pass.weather, pass.wait ?? "", pass.rung, pass.note].filter((item) => item !== "").join(" · ");
}

export function ferryCsv(passes: readonly FerryPass[], deskCrossing: unknown): string {
  const lines = ["title,coxswain,crossing,sail,weather,wait,rung,tags,pinned,held,archived,flagged,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const pass of readFerryPasses(passes)) {
    const gap = crossingGap(pass.crossing, deskCrossing);
    lines.push([
      csvCell(pass.title),
      csvCell(pass.coxswain),
      pass.crossing,
      pass.sail,
      pass.weather,
      pass.wait === null ? "" : String(pass.wait),
      String(pass.rung),
      pass.tags.join(" "),
      pass.pinned ? "1" : "0",
      pass.held ? "1" : "0",
      pass.archived ? "1" : "0",
      pass.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      latePass(pass, deskCrossing) ? "1" : "0",
      idlePass(pass) ? "1" : "0",
      peakCrossing(pass.crossing) ? "1" : "0",
      quietCrossing(pass.crossing) ? "1" : "0",
      houseSail(pass.sail) ? "1" : "0",
      crossingBand(pass.crossing),
      rushPass(pass) ? "1" : "0",
      restingPass(pass) ? "1" : "0",
      overduePass(pass) ? "1" : "0",
      pass.audit,
      csvCell(pass.note),
    ].join(","));
  }
  return lines.join("\n");
}

function ribbonRecord(raw: RibbonValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function ribbonText(raw: RibbonValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = ribbonRecord(raw);
  if (!row) return "";
  return clip(row.campaign ?? row.code, 24);
}

function hasMoney(raw: RibbonValue): boolean {
  const row = ribbonRecord(raw);
  if (!row) return false;
  return MONEY_KEYS.some((key) => row[key] != null && row[key] !== "");
}

function ribbonCode(raw: RibbonValue): string {
  if (hasMoney(raw)) return "";
  const text = ribbonText(raw).toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9][A-Z0-9_-]{3,19}$/.test(text)) return "";
  return text;
}

/** A money field clears the ribbon. A code of four to twenty marks is set. A short code is clear. */
export function ribbonState(raw: RibbonValue): RibbonState {
  if (hasMoney(raw)) return "";
  return ribbonCode(raw) ? "set" : "clear";
}

/** The first mark, the last mark, and the length. NORTH is NH5. */
export function ribbonStamp(raw: RibbonValue): string {
  const code = ribbonState(raw) === "set" ? ribbonCode(raw) : "";
  if (!code) return "";
  return `${code.slice(0, 1)}${code.slice(-1)}${code.length}`;
}

/** A long code wins, then a split mark, then a twin start, then a digit, then a letter length. */
export function ribbonLane(raw: RibbonValue): RibbonLane {
  const code = ribbonState(raw) === "set" ? ribbonCode(raw) : "";
  if (!code) return "";
  if (code.length >= 14) return "full";
  if (/[-_]/.test(code)) return "split";
  if (code[0] === code[1]) return "twin";
  if (/^\d/.test(code)) return "digit";
  if (/^[A-Z]+$/.test(code) && code.length <= 6) return "brief";
  if (/^[A-Z]+$/.test(code)) return "name";
  return "mixed";
}

/** Hue follows the last mark. Digits are mist. */
export function ribbonHue(raw: RibbonValue): RibbonHue {
  const code = ribbonState(raw) === "set" ? ribbonCode(raw) : "";
  if (!code) return "";
  const last = code[code.length - 1];
  if (last >= "0" && last <= "9") return "mist";
  if (last <= "D") return "gilt";
  if (last <= "H") return "slate";
  if (last <= "L") return "sand";
  if (last <= "P") return "clay";
  if (last <= "T") return "soot";
  return "pearl";
}

export function ribbonBound(raw: RibbonValue): boolean {
  const code = ribbonState(raw) === "set" ? ribbonCode(raw) : "";
  return Boolean(code && (code.startsWith("F") || code.startsWith("7")));
}

export function ribbonWide(raw: RibbonValue): boolean {
  const code = ribbonState(raw) === "set" ? ribbonCode(raw) : "";
  return Boolean(code && code.length >= 10);
}

export function ribbonNotch(raw: RibbonValue): boolean {
  const code = ribbonState(raw) === "set" ? ribbonCode(raw) : "";
  return Boolean(code && code.includes("-"));
}

export function ribbonStep(raw: RibbonValue): number {
  const code = ribbonState(raw) === "set" ? ribbonCode(raw) : "";
  if (!code) return 0;
  return Math.min(6, new Set(code.split("")).size);
}

export function ribbonJoin(raw: RibbonValue): boolean {
  const code = ribbonState(raw) === "set" ? ribbonCode(raw) : "";
  return Boolean(code && /(.)\1\1/.test(code));
}

export function ribbonLanes(rows: readonly RibbonRow[]): RibbonLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = ribbonLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingRibbon(rows: readonly RibbonRow[]): string {
  const bars = ribbonLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingRibbonHue(rows: readonly RibbonRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = ribbonHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedRibbonCount(rows: readonly RibbonRow[]): number {
  const marks = rows.map((row) => ribbonStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneRibbonCount(rows: readonly RibbonRow[], lane: RibbonLane): number {
  return rows.filter((row) => ribbonLane(row.note) === lane).length;
}

export function hueRibbonCount(rows: readonly RibbonRow[], hue: RibbonHue): number {
  return rows.filter((row) => ribbonHue(row.note) === hue).length;
}

export function ribbonShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentRibbonLanes(rows: readonly RibbonRow[]): string[] {
  return ribbonLanes(rows).map((line) => line.lane);
}

export function readHiddenRibbons(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRibbons(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRibbon(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleRibbonReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRibbonReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRibbonLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleRibbons(
  rows: readonly RibbonRow[],
  lane: string,
  hue: string,
  query: string,
  review: RibbonReview,
  reviewed: readonly string[],
  shape: RibbonShape,
): RibbonRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (ribbonState(row.note) === "") return false;
    const found = ribbonLane(row.note);
    const hueName = ribbonHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${ribbonText(row.note)} ${ribbonStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "twin" && found !== "twin") return false;
    if (shape === "wide" && !ribbonWide(row.note)) return false;
    if (shape === "bound" && !ribbonBound(row.note)) return false;
    if (shape === "notch" && !ribbonNotch(row.note)) return false;
    if (shape === "digit" && found !== "digit") return false;
    return true;
  });
}

export function ribbonCopy(raw: RibbonValue): string {
  return [ribbonStamp(raw), ribbonLane(raw), ribbonHue(raw)].filter(Boolean).join(" ");
}

export function ribbonLanesCsv(rows: readonly RibbonRow[]): string {
  const lines = ["lane,count"];
  for (const line of ribbonLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function ribbonRowsCsv(rows: readonly RibbonRow[], reviewed: readonly string[]): string {
  const lines = ["code,stamp,lane,hue,step,join,wide,notch,bound,twin,digit,brief,name,split,full,mixed,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (ribbonState(row.note) !== "set") continue;
    const lane = ribbonLane(row.note);
    lines.push([
      csvCell(ribbonCode(row.note)),
      ribbonStamp(row.note),
      lane,
      ribbonHue(row.note),
      String(ribbonStep(row.note)),
      ribbonJoin(row.note) ? "1" : "0",
      ribbonWide(row.note) ? "1" : "0",
      ribbonNotch(row.note) ? "1" : "0",
      ribbonBound(row.note) ? "1" : "0",
      lane === "twin" ? "1" : "0",
      lane === "digit" ? "1" : "0",
      lane === "brief" ? "1" : "0",
      lane === "name" ? "1" : "0",
      lane === "split" ? "1" : "0",
      lane === "full" ? "1" : "0",
      lane === "mixed" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
