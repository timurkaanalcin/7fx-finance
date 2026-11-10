/**
 * Night chimes for the overnight desk, and the referral code already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_night_chime (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   setter text not null default '',
 *   bay integer,
 *   dye text not null default '',
 *   mark text not null default '',
 *   foil text not null default '',
 *   weight integer,
 *   reach integer,
 *   pinned boolean not null default false,
 *   muted boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_referral_token_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_referral_token_review (
 *   customer_id text primary key
 * );
 */

export const CHIME_KEY = "crmv4-night-chimes";
export const CHIME_VIEW_KEY = "crmv4-night-chime-views";
export const TOKEN_KEY = "crmv4-referral-token-hide";
export const TOKEN_REVIEW_KEY = "crmv4-referral-token-review";

export type ChimeGlaze = "blank" | "mist" | "brass" | "coal";

export type ChimeBell = "blank" | "pearl" | "copper" | "ink";

export type ChimeTray = "open" | "muted" | "filed";

export type WatchPick = "blank" | "dawn" | "day" | "dusk" | "peak" | "quiet";

export type Chime = {
  id: string;
  title: string;
  note: string;
  setter: string;
  bay: number | null;
  dye: string;
  mark: string;
  foil: string;
  weight: number | null;
  reach: number | null;
  pinned: boolean;
  muted: boolean;
  filed: boolean;
  audit: string;
};

export type ChimeView = {
  id: string;
  name: string;
  tray: ChimeTray;
  query: string;
  setter: string;
  dye: string;
  mark: string;
  foil: string;
  bay: string;
  weight: string;
  reach: string;
};

export type ChimeCounts = {
  open: number;
  muted: number;
  filed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type TokenState = "" | "set" | "clear";

export type TokenBand = "" | "chip" | "tag" | "plaque" | "banner";

export type TokenDepth = "" | "bare" | "pair" | "pile" | "dash" | "tick" | "numeral";

export type TokenShape = "all" | "dot" | "odd" | "plus";

export type TokenValue =
  | {
      affiliateC?: unknown;
      city?: unknown;
      failedLoginCount?: unknown;
      loginBlockedAt?: unknown;
      loginBlockedMessage?: unknown;
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
      withdrawalsEnabled?: unknown;
      isTest?: unknown;
      name?: unknown;
      email?: unknown;
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
      affiliateA?: unknown;
      affiliateB?: unknown;
      campaign?: unknown;
      referralCodeUsed?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type TokenRow = { id?: string; note?: TokenValue; label?: string | null };

export type TokenBandLine = { band: string; count: number };

export type TokenDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "foil", "pin", "unpin", "hold", "lift", "box", "unbox", "dye"] as const;

const GLAZES = ["mist", "brass", "coal"] as const;

const BELLS = ["pearl", "copper", "ink"] as const;

const BELL_ORDER = ["", "pearl", "copper", "ink"] as const;

const PICKS = ["blank", "dawn", "day", "dusk", "peak", "quiet"] as const;

const PEAKS = new Set([3, 7]);

const QUIETS = new Set([2, 4, 8]);

const WEIGHTS = [2, 4, 8] as const;

const REACHES = [3, 9, 15] as const;

const HOME = new Set(["GB", "AE", "US"]);

const TOKEN_BANDS = ["chip", "tag", "plaque", "banner"] as const;

const DEPTHS = ["bare", "pair", "pile", "dash", "tick", "numeral"] as const;

const STATES = ["set", "clear"] as const;

const TOKEN_BLOCK = [
  "city",
  "failedLoginCount",
  "loginBlockedAt",
  "loginBlockedMessage",
  "loginEnabled",
  "tradingEnabled",
  "withdrawalsEnabled",
  "isTest",
  "name",
  "email",
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
  "affiliateA",
  "affiliateB",
  "affiliateC",
  "campaign",
] as const;

const CHIME_CAP = 8;

const VIEW_CAP = 5;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ChimeTray {
  return raw === "muted" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glazeName(raw: unknown): Exclude<ChimeGlaze, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GLAZES as readonly string[]).includes(text) ? (text as Exclude<ChimeGlaze, "blank">) : "";
}

