/**
 * Ambulatory lanterns for the follow-up desk, and country lamps already stored as country on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_ambulatory_lantern (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   station integer,
 *   flame text not null default '',
 *   pulse text not null default '',
 *   glass integer,
 *   oil integer not null default 0,
 *   marks text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_country_lamp_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_country_lamp_review (
 *   customer_id text primary key
 * );
 */

export const AML_KEY = "crmv4-ambulatory-lantern";
export const AML_VIEW_KEY = "crmv4-ambulatory-views";
export const AML_DENSITY_KEY = "crmv4-ambulatory-density";
export const CLM_KEY = "crmv4-country-lamp-hide";
export const CLM_REVIEW_KEY = "crmv4-country-lamp-review";

export type FlameName = "blank" | "ember" | "ivory" | "champagne";

export type PulseName = "blank" | "hush" | "bell" | "knock";

export type LanternTray = "open" | "held" | "closed";

export type StationPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type LanternDensity = "tall" | "low";

export type LanternSort = "station" | "keeper";

export type AmbulatoryLantern = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  station: number | null;
  flame: string;
  pulse: string;
  glass: number | null;
  oil: number;
  marks: string[];
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type LanternView = {
  id: string;
  name: string;
  tray: LanternTray;
  query: string;
  keeper: string;
  flame: string;
  pulse: string;
  station: string;
  glass: string;
  oil: string;
};

export type LanternCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  oil: number;
  house: number;
  window: number;
};

const AUDITS = ["save", "edit", "pulse", "pin", "unpin", "hold", "lift", "close", "open", "flame", "mark", "oil", "glass"] as const;

const FLAMES = ["ember", "ivory", "champagne"] as const;

const PULSES = ["hush", "bell", "knock"] as const;

const PULSE_ORDER = ["", "hush", "bell", "knock"] as const;

const PEAK_STATIONS = new Set([2, 5]);

const QUIET_STATIONS = new Set([1, 6]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const LANTERN_CAP = 7;

const VIEW_CAP = 5;

const MARK_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LanternTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function flameName(raw: unknown): Exclude<FlameName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FLAMES as readonly string[]).includes(text) ? (text as Exclude<FlameName, "blank">) : "";
}

function pulseNameOf(raw: unknown): Exclude<PulseName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PULSES as readonly string[]).includes(text) ? (text as Exclude<PulseName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function lanternLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function lanternNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A flame is EMBER, IVORY, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
export function flameOf(raw: unknown): string {
  const name = flameName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A station is an integer from 1 through 6.
 * A blank value stays unset. 0 is not a station.
 * A second digit is not a station.
 */
export function stationOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-6]$/.test(text)) return null;
  return Number(text);
}

/** A glass is 2, 6, or 12. A blank value stays unset. A leading zero is not a glass. */
export function glassOf(raw: unknown): 2 | 6 | 12 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 6 || raw === "6") return 6;
  if (raw === 12 || raw === "12") return 12;
  const text = clip(raw, 2);
  if (text === "2") return 2;
  if (text === "6") return 6;
  if (text === "12") return 12;
  return null;
}

/** Oil is 0, 1, or 4. Anything else is not oil. 0 clears the oil. */
export function oilOf(raw: unknown): 0 | 1 | 4 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 1 || raw === "1") return 1;
  if (raw === 4 || raw === "4") return 4;
  return null;
}

export function stationBand(station: unknown): "blank" | "early" | "mid" | "late" {
  const value = stationOf(station);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
}

/** Peak stations are 2 and 5. An unset station is not a peak station. */
export function peakStation(station: unknown): boolean {
  const value = stationOf(station);
  return value !== null && PEAK_STATIONS.has(value);
}

/** Quiet stations are 1 and 6. A peak station is not quiet. An unset station is not quiet. */
export function quietStation(station: unknown): boolean {
  const value = stationOf(station);
  return value !== null && QUIET_STATIONS.has(value);
}

/**
 * How far a station sits behind the desk station.
 * A positive gap means the lantern is behind. A negative gap means it is ahead.
 * A gap of zero means the same station. An unset station has no gap. Stations do not wrap.
 */
export function stationGap(station: unknown, desk: unknown): number | null {
  const from = stationOf(station);
  const at = stationOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** IVORY and CHAMPAGNE are house flames. EMBER is a guest flame. A blank flame is not a house flame. */
export function houseFlame(flame: unknown): boolean {
  return HOUSE.has(flameOf(flame));
}

/** Tall or low. Anything else stays tall. */
export function densityOf(raw: unknown): LanternDensity {
  return raw === "low" ? "low" : "tall";
}

/** Station or keeper. Anything else stays on the station. */
export function sortMode(raw: unknown): LanternSort {
  return raw === "keeper" ? "keeper" : "station";
}

function markOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[m-r]$/.test(text) ? text : "";
}

function marksOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,\s]+/);
  const out: string[] = [];
  for (const part of parts) {
    const mark = markOf(part);
    if (mark && !out.includes(mark)) out.push(mark);
    if (out.length >= MARK_CAP) break;
  }
  return out;
}

function readOne(raw: unknown): AmbulatoryLantern | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<AmbulatoryLantern>;
  const id = clip(row.id, 24);
  const title = lanternLine(row.title);
  if (!id || !title) return null;
  const oil = oilOf(row.oil);
  return {
    id,
    title,
    note: lanternNote(row.note),
    keeper: keeperLabel(row.keeper),
    station: stationOf(row.station),
    flame: flameOf(row.flame),
    pulse: pulseNameOf(row.pulse),
    glass: glassOf(row.glass),
    oil: oil === null ? 0 : oil,
    marks: marksOf(row.marks),
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readLanterns(raw: unknown): AmbulatoryLantern[] {
  if (!Array.isArray(raw)) return [];
  const out: AmbulatoryLantern[] = [];
  for (const item of raw) {
    const lantern = readOne(item);
    if (!lantern || out.some((row) => row.id === lantern.id || row.title === lantern.title)) continue;
    out.push(lantern);
  }
  return out.slice(0, LANTERN_CAP);
}

export function addLantern(
  lanterns: readonly AmbulatoryLantern[],
  lantern: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    station?: unknown;
    flame?: string;
    pulse?: string;
    glass?: unknown;
    oil?: unknown;
    marks?: unknown;
  },
): AmbulatoryLantern[] {
  const current = readLanterns(lanterns);
  const id = String(lantern.id || "").trim();
  const title = lanternLine(lantern.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const oil = oilOf(lantern.oil);
  const next: AmbulatoryLantern = {
    id,
    title,
    note: lanternNote(lantern.note),
    keeper: keeperLabel(lantern.keeper),
    station: stationOf(lantern.station),
    flame: flameOf(lantern.flame),
    pulse: pulseNameOf(lantern.pulse),
    glass: glassOf(lantern.glass),
    oil: oil === null ? 0 : oil,
    marks: marksOf(lantern.marks),
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, LANTERN_CAP);
}

export function cyclePulse(lanterns: readonly AmbulatoryLantern[], id: string): AmbulatoryLantern[] {
  return readLanterns(lanterns).map((lantern) => {
    if (lantern.id !== id) return lantern;
    const at = PULSE_ORDER.indexOf(lantern.pulse as (typeof PULSE_ORDER)[number]);
    const next = at < 0 || at >= PULSES.length ? PULSES[0] : PULSES[at % PULSES.length];
    if (!next || next === lantern.pulse) return lantern;
    return { ...lantern, pulse: next, audit: "pulse" };
  });
}

/** A blank title is left as it is. */
export function editLantern(lanterns: readonly AmbulatoryLantern[], id: string, title: unknown): AmbulatoryLantern[] {
  const next = lanternLine(title);
  if (!next) return readLanterns(lanterns);
  const current = readLanterns(lanterns);
  if (current.some((lantern) => lantern.id !== id && lantern.title === next)) return current;
  return current.map((lantern) => (lantern.id === id && lantern.title !== next ? { ...lantern, title: next, audit: "edit" } : lantern));
}

/** A blank note is left as it is. */
export function editLanternNote(lanterns: readonly AmbulatoryLantern[], id: string, note: unknown): AmbulatoryLantern[] {
  const next = lanternNote(note);
  if (!next) return readLanterns(lanterns);
  return readLanterns(lanterns).map((lantern) => (lantern.id === id && lantern.note !== next ? { ...lantern, note: next, audit: "edit" } : lantern));
}

/** A mark that is already on the lantern, or a fourth mark, is left out. A mark is one letter from m to r. */
export function addLanternMark(lanterns: readonly AmbulatoryLantern[], id: string, mark: unknown): AmbulatoryLantern[] {
  const next = markOf(mark);
  if (!next) return readLanterns(lanterns);
  return readLanterns(lanterns).map((lantern) => {
    if (lantern.id !== id || lantern.marks.includes(next) || lantern.marks.length >= MARK_CAP) return lantern;
    return { ...lantern, marks: [...lantern.marks, next], audit: "mark" };
  });
}

/** An unknown oil is left as it is. 0 clears the oil. */
export function setLanternOil(lanterns: readonly AmbulatoryLantern[], id: string, oil: unknown): AmbulatoryLantern[] {
  const next = oilOf(oil);
  if (next === null) return readLanterns(lanterns);
  return readLanterns(lanterns).map((lantern) => (lantern.id === id && lantern.oil !== next ? { ...lantern, oil: next, audit: "oil" } : lantern));
}

/** A short glass becomes 6, a measured glass becomes 12, and a long glass stays. An unset glass becomes 2. */
export function snoozeLantern(lanterns: readonly AmbulatoryLantern[], id: string): AmbulatoryLantern[] {
  return readLanterns(lanterns).map((lantern) => {
    if (lantern.id !== id) return lantern;
    const next = lantern.glass === 2 ? 6 : lantern.glass === 6 ? 12 : lantern.glass === 12 ? 12 : 2;
    if (next === lantern.glass) return lantern;
    return { ...lantern, glass: next, audit: "glass" };
  });
}

export function setLanternPin(lanterns: readonly AmbulatoryLantern[], id: string, pinned: boolean): AmbulatoryLantern[] {
  return readLanterns(lanterns).map((lantern) => (lantern.id === id && lantern.pinned !== pinned ? { ...lantern, pinned, audit: pinned ? "pin" : "unpin" } : lantern));
}

/** P toggles the pin on the focused row of the board currently shown. */
export function pinFocused(lanterns: readonly AmbulatoryLantern[], shownIds: readonly string[], index: number): AmbulatoryLantern[] {
  if (!shownIds.length) return readLanterns(lanterns);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readLanterns(lanterns).find((lantern) => lantern.id === id);
  if (!row) return readLanterns(lanterns);
  return setLanternPin(lanterns, id, !row.pinned);
}

/** O lengthens the glass on the focused lantern. */
export function snoozeFocused(lanterns: readonly AmbulatoryLantern[], shownIds: readonly string[], index: number): AmbulatoryLantern[] {
  if (!shownIds.length) return readLanterns(lanterns);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readLanterns(lanterns).some((lantern) => lantern.id === id)) return readLanterns(lanterns);
  return snoozeLantern(lanterns, id);
}

