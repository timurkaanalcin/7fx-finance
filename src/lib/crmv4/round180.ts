/**
 * Map-room bearings for the chart desk, and the email already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_map_bearing (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   pilot text not null default '',
 *   station integer,
 *   ink text not null default '',
 *   cipher text not null default '',
 *   glaze text not null default '',
 *   span integer,
 *   cord integer,
 *   pinned boolean not null default false,
 *   fixed boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_mail_seal_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_mail_seal_review (
 *   customer_id text primary key
 * );
 */

export const BEARING_KEY = "crmv4-map-bearings";
export const BEARING_VIEW_KEY = "crmv4-map-bearing-views";
export const SEAL_KEY = "crmv4-mail-seal-hide";
export const SEAL_REVIEW_KEY = "crmv4-mail-seal-review";

export type BearingInk = "blank" | "ink" | "chalk" | "gilt";

export type BearingGlaze = "blank" | "pearl" | "brass" | "slate";

export type BearingTray = "open" | "fixed" | "filed";

export type StationPick = "blank" | "dawn" | "day" | "dusk" | "peak" | "quiet";

export type Bearing = {
  id: string;
  title: string;
  note: string;
  pilot: string;
  station: number | null;
  ink: string;
  cipher: string;
  glaze: string;
  span: number | null;
  cord: number | null;
  pinned: boolean;
  fixed: boolean;
  filed: boolean;
  audit: string;
};

export type BearingView = {
  id: string;
  name: string;
  tray: BearingTray;
  query: string;
  pilot: string;
  ink: string;
  cipher: string;
  glaze: string;
  station: string;
  span: string;
  cord: string;
};

export type BearingCounts = {
  open: number;
  fixed: number;
  filed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type SealState = "" | "set" | "clear";

export type SealBand = "" | "pip" | "slip" | "card" | "roll";

export type SealDepth = "" | "plain" | "pair" | "stack" | "seam" | "rail" | "figure";

export type SealShape = "all" | "plus" | "odd";

export type SealValue =
  | {
      email?: unknown;
      city?: unknown;
      failedLoginCount?: unknown;
      loginBlockedAt?: unknown;
      loginBlockedMessage?: unknown;
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
      withdrawalsEnabled?: unknown;
      isTest?: unknown;
      name?: unknown;
      country?: unknown;
      desk?: unknown;
      deskId?: unknown;
      saleStatus?: unknown;
      retentionStatus?: unknown;
      potentialStatus?: unknown;
      documentsStatus?: unknown;
      accountType?: unknown;
      validationStatus?: unknown;
      registrationDate?: unknown;
      birthDate?: unknown;
      lastContactAt?: unknown;
      lastSeenAt?: unknown;
      retentionNote?: unknown;
      phone?: unknown;
      address?: unknown;
      lastCountry?: unknown;
      registrationCountry?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type SealRow = { id?: string; note?: SealValue; label?: string | null };

export type SealBandLine = { band: string; count: number };

export type SealDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "glaze", "pin", "unpin", "fix", "lift", "file", "restore", "shift"] as const;

const INKS = ["ink", "chalk", "gilt"] as const;

const GLAZES = ["pearl", "brass", "slate"] as const;

const GLAZE_ORDER = ["", "pearl", "brass", "slate"] as const;

const PICKS = ["blank", "dawn", "day", "dusk", "peak", "quiet"] as const;

const PEAKS = new Set([3, 7]);

const QUIETS = new Set([1, 4, 8]);

const SPANS = [2, 4, 8] as const;

const CORDS = [3, 7, 11] as const;

const HOME = new Set(["EN", "FR", "IT"]);

const SEAL_BANDS = ["pip", "slip", "card", "roll"] as const;

const DEPTHS = ["plain", "pair", "stack", "seam", "rail", "figure"] as const;

const STATES = ["set", "clear"] as const;

const SEAL_BLOCK = [
  "city",
  "failedLoginCount",
  "loginBlockedAt",
  "loginBlockedMessage",
  "loginEnabled",
  "tradingEnabled",
  "withdrawalsEnabled",
  "isTest",
  "name",
  "country",
  "desk",
  "deskId",
  "saleStatus",
  "retentionStatus",
  "potentialStatus",
  "documentsStatus",
  "accountType",
  "validationStatus",
  "registrationDate",
  "birthDate",
  "lastContactAt",
  "lastSeenAt",
  "retentionNote",
  "phone",
  "address",
  "lastCountry",
  "registrationCountry",
] as const;

const BEARING_CAP = 8;

const VIEW_CAP = 5;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BearingTray {
  return raw === "fixed" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<BearingInk, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<BearingInk, "blank">) : "";
}