function bellName(raw: unknown): Exclude<ChimeBell, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (BELLS as readonly string[]).includes(text) ? (text as Exclude<ChimeBell, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function chimeLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function chimeNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank setter stays blank. It is not filled in. */
export function ringerLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A mark is exactly two letters. Anything else stays blank. Letters are stored in capitals. */
export function chimeMark(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : "";
}

/**
 * A watch is an integer from 1 through 8.
 * A blank value stays unset. 0 and 9 are not watches.
 * A leading zero is the same watch: 01 is 1, and 08 is 8. 09 is not a watch.
 */
export function watchOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 8) return raw;
  if (typeof raw === "string" && /^(?:[1-8]|0[1-8])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A weight is 2, 4, or 8.
 * A blank value stays unset. 0 and 1 are not weights.
 * A leading zero is not a weight.
 */
export function weightOf(raw: unknown): number | null {
  if (typeof raw === "number" && (WEIGHTS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:2|4|8)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A reach is 3, 9, or 15. A blank value stays unset. A leading zero is not a reach. */
export function reachOf(raw: unknown): number | null {
  if (typeof raw === "number" && (REACHES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:3|9|15)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Soot, ochre, ivory, or blank. Anything else is blank. */
export function glazeOf(raw: unknown): ChimeGlaze {
  return glazeName(raw) || "blank";
}

/** Gilt, nickel, umber, or blank. Anything else is blank. */
export function bellOf(raw: unknown): ChimeBell {
  return bellName(raw) || "blank";
}

/** Dawn is 1–2. Day is 3–5. Dusk is 6–8. An unset watch is blank. */
export function watchBand(bay: unknown): "blank" | "dawn" | "day" | "dusk" {
  const value = watchOf(bay);
  if (value === null) return "blank";
  if (value <= 2) return "dawn";
  if (value <= 5) return "day";
  return "dusk";
}

/** Peak watches are 3 and 7. An unset watch is not a peak. */
export function peakWatch(bay: unknown): boolean {
  const value = watchOf(bay);
  return value !== null && PEAKS.has(value);
}

/** Quiet watches are 2, 4, and 8. 3 and 7 are not quiet. An unset watch is not quiet. */
export function quietWatch(bay: unknown): boolean {
  const value = watchOf(bay);
  return value !== null && QUIETS.has(value);
}

/**
 * The shortest signed step from the saved bay to the typed bay.
 * The ring wraps at 8. A step of 4 stays. A step of -4 stays.
 * A positive step means the typed watch is ahead of the chime.
 */
export function watchGap(bay: unknown, desk: unknown): number | null {
  const from = watchOf(bay);
  const at = watchOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 4) diff -= 8;
  if (diff < -4) diff += 8;
  return diff;
}

/** GB, AE, and US are home marks. A blank mark is not. */
export function homeMark(mark: unknown): boolean {
  return HOME.has(chimeMark(mark));
}

export function readChimes(raw: unknown): Chime[] {
  if (!Array.isArray(raw)) return [];
  const out: Chime[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Chime>;
    const id = String(row.id || "").trim();
    const title = chimeLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: chimeNote(row.note),
      setter: ringerLabel(row.setter),
      bay: watchOf(row.bay),
      dye: glazeName(row.dye),
      mark: chimeMark(row.mark),
      foil: bellName(row.foil),
      weight: weightOf(row.weight),
      reach: reachOf(row.reach),
      pinned: row.pinned === true,
      muted: row.muted === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CHIME_CAP);
}

export function addChime(
  cards: readonly Chime[],
  card: {
    id: string;
    title: string;
    note?: string;
    setter?: string;
    bay?: unknown;
    dye?: string;
    mark?: string;
    foil?: string;
    weight?: unknown;
    reach?: unknown;
  },
): Chime[] {
  const current = readChimes(cards);
  const id = String(card.id || "").trim();
  const title = chimeLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Chime = {
    id,
    title,
    note: chimeNote(card.note),
    setter: ringerLabel(card.setter),
    bay: watchOf(card.bay),
    dye: glazeName(card.dye),
    mark: chimeMark(card.mark),
    foil: bellName(card.foil),
    weight: weightOf(card.weight),
    reach: reachOf(card.reach),
    pinned: false,
    muted: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CHIME_CAP);
}

/** Blank becomes gilt. Gilt becomes nickel, nickel becomes umber, and umber returns to gilt. */
export function cycleBell(cards: readonly Chime[], id: string): Chime[] {
  return readChimes(cards).map((card) => {
    if (card.id !== id) return card;
    const at = BELL_ORDER.indexOf(card.foil as (typeof BELL_ORDER)[number]);
    const next = at < 0 || at >= BELLS.length ? BELLS[0] : BELLS[at % BELLS.length];
    if (!next || next === card.foil) return card;
    return { ...card, foil: next, audit: "foil" };
  });
}

export function setChimePin(cards: readonly Chime[], id: string, pinned: boolean): Chime[] {
  return readChimes(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setChimeMute(cards: readonly Chime[], id: string, muted: boolean): Chime[] {
  return readChimes(cards).map((card) => (card.id === id ? { ...card, muted, audit: muted ? "hold" : "lift" } : card));
}

export function setChimeFile(cards: readonly Chime[], id: string, filed: boolean): Chime[] {
  return readChimes(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "box" : "unbox" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editChime(cards: readonly Chime[], id: string, title: string): Chime[] {
  const current = readChimes(cards);
  const next = chimeLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editChimeNote(cards: readonly Chime[], id: string, note: string): Chime[] {
  const current = readChimes(cards);
  const next = chimeNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkChimePin(cards: readonly Chime[], ids: readonly string[], pinned: boolean): Chime[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readChimes(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkChimeFile(cards: readonly Chime[], ids: readonly string[], filed: boolean): Chime[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readChimes(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "box" : "unbox" } : card));
}

/** A blank or unknown dye is left out. A slip already at that dye is left as it is. */
export function bulkChimeGlaze(cards: readonly Chime[], ids: readonly string[], dye: string): Chime[] {
  const name = glazeName(dye);
  const current = readChimes(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.dye !== name ? { ...card, dye: name, audit: "dye" } : card));
}

export function resetChimes(): Chime[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function chimeCopy(raw: unknown): string {
  return chimeLine(raw);
}

function inTray(card: Chime, tray: ChimeTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "muted") return card.muted && !card.filed;
  return !card.muted && !card.filed;
}

function watchHit(bay: number | null, exact: number | null, pick: WatchPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakWatch(bay);
  if (pick === "quiet") return quietWatch(bay);
  return watchBand(bay) === pick;
}

function bellScore(foil: string): number {
  if (foil === "ink") return 3;
  if (foil === "copper") return 2;
  if (foil === "pearl") return 1;
  return 0;
}

function waitingPeak(card: Chime): boolean {
  return peakWatch(card.bay) && inTray(card, "open");
}

function haystack(card: Chime): string {
  return `${card.title}\n${card.note}\n${card.mark}`.toLowerCase();
}

/** An open chime is late when the desk watch is more than one step ahead. */
export function lateChime(card: Chime, desk: unknown): boolean {
  const gap = watchGap(card.bay, desk);
  return inTray(card, "open") && gap !== null && gap > 1;
}

/** An open chime with a reach of 3 is due soon. A muted or filed chime is not. */
export function soonChime(card: Chime): boolean {
  return inTray(card, "open") && card.reach === 3;
}

/** Search matches the title, the note, and the mark. The setter, the bay, and the dye are not part of the query. */
export function visibleChimes(
  cards: readonly Chime[],
  tray: ChimeTray,
  query: string,
  setter: string | null,
  dye: ChimeGlaze | null,
  mark: string | null,
  foil: ChimeBell | null,
  exact: number | null,
  pick: WatchPick | null,
  weight: number | "blank" | null,
  reach: number | "blank" | null,
  inkOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): Chime[] {
  const text = query.trim().toLowerCase();
  const wantSetter = setter === null ? null : ringerLabel(setter);
  const wantMark = mark === null ? null : chimeMark(mark);
  return readChimes(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (inkOnly && card.foil !== "ink") return false;
      if (wantSetter !== null && ringerLabel(card.setter) !== wantSetter) return false;
      if (dye !== null && glazeOf(card.dye) !== dye) return false;
      if (wantMark !== null && chimeMark(card.mark) !== wantMark) return false;
      if (foil !== null && bellOf(card.foil) !== foil) return false;
      if (!watchHit(card.bay, exact, pick)) return false;
      if (weight === "blank" && card.weight !== null) return false;
      if (typeof weight === "number" && card.weight !== weight) return false;
      if (reach === "blank" && card.reach !== null) return false;
      if (typeof reach === "number" && card.reach !== reach) return false;
      if (peakOnly && !waitingPeak(card)) return false;
      if (homeOnly && !homeMark(card.mark)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (bellScore(a.foil) !== bellScore(b.foil)) return bellScore(b.foil) - bellScore(a.foil);
      return a.title.localeCompare(b.title);
    });
}

/** The bay orders the desk. An unset bay stays at the end. Search matches the title, the note, and the mark. */
export function watchTimeline(cards: readonly Chime[], query: string): Chime[] {
  const text = query.trim().toLowerCase();
  return readChimes(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.bay === null && b.bay !== null) return 1;
      if (a.bay !== null && b.bay === null) return -1;
      if (a.bay !== null && b.bay !== null && a.bay !== b.bay) return a.bay - b.bay;
      return a.title.localeCompare(b.title);
    });
}

export function chimeCounts(cards: readonly Chime[], desk: unknown): ChimeCounts {
  const rows = readChimes(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    muted: rows.filter((card) => inTray(card, "muted")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => waitingPeak(card)).length,
    late: rows.filter((card) => lateChime(card, desk)).length,
    soon: rows.filter((card) => soonChime(card)).length,
    home: rows.filter((card) => homeMark(card.mark)).length,
  };
}

/** How many distinct bays the saved slips already use. An unset bay is not counted. */
export function usedWatches(cards: readonly Chime[]): number {
  const seen = new Set<number>();
  for (const card of readChimes(cards)) if (card.bay !== null) seen.add(card.bay);
  return seen.size;
}

/** Share of the saved slips. A zero total stays at zero. */
export function chimeShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function chimeRingers(cards: readonly Chime[]): string[] {
  const out: string[] = [];
  for (const card of readChimes(cards)) {
    if (card.setter && !out.includes(card.setter)) out.push(card.setter);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function chimeMarks(cards: readonly Chime[]): string[] {
  const out: string[] = [];
  for (const card of readChimes(cards)) {
    if (card.mark && !out.includes(card.mark)) out.push(card.mark);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function chimeGlazes(cards: readonly Chime[]): Exclude<ChimeGlaze, "blank">[] {
  const seen = new Set<string>();
  for (const card of readChimes(cards)) if (card.dye) seen.add(card.dye);
  return GLAZES.filter((dye) => seen.has(dye));
}

export function chimeBells(cards: readonly Chime[]): Exclude<ChimeBell, "blank">[] {
  const seen = new Set<string>();
  for (const card of readChimes(cards)) if (card.foil) seen.add(card.foil);
  return BELLS.filter((foil) => seen.has(foil));
}

/** Open slips already assigned to this setter. A blank setter is not a load. */
export function ringerLoad(cards: readonly Chime[], setter: string): number {
  const name = ringerLabel(setter);
  if (!name) return 0;
  return readChimes(cards).filter((card) => card.setter === name && inTray(card, "open")).length;
}

/** Three dyes. Index 0 is mist. Index 2 is coal. */
export function glazeCounts(cards: readonly Chime[]): number[] {
  const rows = readChimes(cards);
  return GLAZES.map((dye) => rows.filter((card) => glazeOf(card.dye) === dye).length);
}

/** "all" and "blank" stay. A setter that is no longer on a slip falls back to all. */
export function activeRinger(filter: string, setters: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const setter = ringerLabel(filter);
  return setter && setters.includes(setter) ? setter : "all";
}

export function ringerArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return ringerLabel(filter) || null;
}

/** "all" and "blank" stay. A dye that is no longer on a slip falls back to all. */
export function activeGlaze(filter: string, dyes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const dye = glazeName(filter);
  return dye && dyes.includes(dye) ? dye : "all";
}

export function glazeArg(filter: string): ChimeGlaze | null {
  if (filter === "blank") return "blank";
  return glazeName(filter) || null;
}

/** "all" and "blank" stay. A mark that is no longer on a slip falls back to all. */
export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = chimeMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return chimeMark(filter) || null;
}

/** "all" and "blank" stay. A foil that is no longer on a slip falls back to all. */
export function activeBell(filter: string, foils: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const foil = bellName(filter);
  return foil && foils.includes(foil) ? foil : "all";
}

export function bellArg(filter: string): ChimeBell | null {
  if (filter === "blank") return "blank";
  return bellName(filter) || null;
}

/** All, blank, the bands, peak, quiet, and the watches 1 through 8 stay. Anything else is all. */
export function activeWatch(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const bay = watchOf(filter);
  return bay === null ? "all" : String(bay);
}

export function watchArg(filter: string): { exact: number | null; pick: WatchPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as WatchPick };
  const bay = watchOf(filter);
  return bay === null ? { exact: null, pick: null } : { exact: bay, pick: null };
}

/** All, blank, and the weights 2, 4, and 8 stay. Anything else is all. */
export function activeWeight(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const weight = weightOf(filter);
  return weight === null ? "all" : String(weight);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

/** All, blank, and the reaches 3, 9, and 15 stay. Anything else is all. */
export function activeReach(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const reach = reachOf(filter);
  return reach === null ? "all" : String(reach);
}

export function reachArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return reachOf(filter);
}

/** Other slips with the same dye and the same bay. A blank dye or a blank bay clashes with nothing. */
export function watchClashIds(cards: readonly Chime[], id: string): string[] {
  const rows = readChimes(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.dye || card.bay === null) return [];
  return rows
    .filter((item) => item.id !== id && item.dye === card.dye && item.bay === card.bay)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved slips share a dye and a bay with another slip. */
export function clashWatchCount(cards: readonly Chime[]): number {
  const rows = readChimes(cards);
  return rows.filter((card) => watchClashIds(rows, card.id).length > 0).length;
}

/** Other slips with the same dye and the same weight. A blank dye or a blank weight clashes with nothing. */
export function weightClashIds(cards: readonly Chime[], id: string): string[] {
  const rows = readChimes(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.dye || card.weight === null) return [];
  return rows
    .filter((item) => item.id !== id && item.dye === card.dye && item.weight === card.weight)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved slips share a dye and a weight with another slip. */
export function weightClashCount(cards: readonly Chime[]): number {
  const rows = readChimes(cards);
  return rows.filter((card) => weightClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open chime at or after the watch you type, skipping ink.
 * After 8, the ring wraps to the earliest open chime that is not ink.
 */
export function nextChime(cards: readonly Chime[], desk: unknown): string {
  const now = watchOf(desk);
  if (now === null) return "";
  const waiting = readChimes(cards).filter((card) => inTray(card, "open") && card.bay !== null && card.foil !== "ink");
  if (!waiting.length) return "";
  const byBay = (a: Chime, b: Chime) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.bay ?? 0) >= now).sort(byBay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBay)[0].id;
}

/**
 * The dye with the fewest open slips.
 * A tie keeps the earlier dye: soot, then ochre, then ivory.
 * Slips with no dye are not a load. An empty desk still suggests mist.
 */
export function suggestGlaze(cards: readonly Chime[]): Exclude<ChimeGlaze, "blank"> {
  const rows = readChimes(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<ChimeGlaze, "blank"> = "mist";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const dye of GLAZES) {
    const count = rows.filter((card) => card.dye === dye).length;
    if (count < bestCount) {
      best = dye;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The setter with the fewest open slips.
 * A tie keeps the earlier name. A blank setter is not a candidate.
 * A desk with no named setter suggests nothing.
 */
export function suggestRinger(cards: readonly Chime[]): string {
  const rows = readChimes(cards).filter((card) => inTray(card, "open") && card.setter);
  const setters: string[] = [];
  for (const card of rows) {
    if (!setters.includes(card.setter)) setters.push(card.setter);
  }
  setters.sort((a, b) => a.localeCompare(b));
  if (!setters.length) return "";
  let best = setters[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const setter of setters) {
    const count = rows.filter((card) => card.setter === setter).length;
    if (count < bestCount) {
      best = setter;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The reach with the fewest open slips.
 * A tie keeps 9, then 3, then 15, so a reach of 3 is not the first choice.
 * An empty desk still suggests 9.
 */
export function suggestReach(cards: readonly Chime[]): (typeof REACHES)[number] {
  const rows = readChimes(cards).filter((card) => inTray(card, "open"));
  const order = [9, 3, 15] as const;
  let best: (typeof REACHES)[number] = 9;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const reach of order) {
    const count = rows.filter((card) => card.reach === reach).length;
    if (count < bestCount) {
      best = reach;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap and the late mark use the bay you pass. */
export function chimesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,setter,bay,dye,mark,foil,weight,reach,band,pinned,muted,filed,gap,late,soon,home,note,audit"];
  for (const card of readChimes(raw)) {
    const gap = watchGap(card.bay, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.setter),
      card.bay === null ? "" : String(card.bay),
      card.dye,
      csvCell(card.mark),
      card.foil,
      card.weight === null ? "" : String(card.weight),
      card.reach === null ? "" : String(card.reach),
      watchBand(card.bay),
      card.pinned ? "1" : "0",
      card.muted ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateChime(card, desk) ? "1" : "0",
      soonChime(card) ? "1" : "0",
      homeMark(card.mark) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function ringerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ringerLabel(raw) || "all";
}

function glazeSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return glazeName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return chimeMark(raw) || "all";
}

function bellSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return bellName(raw) || "all";
}

export function readChimeViews(raw: unknown): ChimeView[] {
  if (!Array.isArray(raw)) return [];
  const out: ChimeView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ChimeView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      setter: ringerSlot(row.setter),
      dye: glazeSlot(row.dye),
      mark: markSlot(row.mark),
      foil: bellSlot(row.foil),
      bay: activeWatch(String(row.bay || "all")),
      weight: activeWeight(String(row.weight || "all")),
      reach: activeReach(String(row.reach || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addChimeView(views: readonly ChimeView[], view: ChimeView): ChimeView[] {
  const current = readChimeViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    setter: ringerSlot(view.setter),
    dye: glazeSlot(view.dye),
    mark: markSlot(view.mark),
    foil: bellSlot(view.foil),
    bay: activeWatch(view.bay),
    weight: activeWeight(view.weight),
    reach: activeReach(view.reach),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropChimeView(views: readonly ChimeView[], id: string): ChimeView[] {
  return readChimeViews(views).filter((view) => view.id !== id);
}

function tokenText(raw: unknown): string {
  return clip(raw, 48);
}

function tokenBody(value: TokenValue): { text: string; explicit: boolean } | null {
  if (typeof value === "number") return { text: "", explicit: false };
  if (typeof value === "string") return { text: tokenText(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: "", explicit: false };
  if (TOKEN_BLOCK.some((key) => key in value)) return null;
  if (!("referralCodeUsed" in value)) return { text: "", explicit: false };
  const inner = value.referralCodeUsed;
  if (inner === null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: "", explicit: false };
  return { text: tokenText(inner), explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set partner code is text. A clear partner code is an explicit blank. A missing field stays unmarked.
 * A name, an email, a campaign, and the other blocked fields are not a partner code.
 */
export function tokenState(value: TokenValue): TokenState {
  const body = tokenBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/** The clipped partner code. A clear or unmarked value stays blank. */
export function tokenCopy(value: TokenValue): string {
  const body = tokenBody(value);
  return body?.text || "";
}

/**
 * Chip is 1–3 characters. Tag is 4–8. Plaque is 9–14. Fifteen and above is a banner.
 * A blank referral token has no band.
 */
export function tokenBand(value: TokenValue): TokenBand {
  const text = tokenCopy(value);
  if (!text) return "";
  const length = text.length;
  if (length <= 3) return "chip";
  if (length <= 8) return "tag";
  if (length <= 14) return "plaque";
  return "banner";
}

/**
 * Numeral is any digit. Tick is a dot or an underscore and no digit. Dash is a hyphen and neither.
 * Pile is four words or more. Pair is two or three words. One word is bare.
 * A blank referral token has no depth.
 */
export function tokenDepth(value: TokenValue): TokenDepth {
  const text = tokenCopy(value);
  if (!text) return "";
  if (/\d/.test(text)) return "numeral";
  if (text.includes("_") || text.includes(".")) return "tick";
  if (text.includes("-")) return "dash";
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 4) return "pile";
  if (words >= 2) return "pair";
  return "bare";
}

/** How many words the partner code carries. A blank code stays at zero. */
export function tokenWords(value: TokenValue): number {
  const text = tokenCopy(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** A partner code that contains a dot. Other marks are not. */
export function dotToken(value: TokenValue): boolean {
  return tokenCopy(value).includes(".");
}

/** A set partner code with an odd digit count. An even count is not odd. Letters do not count. */
export function oddToken(value: TokenValue): boolean {
  const digits = tokenCopy(value).replace(/\D/g, "");
  return Boolean(digits) && digits.length % 2 === 1;
}

/** A referral token that starts with +. A clear token is not a plus stem. */
export function plusToken(value: TokenValue): boolean {
  return tokenCopy(value).startsWith("+");
}

/** How many set referral tokens start with +. */
export function plusTokenCount(rows: readonly TokenRow[]): number {
  return rows.filter((row) => tokenState(row.note) === "set" && plusToken(row.note)).length;
}

export function tokenBands(rows: readonly TokenRow[]): TokenBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = tokenState(row.note);
    if (state === "") continue;
    const band = state === "set" ? tokenBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: TokenBandLine[] = [];
  for (const band of ["", ...TOKEN_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function tokenDepths(rows: readonly TokenRow[]): TokenDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = tokenDepth(row.note);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: TokenDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps pip, then slip, card, and roll. An unmarked field is not a lead. */
export function leadingToken(rows: readonly TokenRow[]): string {
  const named = tokenBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const tie = ["chip", "tag", "plaque", "banner"];
  const order = (band: string) => tie.indexOf(band);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps plain, then pair, stack, seam, rail, and figure. A blank code is not a lead. */
export function leadingTokenDepth(rows: readonly TokenRow[]): string {
  const named = tokenDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** How many set partner codes have an odd digit count. */
export function oddTokenCount(rows: readonly TokenRow[]): number {
  return rows.filter((row) => tokenState(row.note) === "set" && oddToken(row.note)).length;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function tokenShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((TOKEN_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentTokens(rows: readonly TokenRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = tokenState(row.note);
    const token = state === "set" ? tokenBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenTokens(raw: unknown, present: readonly string[]): string[] {
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

export function toggleToken(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandToken(band);
  if (!token || !present.includes(token)) return readHiddenTokens(hidden, present);
  const current = readHiddenTokens(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleTokenBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenTokens(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeToken(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (TOKEN_BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function tokenArg(filter: string): TokenBand | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (TOKEN_BANDS as readonly string[]).includes(filter) ? (filter as TokenBand) : null;
}

/** "all" and "blank" stay. A depth that is no longer loaded falls back to all. */
export function activeTokenDepth(filter: string, depths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (DEPTHS as readonly string[]).includes(filter) && depths.includes(filter) ? filter : "all";
}

export function tokenDepthArg(filter: string): TokenDepth | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (DEPTHS as readonly string[]).includes(filter) ? (filter as TokenDepth) : null;
}

function rowId(row: TokenRow): string {
  return String(row.id || "").trim();
}

export function readReviewedTokens(raw: unknown, present: readonly string[]): string[] {
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

export function toggleTokenReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedTokens(reviewed, present);
  const current = readReviewedTokens(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkTokenReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedTokens(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the depth, and the partner code are not part of the query. */
export function visibleTokenCustomers<T extends TokenRow>(
  rows: readonly T[],
  band: TokenBand | "blank" | null,
  depth: TokenDepth | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: TokenShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = tokenState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && tokenBand(row.note) !== band) return false;
    if (depth !== null && tokenDepth(row.note) !== depth) return false;
    if (shape === "dot" && !dotToken(row.note)) return false;
    if (shape === "odd" && (state !== "set" || !oddToken(row.note))) return false;
    if (shape === "plus" && !plusToken(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function tokensCsv(rows: readonly TokenRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = tokenState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of tokenBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of tokenDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  lines.push(["shape", "odd", String(oddTokenCount(rows))].join(","));
  lines.push(["shape", "plus", String(plusTokenCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function tokenRowsCsv(rows: readonly TokenRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,depth,words,dot,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(tokenBand(row.note)),
      csvCell(tokenDepth(row.note)),
      String(tokenWords(row.note)),
      dotToken(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}

export const CHIME_GLAZES = GLAZES;
export const TOKEN_BAND_NAMES = ["chip", "tag", "plaque", "banner"] as const;