/** H toggles the hold on the focused row. */
export function holdFocused(lanterns: readonly AmbulatoryLantern[], shownIds: readonly string[], index: number): AmbulatoryLantern[] {
  if (!shownIds.length) return readLanterns(lanterns);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readLanterns(lanterns).find((lantern) => lantern.id === id);
  if (!row) return readLanterns(lanterns);
  return setLanternHold(lanterns, id, !row.held);
}

export function setLanternHold(lanterns: readonly AmbulatoryLantern[], id: string, held: boolean): AmbulatoryLantern[] {
  return readLanterns(lanterns).map((lantern) => (lantern.id === id && lantern.held !== held ? { ...lantern, held, audit: held ? "hold" : "lift" } : lantern));
}

export function setLanternClose(lanterns: readonly AmbulatoryLantern[], id: string, closed: boolean): AmbulatoryLantern[] {
  return readLanterns(lanterns).map((lantern) => (lantern.id === id && lantern.closed !== closed ? { ...lantern, closed, audit: closed ? "close" : "open" } : lantern));
}

export function bulkLanternFlame(lanterns: readonly AmbulatoryLantern[], ids: readonly string[], flame: unknown): AmbulatoryLantern[] {
  const next = flameOf(flame);
  if (!next) return readLanterns(lanterns);
  const picked = new Set(ids);
  return readLanterns(lanterns).map((lantern) => (picked.has(lantern.id) && lantern.flame !== next ? { ...lantern, flame: next, audit: "flame" } : lantern));
}

export function bulkLanternPin(lanterns: readonly AmbulatoryLantern[], ids: readonly string[], pinned: boolean): AmbulatoryLantern[] {
  const picked = new Set(ids);
  return readLanterns(lanterns).map((lantern) => (picked.has(lantern.id) && lantern.pinned !== pinned ? { ...lantern, pinned, audit: pinned ? "pin" : "unpin" } : lantern));
}

export function bulkLanternClose(lanterns: readonly AmbulatoryLantern[], ids: readonly string[], closed: boolean): AmbulatoryLantern[] {
  const picked = new Set(ids);
  return readLanterns(lanterns).map((lantern) => (picked.has(lantern.id) && lantern.closed !== closed ? { ...lantern, closed, audit: closed ? "close" : "open" } : lantern));
}

export function bulkLanternPulse(lanterns: readonly AmbulatoryLantern[], ids: readonly string[], pulse: unknown): AmbulatoryLantern[] {
  const next = pulseNameOf(pulse);
  if (!next) return readLanterns(lanterns);
  const picked = new Set(ids);
  return readLanterns(lanterns).map((lantern) => (picked.has(lantern.id) && lantern.pulse !== next ? { ...lantern, pulse: next, audit: "pulse" } : lantern));
}

export function bulkLanternMark(lanterns: readonly AmbulatoryLantern[], ids: readonly string[], mark: unknown): AmbulatoryLantern[] {
  return ids.reduce((rows, id) => addLanternMark(rows, id, mark), readLanterns(lanterns));
}