function glazeName(raw: unknown): Exclude<BearingGlaze, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GLAZES as readonly string[]).includes(text) ? (text as Exclude<BearingGlaze, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function bearingLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function bearingNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank pilot stays blank. It is not filled in. */
export function pilotLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A cipher is exactly two letters. Anything else stays blank. Letters are stored in capitals. */
export function bearingMark(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : "";
}

/**
 * A station is an integer from 1 through 8.
 * A blank value stays unset. 0 and 9 are not stations.
 * A leading zero is the same station: 01 is 1, and 08 is 8. 09 is not a station.
 */
export function stationOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 8) return raw;
  if (typeof raw === "string" && /^(?:[1-8]|0[1-8])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A span is 2, 4, or 8.
 * A blank value stays unset. 0 and 6 are not spans.
 * A leading zero is not a span.
 */
export function spanOf(raw: unknown): number | null {
  if (typeof raw === "number" && (SPANS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:2|4|8)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A cord is 3, 7, or 11. A blank value stays unset. A leading zero is not a cord. */
export function cordOf(raw: unknown): number | null {
  if (typeof raw === "number" && (CORDS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:3|7|11)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Ink, chalk, gilt, or blank. Anything else is blank. */
export function inkOf(raw: unknown): BearingInk {
  return inkName(raw) || "blank";
}

/** Pearl, brass, slate, or blank. Anything else is blank. */
export function glazeOf(raw: unknown): BearingGlaze {
  return glazeName(raw) || "blank";
}

/** Dawn is 1. Day is 2–5. Dusk is 6–8. An unset station is blank. */
export function stationBand(station: unknown): "blank" | "dawn" | "day" | "dusk" {
  const value = stationOf(station);
  if (value === null) return "blank";
  if (value === 1) return "dawn";
  if (value <= 5) return "day";
  return "dusk";
}

/** Peak stations are 3 and 7. An unset station is not a peak. */
export function peakStation(station: unknown): boolean {
  const value = stationOf(station);
  return value !== null && PEAKS.has(value);
}

/** Quiet stations are 1, 4, and 8. 3 and 7 are not quiet. An unset station is not quiet. */
export function quietStation(station: unknown): boolean {
  const value = stationOf(station);
  return value !== null && QUIETS.has(value);
}

/**
 * The shortest signed step from the saved station to the typed station.
 * The ring wraps at 8. A step of 4 stays. A step of -4 stays.
 * A positive step means the typed station is ahead of the bearing.
 */
export function stationGap(station: unknown, desk: unknown): number | null {
  const from = stationOf(station);
  const at = stationOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 4) diff -= 8;
  if (diff < -4) diff += 8;
  return diff;
}

/** EN, FR, and IT are home ciphers. A blank cipher is not. */
export function homeCipher(mark: unknown): boolean {
  return HOME.has(bearingMark(mark));
}

export function readBearings(raw: unknown): Bearing[] {
  if (!Array.isArray(raw)) return [];
  const out: Bearing[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Bearing>;
    const id = String(row.id || "").trim();
    const title = bearingLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: bearingNote(row.note),
      pilot: pilotLabel(row.pilot),
      station: stationOf(row.station),
      ink: inkName(row.ink),
      cipher: bearingMark(row.cipher),
      glaze: glazeName(row.glaze),
      span: spanOf(row.span),
      cord: cordOf(row.cord),
      pinned: row.pinned === true,
      fixed: row.fixed === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, BEARING_CAP);
}

export function addBearing(
  cards: readonly Bearing[],
  card: {
    id: string;
    title: string;
    note?: string;
    pilot?: string;
    station?: unknown;
    ink?: string;
    cipher?: string;
    glaze?: string;
    span?: unknown;
    cord?: unknown;
  },
): Bearing[] {
  const current = readBearings(cards);
  const id = String(card.id || "").trim();
  const title = bearingLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Bearing = {
    id,
    title,
    note: bearingNote(card.note),
    pilot: pilotLabel(card.pilot),
    station: stationOf(card.station),
    ink: inkName(card.ink),
    cipher: bearingMark(card.cipher),
    glaze: glazeName(card.glaze),
    span: spanOf(card.span),
    cord: cordOf(card.cord),
    pinned: false,
    fixed: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, BEARING_CAP);
}

/** Blank becomes pearl. Pearl becomes brass, brass becomes slate, and slate returns to pearl. */
export function cycleGlaze(cards: readonly Bearing[], id: string): Bearing[] {
  return readBearings(cards).map((card) => {
    if (card.id !== id) return card;
    const at = GLAZE_ORDER.indexOf(card.glaze as (typeof GLAZE_ORDER)[number]);
    const next = at < 0 || at >= GLAZES.length ? GLAZES[0] : GLAZES[at % GLAZES.length];
    if (!next || next === card.glaze) return card;
    return { ...card, glaze: next, audit: "glaze" };
  });
}

export function setBearingPin(cards: readonly Bearing[], id: string, pinned: boolean): Bearing[] {
  return readBearings(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setBearingFix(cards: readonly Bearing[], id: string, fixed: boolean): Bearing[] {
  return readBearings(cards).map((card) => (card.id === id ? { ...card, fixed, audit: fixed ? "fix" : "lift" } : card));
}

export function setBearingFile(cards: readonly Bearing[], id: string, filed: boolean): Bearing[] {
  return readBearings(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "restore" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editBearing(cards: readonly Bearing[], id: string, title: string): Bearing[] {
  const current = readBearings(cards);
  const next = bearingLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editBearingNote(cards: readonly Bearing[], id: string, note: string): Bearing[] {
  const current = readBearings(cards);
  const next = bearingNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkBearingPin(cards: readonly Bearing[], ids: readonly string[], pinned: boolean): Bearing[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readBearings(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkBearingFile(cards: readonly Bearing[], ids: readonly string[], filed: boolean): Bearing[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readBearings(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "restore" } : card));
}

/** A blank or unknown ink is left out. A bearing already at that ink is left as it is. */
export function bulkBearingInk(cards: readonly Bearing[], ids: readonly string[], ink: string): Bearing[] {
  const name = inkName(ink);
  const current = readBearings(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.ink !== name ? { ...card, ink: name, audit: "shift" } : card));
}

export function resetBearings(): Bearing[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function bearingCopy(raw: unknown): string {
  return bearingLine(raw);
}

function inTray(card: Bearing, tray: BearingTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "fixed") return card.fixed && !card.filed;
  return !card.fixed && !card.filed;
}

function stationHit(station: number | null, exact: number | null, pick: StationPick | null): boolean {
  if (exact !== null) return station === exact;
  if (pick === null) return true;
  if (pick === "blank") return station === null;
  if (pick === "peak") return peakStation(station);
  if (pick === "quiet") return quietStation(station);
  return stationBand(station) === pick;
}

function glazeScore(glaze: string): number {
  if (glaze === "slate") return 3;
  if (glaze === "brass") return 2;
  if (glaze === "pearl") return 1;
  return 0;
}

function waitingPeak(card: Bearing): boolean {
  return peakStation(card.station) && inTray(card, "open");
}

function haystack(card: Bearing): string {
  return `${card.title}\n${card.note}\n${card.cipher}`.toLowerCase();
}

/** An open bearing is late when the desk station is more than one step ahead. */
export function lateBearing(card: Bearing, desk: unknown): boolean {
  const gap = stationGap(card.station, desk);
  return inTray(card, "open") && gap !== null && gap > 1;
}

/** An open bearing with a cord of 3 is due soon. A fixed or filed bearing is not. */
export function soonBearing(card: Bearing): boolean {
  return inTray(card, "open") && card.cord === 3;
}

/** Search matches the title, the note, and the cipher. The pilot, the station, and the ink are not part of the query. */
export function visibleBearings(
  cards: readonly Bearing[],
  tray: BearingTray,
  query: string,
  pilot: string | null,
  ink: BearingInk | null,
  cipher: string | null,
  glaze: BearingGlaze | null,
  exact: number | null,
  pick: StationPick | null,
  span: number | "blank" | null,
  cord: number | "blank" | null,
  slateOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): Bearing[] {
  const text = query.trim().toLowerCase();
  const wantPilot = pilot === null ? null : pilotLabel(pilot);
  const wantCipher = cipher === null ? null : bearingMark(cipher);
  return readBearings(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (slateOnly && card.glaze !== "slate") return false;
      if (wantPilot !== null && pilotLabel(card.pilot) !== wantPilot) return false;
      if (ink !== null && inkOf(card.ink) !== ink) return false;
      if (wantCipher !== null && bearingMark(card.cipher) !== wantCipher) return false;
      if (glaze !== null && glazeOf(card.glaze) !== glaze) return false;
      if (!stationHit(card.station, exact, pick)) return false;
      if (span === "blank" && card.span !== null) return false;
      if (typeof span === "number" && card.span !== span) return false;
      if (cord === "blank" && card.cord !== null) return false;
      if (typeof cord === "number" && card.cord !== cord) return false;
      if (peakOnly && !waitingPeak(card)) return false;
      if (homeOnly && !homeCipher(card.cipher)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (glazeScore(a.glaze) !== glazeScore(b.glaze)) return glazeScore(b.glaze) - glazeScore(a.glaze);
      return a.title.localeCompare(b.title);
    });
}

/** The station orders the desk. An unset station stays at the end. Search matches the title, the note, and the cipher. */
export function stationTimeline(cards: readonly Bearing[], query: string): Bearing[] {
  const text = query.trim().toLowerCase();
  return readBearings(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.station === null && b.station !== null) return 1;
      if (a.station !== null && b.station === null) return -1;
      if (a.station !== null && b.station !== null && a.station !== b.station) return a.station - b.station;
      return a.title.localeCompare(b.title);
    });
}

export function bearingCounts(cards: readonly Bearing[], desk: unknown): BearingCounts {
  const rows = readBearings(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    fixed: rows.filter((card) => inTray(card, "fixed")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => waitingPeak(card)).length,
    late: rows.filter((card) => lateBearing(card, desk)).length,
    soon: rows.filter((card) => soonBearing(card)).length,
    home: rows.filter((card) => homeCipher(card.cipher)).length,
  };
}

/** How many distinct stations the saved bearings already use. An unset station is not counted. */
export function usedStations(cards: readonly Bearing[]): number {
  const seen = new Set<number>();
  for (const card of readBearings(cards)) if (card.station !== null) seen.add(card.station);
  return seen.size;
}

/** Share of the saved bearings. A zero total stays at zero. */
export function bearingShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function bearingPilots(cards: readonly Bearing[]): string[] {
  const out: string[] = [];
  for (const card of readBearings(cards)) {
    if (card.pilot && !out.includes(card.pilot)) out.push(card.pilot);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function bearingCiphers(cards: readonly Bearing[]): string[] {
  const out: string[] = [];
  for (const card of readBearings(cards)) {
    if (card.cipher && !out.includes(card.cipher)) out.push(card.cipher);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function bearingInks(cards: readonly Bearing[]): Exclude<BearingInk, "blank">[] {
  const seen = new Set<string>();
  for (const card of readBearings(cards)) if (card.ink) seen.add(card.ink);
  return INKS.filter((ink) => seen.has(ink));
}

export function bearingGlazes(cards: readonly Bearing[]): Exclude<BearingGlaze, "blank">[] {
  const seen = new Set<string>();
  for (const card of readBearings(cards)) if (card.glaze) seen.add(card.glaze);
  return GLAZES.filter((glaze) => seen.has(glaze));
}

/** Open bearings already assigned to this pilot. A blank pilot is not a load. */
export function pilotLoad(cards: readonly Bearing[], pilot: string): number {
  const name = pilotLabel(pilot);
  if (!name) return 0;
  return readBearings(cards).filter((card) => card.pilot === name && inTray(card, "open")).length;
}

/** Three inks. Index 0 is ink. Index 2 is gilt. */
export function inkCounts(cards: readonly Bearing[]): number[] {
  const rows = readBearings(cards);
  return INKS.map((ink) => rows.filter((card) => inkOf(card.ink) === ink).length);
}

/** "all" and "blank" stay. A pilot that is no longer on a bearing falls back to all. */
export function activePilot(filter: string, pilots: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pilot = pilotLabel(filter);
  return pilot && pilots.includes(pilot) ? pilot : "all";
}

export function pilotArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return pilotLabel(filter) || null;
}

/** "all" and "blank" stay. An ink that is no longer on a bearing falls back to all. */
export function activeInk(filter: string, inks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ink = inkName(filter);
  return ink && inks.includes(ink) ? ink : "all";
}

export function inkArg(filter: string): BearingInk | null {
  if (filter === "blank") return "blank";
  return inkName(filter) || null;
}

/** "all" and "blank" stay. A cipher that is no longer on a bearing falls back to all. */
export function activeCipher(filter: string, ciphers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cipher = bearingMark(filter);
  return cipher && ciphers.includes(cipher) ? cipher : "all";
}

export function cipherArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return bearingMark(filter) || null;
}

/** "all" and "blank" stay. A glaze that is no longer on a bearing falls back to all. */
export function activeGlaze(filter: string, glazes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const glaze = glazeName(filter);
  return glaze && glazes.includes(glaze) ? glaze : "all";
}

export function glazeArg(filter: string): BearingGlaze | null {
  if (filter === "blank") return "blank";
  return glazeName(filter) || null;
}

/** All, blank, the bands, peak, quiet, and the stations 1 through 8 stay. Anything else is all. */
export function activeStation(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const station = stationOf(filter);
  return station === null ? "all" : String(station);
}

export function stationArg(filter: string): { exact: number | null; pick: StationPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as StationPick };
  const station = stationOf(filter);
  return station === null ? { exact: null, pick: null } : { exact: station, pick: null };
}

/** All, blank, and the spans 2, 4, and 8 stay. Anything else is all. */
export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const span = spanOf(filter);
  return span === null ? "all" : String(span);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

/** All, blank, and the cords 3, 7, and 11 stay. Anything else is all. */
export function activeCord(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const cord = cordOf(filter);
  return cord === null ? "all" : String(cord);
}

export function cordArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return cordOf(filter);
}

/** Other bearings with the same ink and the same station. A blank ink or a blank station clashes with nothing. */
export function stationClashIds(cards: readonly Bearing[], id: string): string[] {
  const rows = readBearings(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.ink || card.station === null) return [];
  return rows
    .filter((item) => item.id !== id && item.ink === card.ink && item.station === card.station)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved bearings share an ink and a station with another bearing. */
export function clashStationCount(cards: readonly Bearing[]): number {
  const rows = readBearings(cards);
  return rows.filter((card) => stationClashIds(rows, card.id).length > 0).length;
}

/** Other bearings with the same ink and the same span. A blank ink or a blank span clashes with nothing. */
export function spanClashIds(cards: readonly Bearing[], id: string): string[] {
  const rows = readBearings(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.ink || card.span === null) return [];
  return rows
    .filter((item) => item.id !== id && item.ink === card.ink && item.span === card.span)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved bearings share an ink and a span with another bearing. */
export function spanClashCount(cards: readonly Bearing[]): number {
  const rows = readBearings(cards);
  return rows.filter((card) => spanClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open bearing at or after the station you type, skipping slate.
 * After 8, the ring wraps to the earliest open bearing that is not slate.
 */
export function nextBearing(cards: readonly Bearing[], desk: unknown): string {
  const now = stationOf(desk);
  if (now === null) return "";
  const waiting = readBearings(cards).filter((card) => inTray(card, "open") && card.station !== null && card.glaze !== "slate");
  if (!waiting.length) return "";
  const byStation = (a: Bearing, b: Bearing) => (a.station ?? 0) - (b.station ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.station ?? 0) >= now).sort(byStation);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byStation)[0].id;
}

/**
 * The ink with the fewest open bearings.
 * A tie keeps the earlier ink: ink, then chalk, then gilt.
 * Bearings with no ink are not a load. An empty desk still suggests ink.
 */
export function suggestInk(cards: readonly Bearing[]): Exclude<BearingInk, "blank"> {
  const rows = readBearings(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<BearingInk, "blank"> = "ink";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const ink of INKS) {
    const count = rows.filter((card) => card.ink === ink).length;
    if (count < bestCount) {
      best = ink;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The pilot with the fewest open bearings.
 * A tie keeps the earlier name. A blank pilot is not a candidate.
 * A desk with no named pilot suggests nothing.
 */
export function suggestPilot(cards: readonly Bearing[]): string {
  const rows = readBearings(cards).filter((card) => inTray(card, "open") && card.pilot);
  const pilots: string[] = [];
  for (const card of rows) {
    if (!pilots.includes(card.pilot)) pilots.push(card.pilot);
  }
  pilots.sort((a, b) => a.localeCompare(b));
  if (!pilots.length) return "";
  let best = pilots[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const pilot of pilots) {
    const count = rows.filter((card) => card.pilot === pilot).length;
    if (count < bestCount) {
      best = pilot;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The cord with the fewest open bearings.
 * A tie keeps 7, then 3, then 11, so a cord of 3 is not the first choice.
 * An empty desk still suggests 7.
 */
export function suggestCord(cards: readonly Bearing[]): (typeof CORDS)[number] {
  const rows = readBearings(cards).filter((card) => inTray(card, "open"));
  const order = [7, 3, 11] as const;
  let best: (typeof CORDS)[number] = 7;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cord of order) {
    const count = rows.filter((card) => card.cord === cord).length;
    if (count < bestCount) {
      best = cord;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the bearings saved in this browser. The gap and the late mark use the station you pass. */
export function bearingsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,pilot,station,ink,cipher,glaze,span,cord,band,pinned,fixed,filed,gap,late,soon,home,note,audit"];
  for (const card of readBearings(raw)) {
    const gap = stationGap(card.station, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.pilot),
      card.station === null ? "" : String(card.station),
      card.ink,
      csvCell(card.cipher),
      card.glaze,
      card.span === null ? "" : String(card.span),
      card.cord === null ? "" : String(card.cord),
      stationBand(card.station),
      card.pinned ? "1" : "0",
      card.fixed ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBearing(card, desk) ? "1" : "0",
      soonBearing(card) ? "1" : "0",
      homeCipher(card.cipher) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function pilotSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return pilotLabel(raw) || "all";
}

function inkSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return inkName(raw) || "all";
}

function cipherSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return bearingMark(raw) || "all";
}

function glazeSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return glazeName(raw) || "all";
}

export function readBearingViews(raw: unknown): BearingView[] {
  if (!Array.isArray(raw)) return [];
  const out: BearingView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BearingView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      pilot: pilotSlot(row.pilot),
      ink: inkSlot(row.ink),
      cipher: cipherSlot(row.cipher),
      glaze: glazeSlot(row.glaze),
      station: activeStation(String(row.station || "all")),
      span: activeSpan(String(row.span || "all")),
      cord: activeCord(String(row.cord || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBearingView(views: readonly BearingView[], view: BearingView): BearingView[] {
  const current = readBearingViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    pilot: pilotSlot(view.pilot),
    ink: inkSlot(view.ink),
    cipher: cipherSlot(view.cipher),
    glaze: glazeSlot(view.glaze),
    station: activeStation(view.station),
    span: activeSpan(view.span),
    cord: activeCord(view.cord),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropBearingView(views: readonly BearingView[], id: string): BearingView[] {
  return readBearingViews(views).filter((view) => view.id !== id);
}

function sealText(raw: unknown): string {
  return clip(raw, 48);
}

function sealBody(value: SealValue): { text: string; explicit: boolean } | null {
  if (typeof value === "number") return { text: "", explicit: false };
  if (typeof value === "string") return { text: sealText(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: "", explicit: false };
  if (SEAL_BLOCK.some((key) => key in value)) return null;
  if (!("email" in value)) return { text: "", explicit: false };
  const inner = value.email;
  if (inner === null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: "", explicit: false };
  return { text: sealText(inner), explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set email is text. A clear email is an explicit blank. A missing field stays unmarked.
 * A name, a phone, a desk id, and the other blocked fields are not an email.
 */
export function sealState(value: SealValue): SealState {
  const body = sealBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/** The clipped email. A clear or unmarked value stays blank. */
export function sealCopy(value: SealValue): string {
  const body = sealBody(value);
  return body?.text || "";
}

function localPart(text: string): string {
  const at = text.indexOf("@");
  const local = (at < 0 ? text : text.slice(0, at)).trim();
  return local || text;
}

/**
 * Pip is a local part of 1 character. Slip is 2–5. Card is 6–12. Thirteen and above is a roll.
 * A blank email has no band. The part before @ is the local part.
 */
export function sealBand(value: SealValue): SealBand {
  const text = sealCopy(value);
  if (!text) return "";
  const length = localPart(text).length;
  if (length <= 1) return "pip";
  if (length <= 5) return "slip";
  if (length <= 12) return "card";
  return "roll";
}

/**
 * Figure is any digit. Rail is a plus or an underscore and no digit. Seam is a hyphen and neither.
 * Stack is three words or more. Pair is two words. One word is plain.
 * A blank email has no depth.
 */
export function sealDepth(value: SealValue): SealDepth {
  const text = sealCopy(value);
  if (!text) return "";
  if (/\d/.test(text)) return "figure";
  if (text.includes("_") || text.includes("+")) return "rail";
  if (text.includes("-")) return "seam";
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 3) return "stack";
  if (words === 2) return "pair";
  return "plain";
}

/** How many words the email text carries. A blank email stays at zero. */
export function sealWords(value: SealValue): number {
  const text = sealCopy(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** An email that contains + is a plus alias. Other marks are not. */
export function plusSeal(value: SealValue): boolean {
  return sealCopy(value).includes("+");
}

/** A set email with an odd letter count. An even count is not odd. Digits do not count. */
export function oddSeal(value: SealValue): boolean {
  const letters = sealCopy(value).replace(/[^A-Za-z]/g, "");
  return Boolean(letters) && letters.length % 2 === 1;
}

export function sealBands(rows: readonly SealRow[]): SealBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = sealState(row.note);
    if (state === "") continue;
    const band = state === "set" ? sealBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: SealBandLine[] = [];
  for (const band of ["", ...SEAL_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function sealDepths(rows: readonly SealRow[]): SealDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = sealDepth(row.note);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: SealDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps pip, then slip, card, and roll. An unmarked field is not a lead. */
export function leadingSeal(rows: readonly SealRow[]): string {
  const named = sealBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const tie = ["pip", "slip", "card", "roll"];
  const order = (band: string) => tie.indexOf(band);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps plain, then pair, stack, seam, rail, and figure. A blank email is not a lead. */
export function leadingSealDepth(rows: readonly SealRow[]): string {
  const named = sealDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** How many set emails have an odd letter count. */
export function oddSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealState(row.note) === "set" && oddSeal(row.note)).length;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function sealShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((SEAL_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentSeals(rows: readonly SealRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = sealState(row.note);
    const token = state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenSeals(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandToken(item);
    if (!band || !known.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleSeal(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandToken(band);
  if (!token || !present.includes(token)) return readHiddenSeals(hidden, present);
  const current = readHiddenSeals(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleSealBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSeals(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeSeal(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SEAL_BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function sealArg(filter: string): SealBand | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (SEAL_BANDS as readonly string[]).includes(filter) ? (filter as SealBand) : null;
}

/** "all" and "blank" stay. A depth that is no longer loaded falls back to all. */
export function activeSealDepth(filter: string, depths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (DEPTHS as readonly string[]).includes(filter) && depths.includes(filter) ? filter : "all";
}

export function sealDepthArg(filter: string): SealDepth | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (DEPTHS as readonly string[]).includes(filter) ? (filter as SealDepth) : null;
}

function rowId(row: SealRow): string {
  return String(row.id || "").trim();
}

export function readReviewedSeals(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present.map((id) => String(id || "").trim()).filter(Boolean));
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (!id || !known.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out.slice(0, 32);
}

export function toggleSealReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedSeals(reviewed, present);
  const current = readReviewedSeals(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkSealReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedSeals(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the depth, and the email are not part of the query. */
export function visibleSealCustomers<T extends SealRow>(
  rows: readonly T[],
  band: SealBand | "blank" | null,
  depth: SealDepth | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: SealShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = sealState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && sealBand(row.note) !== band) return false;
    if (depth !== null && sealDepth(row.note) !== depth) return false;
    if (shape === "plus" && !plusSeal(row.note)) return false;
    if (shape === "odd" && (state !== "set" || !oddSeal(row.note))) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function sealsCsv(rows: readonly SealRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = sealState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of sealBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of sealDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  lines.push(["shape", "odd", String(oddSealCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function sealRowsCsv(rows: readonly SealRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,depth,words,plus,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(sealBand(row.note)),
      csvCell(sealDepth(row.note)),
      String(sealWords(row.note)),
      plusSeal(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}

export const BEARING_INKS = INKS;
export const SEAL_BAND_NAMES = ["pip", "slip", "card", "roll"] as const;