export function resetLanterns(): AmbulatoryLantern[] {
  return [];
}

function inTray(lantern: AmbulatoryLantern, tray: LanternTray): boolean {
  if (tray === "closed") return lantern.closed;
  if (tray === "held") return lantern.held && !lantern.closed;
  return !lantern.held && !lantern.closed;
}

function stationHit(station: number | null, exact: number | null, pick: StationPick | null): boolean {
  if (exact !== null) return station === exact;
  if (pick === null) return true;
  if (pick === "blank") return station === null;
  if (pick === "peak") return peakStation(station);
  if (pick === "quiet") return quietStation(station);
  return stationBand(station) === pick;
}

/** An open lantern whose station sits more than one station behind the desk. Oil, a hold, or a close is not late. */
export function lateLantern(lantern: AmbulatoryLantern, desk: unknown): boolean {
  const gap = stationGap(lantern.station, desk);
  return inTray(lantern, "open") && lantern.oil === 0 && gap !== null && gap > 1;
}

/** An open lantern with a glass of 2 is due now. Oil, a hold, or a close is not. */
export function soonLantern(lantern: AmbulatoryLantern): boolean {
  return inTray(lantern, "open") && lantern.oil === 0 && lantern.glass === 2;
}

/** Open lanterns that are late or due now. An oiled lantern stays off the reminder list. */
export function reminderLanterns(lanterns: readonly AmbulatoryLantern[], desk: unknown): AmbulatoryLantern[] {
  return readLanterns(lanterns).filter((lantern) => lateLantern(lantern, desk) || soonLantern(lantern));
}

/** Open lanterns whose station sits within one station of the desk. Oil, a hold, or a close stays out. */
export function windowLanterns(lanterns: readonly AmbulatoryLantern[], desk: unknown): AmbulatoryLantern[] {
  return readLanterns(lanterns).filter((lantern) => {
    const gap = stationGap(lantern.station, desk);
    return inTray(lantern, "open") && lantern.oil === 0 && gap !== null && Math.abs(gap) <= 1;
  });
}

/** Search matches the title, the note, the keeper, and the marks. */
export function visibleLanterns(
  lanterns: readonly AmbulatoryLantern[],
  tray: LanternTray,
  query: string,
  keeper: string | null,
  flame: string | null,
  pulse: string | null,
  exact: number | null,
  pick: StationPick | null,
  glass: number | "blank" | null,
  oil: number | "blank" | null,
  knockOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  dryOnly: boolean,
): AmbulatoryLantern[] {
  const text = query.trim().toLowerCase();
  return readLanterns(lanterns).filter((lantern) => {
    if (!inTray(lantern, tray)) return false;
    if (text) {
      const hay = `${lantern.title} ${lantern.note} ${lantern.keeper} ${lantern.marks.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (keeper !== null && lantern.keeper !== keeper) return false;
    if (flame === "blank" ? Boolean(lantern.flame) : flame && lantern.flame !== flame) return false;
    if (pulse === "blank" ? Boolean(lantern.pulse) : pulse && lantern.pulse !== pulse) return false;
    if (!stationHit(lantern.station, exact, pick)) return false;
    if (glass === "blank" ? lantern.glass !== null : glass !== null && lantern.glass !== glass) return false;
    if (oil === "blank" ? lantern.oil !== 0 : oil !== null && lantern.oil !== oil) return false;
    if (knockOnly && lantern.pulse !== "knock") return false;
    if (peakOnly && !peakStation(lantern.station)) return false;
    if (houseOnly && !houseFlame(lantern.flame)) return false;
    if (quietOnly && !quietStation(lantern.station)) return false;
    if (dryOnly && lantern.oil !== 0) return false;
    return true;
  });
}

export function sortLanterns(lanterns: readonly AmbulatoryLantern[], mode: LanternSort): AmbulatoryLantern[] {
  const rows = lanterns.slice();
  if (mode === "keeper") return rows.sort((a, b) => a.keeper.localeCompare(b.keeper) || (a.station ?? 99) - (b.station ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.station ?? 99) - (b.station ?? 99) || a.title.localeCompare(b.title));
}

export function lanternLedger(lanterns: readonly AmbulatoryLantern[], query: string): AmbulatoryLantern[] {
  const text = query.trim().toLowerCase();
  return sortLanterns(
    readLanterns(lanterns).filter((lantern) => lantern.station !== null && (!text || lantern.title.toLowerCase().includes(text))),
    "station",
  );
}

export function lanternCounts(lanterns: readonly AmbulatoryLantern[], desk: unknown): LanternCounts {
  const rows = readLanterns(lanterns);
  return {
    open: rows.filter((lantern) => inTray(lantern, "open")).length,
    held: rows.filter((lantern) => inTray(lantern, "held")).length,
    closed: rows.filter((lantern) => inTray(lantern, "closed")).length,
    pinned: rows.filter((lantern) => lantern.pinned).length,
    peak: rows.filter((lantern) => inTray(lantern, "open") && lantern.oil === 0 && peakStation(lantern.station)).length,
    late: rows.filter((lantern) => lateLantern(lantern, desk)).length,
    soon: rows.filter((lantern) => soonLantern(lantern)).length,
    oil: rows.filter((lantern) => inTray(lantern, "open") && lantern.oil > 0).length,
    house: rows.filter((lantern) => inTray(lantern, "open") && houseFlame(lantern.flame)).length,
    window: windowLanterns(rows, desk).length,
  };
}

export function lanternShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open lanterns as a share of every open lantern. */
export function lateShare(lanterns: readonly AmbulatoryLantern[], desk: unknown): number {
  const rows = readLanterns(lanterns);
  const open = rows.filter((lantern) => inTray(lantern, "open")).length;
  const late = rows.filter((lantern) => lateLantern(lantern, desk)).length;
  return lanternShare(late, open);
}

/** Distinct stations on open lanterns. */
export function usedStations(lanterns: readonly AmbulatoryLantern[]): number {
  const stations = new Set<number>();
  for (const lantern of readLanterns(lanterns)) {
    if (inTray(lantern, "open") && lantern.station !== null) stations.add(lantern.station);
  }
  return stations.size;
}

/** Open lanterns that share a station and a flame. A different flame on the same station is not a clash. */
export function clashStationCount(lanterns: readonly AmbulatoryLantern[]): number {
  const groups = new Map<string, number>();
  for (const lantern of readLanterns(lanterns)) {
    if (!inTray(lantern, "open") || lantern.station === null || !lantern.flame) continue;
    const key = `${lantern.station}:${lantern.flame}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open lanterns that share a glass. An unset glass is not a clash. */
export function glassClashCount(lanterns: readonly AmbulatoryLantern[]): number {
  const groups = new Map<number, number>();
  for (const lantern of readLanterns(lanterns)) {
    if (!inTray(lantern, "open") || lantern.glass === null) continue;
    groups.set(lantern.glass, (groups.get(lantern.glass) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open lanterns in the same flame whose stations differ by two.
 * The count is the lanterns that have at least one neighbor.
 */
export function adjacentLanternCount(lanterns: readonly AmbulatoryLantern[]): number {
  const open = readLanterns(lanterns).filter((lantern) => inTray(lantern, "open") && lantern.station !== null && lantern.flame);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.flame === right.flame && Math.abs((left.station ?? 0) - (right.station ?? 0)) === 2) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The flame with the fewest open lanterns.
 * A tie keeps EMBER, then IVORY, then CHAMPAGNE.
 * An empty desk still suggests EMBER.
 */
export function suggestFlame(lanterns: readonly AmbulatoryLantern[]): "EMBER" | "IVORY" | "CHAMPAGNE" {
  const rows = readLanterns(lanterns).filter((lantern) => inTray(lantern, "open"));
  const order = ["EMBER", "IVORY", "CHAMPAGNE"] as const;
  let best: "EMBER" | "IVORY" | "CHAMPAGNE" = "EMBER";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const flame of order) {
    const count = rows.filter((lantern) => lantern.flame === flame).length;
    if (count < bestCount) {
      best = flame;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The glass with the fewest open lanterns.
 * A tie keeps 6, then 2, then 12.
 * An empty desk still suggests 6.
 */
export function suggestGlass(lanterns: readonly AmbulatoryLantern[]): 2 | 6 | 12 {
  const rows = readLanterns(lanterns).filter((lantern) => inTray(lantern, "open"));
  const order = [6, 2, 12] as const;
  let best: 2 | 6 | 12 = 6;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const glass of order) {
    const count = rows.filter((lantern) => lantern.glass === glass).length;
    if (count < bestCount) {
      best = glass;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open keeper. A blank keeper is skipped. An empty desk stays blank. */
export function suggestKeeper(lanterns: readonly AmbulatoryLantern[]): string {
  const found = readLanterns(lanterns).find((lantern) => inTray(lantern, "open") && lantern.keeper);
  return found ? found.keeper : "";
}

/**
 * The keeper carrying the fewest open lanterns.
 * A tie keeps the earlier name. A blank keeper is not a load.
 * An empty roster falls back to the newest keeper.
 */
export function fairKeeper(lanterns: readonly AmbulatoryLantern[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = keeperLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestKeeper(lanterns);
  const open = readLanterns(lanterns).filter((lantern) => inTray(lantern, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((lantern) => lantern.keeper === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The keeper with the most open lanterns. A tie keeps the newer name on the desk. */
export function busiestKeeper(lanterns: readonly AmbulatoryLantern[]): string {
  const rows = readLanterns(lanterns).filter((lantern) => inTray(lantern, "open") && lantern.keeper);
  const names: string[] = [];
  for (const lantern of rows) if (!names.includes(lantern.keeper)) names.push(lantern.keeper);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((lantern) => lantern.keeper === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function lanternKeepers(lanterns: readonly AmbulatoryLantern[]): string[] {
  const out: string[] = [];
  for (const lantern of readLanterns(lanterns)) {
    if (lantern.keeper && !out.includes(lantern.keeper)) out.push(lantern.keeper);
  }
  return out;
}

export function lanternFlames(lanterns: readonly AmbulatoryLantern[]): string[] {
  const out: string[] = [];
  for (const lantern of readLanterns(lanterns)) {
    if (lantern.flame && !out.includes(lantern.flame)) out.push(lantern.flame);
  }
  return out;
}

/** Open lanterns whose keeper also keeps another open lantern on a different station. */
export function pairKeeperCount(lanterns: readonly AmbulatoryLantern[]): number {
  const open = readLanterns(lanterns).filter((lantern) => inTray(lantern, "open") && lantern.keeper && lantern.station !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].keeper === open[j].keeper && open[i].station !== open[j].station) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open lanterns that share a flame on different stations. */
export function sharedFlameCount(lanterns: readonly AmbulatoryLantern[]): number {
  const open = readLanterns(lanterns).filter((lantern) => inTray(lantern, "open") && lantern.flame && lantern.station !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].flame === open[j].flame && open[i].station !== open[j].station) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The oil weight of open lanterns. A clear oil adds nothing. */
export function oilLoad(lanterns: readonly AmbulatoryLantern[]): number {
  return readLanterns(lanterns).filter((lantern) => inTray(lantern, "open")).reduce((sum, lantern) => sum + lantern.oil, 0);
}

/** Open lanterns that are both a quiet station and a house flame. */
export function quietHouseCount(lanterns: readonly AmbulatoryLantern[]): number {
  return readLanterns(lanterns).filter((lantern) => inTray(lantern, "open") && quietStation(lantern.station) && houseFlame(lantern.flame)).length;
}

/** Open lanterns whose pulse is knock. */
export function knockLoad(lanterns: readonly AmbulatoryLantern[]): number {
  return readLanterns(lanterns).filter((lantern) => inTray(lantern, "open") && lantern.pulse === "knock").length;
}

/** The span from the lowest open station to the highest. Fewer than two stations spans nothing. */
export function stationSpan(lanterns: readonly AmbulatoryLantern[]): number {
  const stations = readLanterns(lanterns).filter((lantern) => inTray(lantern, "open") && lantern.station !== null).map((lantern) => lantern.station as number);
  if (stations.length < 2) return 0;
  return Math.max(...stations) - Math.min(...stations);
}

/**
 * The next open lantern at or after the desk station.
 * A knock pulse, oil, a hold, and a close stay off the list.
 * When every open station is behind, the earliest station is next.
 */
export function nextLantern(lanterns: readonly AmbulatoryLantern[], desk: unknown): string {
  const now = stationOf(desk);
  if (now === null) return "";
  const waiting = readLanterns(lanterns).filter((lantern) => inTray(lantern, "open") && lantern.station !== null && lantern.pulse !== "knock" && lantern.oil === 0);
  if (!waiting.length) return "";
  const byStation = (a: AmbulatoryLantern, b: AmbulatoryLantern) => (a.station ?? 0) - (b.station ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((lantern) => (lantern.station ?? 0) >= now).sort(byStation);
  const upcoming = later[0];
  if (upcoming) return upcoming.id;
  const earliest = waiting.slice().sort(byStation)[0];
  return earliest ? earliest.id : "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function lanternCopy(lantern: AmbulatoryLantern, desk: unknown): string {
  const gap = stationGap(lantern.station, desk);
  return [lantern.title, lantern.keeper, lantern.station ?? "", lantern.flame, lantern.pulse, lantern.glass ?? "", lantern.oil, lantern.marks.join(" "), lantern.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the lanterns saved in this browser. The gap and the late mark use the station you pass. */
export function lanternsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,keeper,station,flame,pulse,glass,oil,marks,pinned,held,closed,gap,late,soon,house,window,note,audit"];
  const rows = readLanterns(raw);
  const windowIds = new Set(windowLanterns(rows, desk).map((lantern) => lantern.id));
  for (const lantern of rows) {
    const gap = stationGap(lantern.station, desk);
    lines.push([
      lantern.title,
      lantern.keeper,
      lantern.station === null ? "" : String(lantern.station),
      lantern.flame,
      lantern.pulse,
      lantern.glass === null ? "" : String(lantern.glass),
      String(lantern.oil),
      lantern.marks.join(" "),
      lantern.pinned ? "1" : "0",
      lantern.held ? "1" : "0",
      lantern.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateLantern(lantern, desk) ? "1" : "0",
      soonLantern(lantern) ? "1" : "0",
      houseFlame(lantern.flame) ? "1" : "0",
      windowIds.has(lantern.id) ? "1" : "0",
      lantern.note,
      lantern.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeKeeper(raw: string, keepers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return keepers.includes(raw) ? raw : "all";
}

export function activeFlame(raw: string, flames: readonly string[]): string {
  if (raw === "blank") return "blank";
  return flameOf(raw) && flames.includes(flameOf(raw)) ? flameOf(raw) : "all";
}

export function activePulse(raw: string, pulses: readonly string[]): string {
  if (raw === "blank") return "blank";
  const pulse = pulseNameOf(raw);
  return pulse && pulses.includes(pulse) ? pulse : "all";
}

export function activeStation(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const station = stationOf(raw);
  return station === null ? "all" : String(station);
}

export function activeGlass(raw: string): string {
  if (raw === "blank") return "blank";
  const glass = glassOf(raw);
  return glass === null ? "all" : String(glass);
}

export function activeOil(raw: string): string {
  if (raw === "blank") return "blank";
  const oil = oilOf(raw);
  return oil === null ? "all" : String(oil);
}

export function keeperArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function flameArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return flameOf(filter) || null;
}

export function pulseArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return pulseNameOf(filter) || null;
}

export function stationArg(filter: string): { exact: number | null; pick: StationPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: stationOf(filter), pick: null };
}

export function glassArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return glassOf(filter);
}

export function oilArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return oilOf(filter);
}

function readView(raw: unknown): LanternView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<LanternView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    keeper: row.keeper === "blank" ? "blank" : clip(row.keeper, 16) || "all",
    flame: row.flame === "blank" || row.flame === "all" ? (row.flame === "blank" ? "blank" : "all") : flameOf(row.flame) || "all",
    pulse: row.pulse === "blank" || row.pulse === "all" ? (row.pulse === "blank" ? "blank" : "all") : pulseNameOf(row.pulse) || "all",
    station: activeStation(String(row.station || "all")),
    glass: activeGlass(String(row.glass || "all")),
    oil: activeOil(String(row.oil || "all")),
  };
}

export function readLanternViews(raw: unknown): LanternView[] {
  if (!Array.isArray(raw)) return [];
  const out: LanternView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addLanternView(views: readonly LanternView[], view: LanternView): LanternView[] {
  const current = readLanternViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropLanternView(views: readonly LanternView[], id: string): LanternView[] {
  return readLanternViews(views).filter((view) => view.id !== id);
}

export type LampState = "" | "set" | "clear";

export type LampLane = "" | "north" | "mid" | "south";

export type LampTone = "" | "gilt" | "ink" | "ivory" | "mist" | "plain";

export type LampShape = "all" | "catalog" | "wide" | "gilt";

export type LampValue =
  | string
  | { country?: unknown; language?: unknown; lastOs?: unknown; lastDevice?: unknown; email?: unknown; lastIp?: unknown; timezone?: unknown; username?: unknown; phone?: unknown; city?: unknown; desk?: unknown; name?: unknown }
  | null
  | undefined;

export type LampRow = { id: string; label?: string; note: LampValue };

export type LampLaneLine = { lane: string; count: number };

const LAMP_LANES = ["north", "mid", "south"] as const;

const LAMP_TONES = ["gilt", "ink", "ivory", "mist", "plain"] as const;

const CATALOG = new Set(["turkey", "germany", "russia", "emirates", "arabia"]);

const LAMP_BLOCK = ["language", "lastOs", "lastDevice", "lastUserAgent", "lastIp", "timezone", "username", "phone", "city", "desk", "name", "email"] as const;

function lampBody(raw: unknown): string {
  return clip(raw, 24).toLowerCase().replace(/[^a-z]/g, "");
}

function lampText(value: LampValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: lampBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (LAMP_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("country" in value)) return { text: null, explicit: false };
  const inner = value.country;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: lampBody(inner), explicit: true };
}

export function lampState(value: LampValue): LampState {
  const found = lampText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function lampCopy(value: LampValue): string {
  const found = lampText(value);
  if (!found.text) return "";
  return found.text;
}

/** A lamp keeps the first two letters. A single letter stays one letter. */
export function lampOf(value: LampValue): string {
  const text = lampCopy(value);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

/** A through C is north. D through M is mid. N through Z is south. */
export function lampLane(value: LampValue): LampLane {
  const text = lampCopy(value);
  if (!text || !lampOf(value)) return "";
  const first = text[0];
  if (!first) return "";
  if (first <= "c") return "north";
  if (first <= "m") return "mid";
  return "south";
}

/** Turkey is gilt. Germany is ink. Russia is ivory. Emirates is mist. Every other marked lamp is plain. */
export function lampTone(value: LampValue): LampTone {
  const text = lampCopy(value);
  if (!text || !lampOf(value)) return "";
  if (text === "tr" || text.startsWith("turk")) return "gilt";
  if (text === "de" || text.startsWith("german") || text.startsWith("deutsch")) return "ink";
  if (text === "ru" || text.startsWith("russia")) return "ivory";
  if (text === "ae" || text === "uae" || text.startsWith("emirat")) return "mist";
  return "plain";
}

/** Turkey, Germany, Russia, Emirates, and Arabia are the house catalog. A longer name is not. */
export function catalogLamp(value: LampValue): boolean {
  return CATALOG.has(lampCopy(value));
}

export function catalogLampCount(rows: readonly LampRow[]): number {
  return rows.filter((row) => catalogLamp(row.note)).length;
}

export function wideLampCount(rows: readonly LampRow[]): number {
  return rows.filter((row) => lampCopy(row.note).length > 10).length;
}

export function giltLampCount(rows: readonly LampRow[]): number {
  return rows.filter((row) => lampTone(row.note) === "gilt").length;
}

/** Customers whose lamp monogram is shared with at least one other customer. */
export function sharedLampCount(rows: readonly LampRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = lampOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function lampLanes(rows: readonly LampRow[]): LampLaneLine[] {
  return LAMP_LANES.map((lane) => ({ lane, count: rows.filter((row) => lampLane(row.note) === lane).length }));
}

/** The lane with the most set lamps. A tie keeps north, then mid, then south. */
export function leadingLamp(rows: readonly LampRow[]): string {
  const lines = lampLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || LAMP_LANES.indexOf(a.lane as (typeof LAMP_LANES)[number]) - LAMP_LANES.indexOf(b.lane as (typeof LAMP_LANES)[number]))[0];
  return lead ? lead.lane : "";
}

/** The tone with the most set lamps. A tie keeps gilt, then ink, then ivory, then mist, then plain. */
export function leadingLampTone(rows: readonly LampRow[]): string {
  const counts = LAMP_TONES.map((tone) => ({ tone, count: rows.filter((row) => lampTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || LAMP_TONES.indexOf(a.tone) - LAMP_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function lampShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentLamps(rows: readonly LampRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = lampState(row.note);
    const lane = state === "set" ? lampLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenLamps(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = String(item);
    if (allow.has(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedLamps(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleLamp(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleLampReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLampReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLampLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function visibleLampCustomers(
  rows: readonly LampRow[],
  lane: LampLane | "blank" | null,
  tone: LampTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: LampShape,
): LampRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = lampState(row.note);
    const mark = state === "set" ? lampLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && mark !== lane) return false;
    if (tone && lampTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogLamp(row.note)) return false;
    if (shape === "wide" && lampCopy(row.note).length <= 10) return false;
    if (shape === "gilt" && lampTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${lampCopy(row.note)} ${lampOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeLampLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeLampTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "mist" || raw === "plain" ? raw : "all";
}

export function lampLaneArg(filter: string): LampLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "north" || filter === "mid" || filter === "south") return filter;
  return null;
}

export function lampToneArg(filter: string): LampTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "mist" || filter === "plain") return filter;
  return null;
}

export function lampsCsv(rows: readonly LampRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of lampLanes(rows)) lines.push(`lane,${line.lane},${line.count}`);
  lines.push(`catalog,catalog,${catalogLampCount(rows)}`);
  lines.push(`wide,wide,${wideLampCount(rows)}`);
  lines.push(`tone,gilt,${giltLampCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => lampTone(row.note) === "ink").length}`);
  lines.push(`tone,ivory,${rows.filter((row) => lampTone(row.note) === "ivory").length}`);
  lines.push(`tone,mist,${rows.filter((row) => lampTone(row.note) === "mist").length}`);
  lines.push(`tone,plain,${rows.filter((row) => lampTone(row.note) === "plain").length}`);
  lines.push(`shared,shared,${sharedLampCount(rows)}`);
  return lines.join("\n");
}

export function lampRowsCsv(rows: readonly LampRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,seal,lane,tone,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = lampState(row.note);
    const lane = state === "set" ? lampLane(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      lampOf(row.note),
      lane,
      state === "set" ? lampTone(row.note) : "",
      catalogLamp(row.note) ? "1" : "0",
      lampCopy(row.note).length > 10 ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
