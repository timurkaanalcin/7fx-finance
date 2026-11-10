/**
 * Press slips for the compositor desk, and the partner C code already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_press_slip (
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
 *   held boolean not null default false,
 *   boxed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_partner_code_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_partner_code_review (
 *   customer_id text primary key
 * );
 */

export const SLIP_KEY = "crmv4-press-slips";
export const SLIP_VIEW_KEY = "crmv4-press-slip-views";
export const CODE_KEY = "crmv4-partner-code-hide";
export const CODE_REVIEW_KEY = "crmv4-partner-code-review";

export type SlipDye = "blank" | "soot" | "ochre" | "ivory";

export type SlipFoil = "blank" | "gilt" | "nickel" | "umber";

export type SlipTray = "open" | "held" | "boxed";

export type BayPick = "blank" | "dawn" | "day" | "dusk" | "peak" | "quiet";

export type Slip = {
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
  held: boolean;
  boxed: boolean;
  audit: string;
};

export type SlipView = {
  id: string;
  name: string;
  tray: SlipTray;
  query: string;
  setter: string;
  dye: string;
  mark: string;
  foil: string;
  bay: string;
  weight: string;
  reach: string;
};

export type SlipCounts = {
  open: number;
  held: number;
  boxed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type CodeState = "" | "set" | "clear";

export type CodeBand = "" | "pip" | "slip" | "card" | "roll";

export type CodeDepth = "" | "plain" | "pair" | "stack" | "seam" | "rail" | "figure";

export type CodeShape = "all" | "dot" | "odd";

export type CodeValue =
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

export type CodeRow = { id?: string; note?: CodeValue; label?: string | null };

export type CodeBandLine = { band: string; count: number };

export type CodeDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "foil", "pin", "unpin", "hold", "lift", "box", "unbox", "dye"] as const;

const DYES = ["soot", "ochre", "ivory"] as const;

const FOILS = ["gilt", "nickel", "umber"] as const;

const FOIL_ORDER = ["", "gilt", "nickel", "umber"] as const;

const PICKS = ["blank", "dawn", "day", "dusk", "peak", "quiet"] as const;

const PEAKS = new Set([2, 6]);

const QUIETS = new Set([1, 3, 5]);

const WEIGHTS = [1, 3, 5] as const;

const REACHES = [4, 8, 12] as const;

const HOME = new Set(["TR", "DE", "RU"]);

const CODE_BANDS = ["pip", "slip", "card", "roll"] as const;

const DEPTHS = ["plain", "pair", "stack", "seam", "rail", "figure"] as const;

const STATES = ["set", "clear"] as const;

const CODE_BLOCK = [
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
  "campaign",
  "referralCodeUsed",
] as const;

const SLIP_CAP = 7;

const VIEW_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SlipTray {
  return raw === "held" || raw === "boxed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function dyeName(raw: unknown): Exclude<SlipDye, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (DYES as readonly string[]).includes(text) ? (text as Exclude<SlipDye, "blank">) : "";
}

function foilName(raw: unknown): Exclude<SlipFoil, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (FOILS as readonly string[]).includes(text) ? (text as Exclude<SlipFoil, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function slipLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function slipNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank setter stays blank. It is not filled in. */
export function setterLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A mark is exactly two letters. Anything else stays blank. Letters are stored in capitals. */
export function slipMark(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : "";
}

/**
 * A bay is an integer from 1 through 6.
 * A blank value stays unset. 0 and 7 are not bays.
 * A leading zero is the same bay: 01 is 1, and 06 is 6. 07 is not a bay.
 */
export function bayOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 6) return raw;
  if (typeof raw === "string" && /^(?:[1-6]|0[1-6])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A weight is 1, 3, or 5.
 * A blank value stays unset. 0 and 2 are not weights.
 * A leading zero is not a weight.
 */
export function weightOf(raw: unknown): number | null {
  if (typeof raw === "number" && (WEIGHTS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:1|3|5)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A reach is 4, 8, or 12. A blank value stays unset. A leading zero is not a reach. */
export function reachOf(raw: unknown): number | null {
  if (typeof raw === "number" && (REACHES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:4|8|12)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Soot, ochre, ivory, or blank. Anything else is blank. */
export function dyeOf(raw: unknown): SlipDye {
  return dyeName(raw) || "blank";
}

/** Gilt, nickel, umber, or blank. Anything else is blank. */
export function foilOf(raw: unknown): SlipFoil {
  return foilName(raw) || "blank";
}

/** Dawn is 1. Day is 2–4. Dusk is 5–6. An unset bay is blank. */
export function bayBand(bay: unknown): "blank" | "dawn" | "day" | "dusk" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value === 1) return "dawn";
  if (value <= 4) return "day";
  return "dusk";
}

/** Peak bays are 2 and 6. An unset bay is not a peak. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAKS.has(value);
}

/** Quiet bays are 1, 3, and 5. 2 and 6 are not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIETS.has(value);
}

/**
 * The shortest signed step from the saved bay to the typed bay.
 * The ring wraps at 6. A step of 3 stays. A step of -3 stays.
 * A positive step means the typed bay is ahead of the slip.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 3) diff -= 6;
  if (diff < -3) diff += 6;
  return diff;
}

/** TR, DE, and RU are home marks. A blank mark is not. */
export function homeMark(mark: unknown): boolean {
  return HOME.has(slipMark(mark));
}

export function readSlips(raw: unknown): Slip[] {
  if (!Array.isArray(raw)) return [];
  const out: Slip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Slip>;
    const id = String(row.id || "").trim();
    const title = slipLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: slipNote(row.note),
      setter: setterLabel(row.setter),
      bay: bayOf(row.bay),
      dye: dyeName(row.dye),
      mark: slipMark(row.mark),
      foil: foilName(row.foil),
      weight: weightOf(row.weight),
      reach: reachOf(row.reach),
      pinned: row.pinned === true,
      held: row.held === true,
      boxed: row.boxed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, SLIP_CAP);
}

export function addSlip(
  cards: readonly Slip[],
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
): Slip[] {
  const current = readSlips(cards);
  const id = String(card.id || "").trim();
  const title = slipLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Slip = {
    id,
    title,
    note: slipNote(card.note),
    setter: setterLabel(card.setter),
    bay: bayOf(card.bay),
    dye: dyeName(card.dye),
    mark: slipMark(card.mark),
    foil: foilName(card.foil),
    weight: weightOf(card.weight),
    reach: reachOf(card.reach),
    pinned: false,
    held: false,
    boxed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLIP_CAP);
}

/** Blank becomes gilt. Gilt becomes nickel, nickel becomes umber, and umber returns to gilt. */
export function cycleFoil(cards: readonly Slip[], id: string): Slip[] {
  return readSlips(cards).map((card) => {
    if (card.id !== id) return card;
    const at = FOIL_ORDER.indexOf(card.foil as (typeof FOIL_ORDER)[number]);
    const next = at < 0 || at >= FOILS.length ? FOILS[0] : FOILS[at % FOILS.length];
    if (!next || next === card.foil) return card;
    return { ...card, foil: next, audit: "foil" };
  });
}

export function setSlipPin(cards: readonly Slip[], id: string, pinned: boolean): Slip[] {
  return readSlips(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setSlipHold(cards: readonly Slip[], id: string, held: boolean): Slip[] {
  return readSlips(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "lift" } : card));
}

export function setSlipBox(cards: readonly Slip[], id: string, boxed: boolean): Slip[] {
  return readSlips(cards).map((card) => (card.id === id ? { ...card, boxed, audit: boxed ? "box" : "unbox" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editSlip(cards: readonly Slip[], id: string, title: string): Slip[] {
  const current = readSlips(cards);
  const next = slipLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editSlipNote(cards: readonly Slip[], id: string, note: string): Slip[] {
  const current = readSlips(cards);
  const next = slipNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkSlipPin(cards: readonly Slip[], ids: readonly string[], pinned: boolean): Slip[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSlips(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkSlipBox(cards: readonly Slip[], ids: readonly string[], boxed: boolean): Slip[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSlips(cards).map((card) => (want.has(card.id) ? { ...card, boxed, audit: boxed ? "box" : "unbox" } : card));
}

/** A blank or unknown dye is left out. A slip already at that dye is left as it is. */
export function bulkSlipDye(cards: readonly Slip[], ids: readonly string[], dye: string): Slip[] {
  const name = dyeName(dye);
  const current = readSlips(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.dye !== name ? { ...card, dye: name, audit: "dye" } : card));
}

export function resetSlips(): Slip[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function slipCopy(raw: unknown): string {
  return slipLine(raw);
}

function inTray(card: Slip, tray: SlipTray): boolean {
  if (tray === "boxed") return card.boxed;
  if (tray === "held") return card.held && !card.boxed;
  return !card.held && !card.boxed;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

function foilScore(foil: string): number {
  if (foil === "umber") return 3;
  if (foil === "nickel") return 2;
  if (foil === "gilt") return 1;
  return 0;
}

function waitingPeak(card: Slip): boolean {
  return peakBay(card.bay) && inTray(card, "open");
}

function haystack(card: Slip): string {
  return `${card.title}\n${card.note}\n${card.mark}`.toLowerCase();
}

/** An open slip is late when the desk bay is more than two steps ahead. */
export function lateSlip(card: Slip, desk: unknown): boolean {
  const gap = bayGap(card.bay, desk);
  return inTray(card, "open") && gap !== null && gap > 2;
}

/** An open slip with a reach of 4 is due soon. A held or boxed slip is not. */
export function soonSlip(card: Slip): boolean {
  return inTray(card, "open") && card.reach === 4;
}

/** Search matches the title, the note, and the mark. The setter, the bay, and the dye are not part of the query. */
export function visibleSlips(
  cards: readonly Slip[],
  tray: SlipTray,
  query: string,
  setter: string | null,
  dye: SlipDye | null,
  mark: string | null,
  foil: SlipFoil | null,
  exact: number | null,
  pick: BayPick | null,
  weight: number | "blank" | null,
  reach: number | "blank" | null,
  umberOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): Slip[] {
  const text = query.trim().toLowerCase();
  const wantSetter = setter === null ? null : setterLabel(setter);
  const wantMark = mark === null ? null : slipMark(mark);
  return readSlips(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (umberOnly && card.foil !== "umber") return false;
      if (wantSetter !== null && setterLabel(card.setter) !== wantSetter) return false;
      if (dye !== null && dyeOf(card.dye) !== dye) return false;
      if (wantMark !== null && slipMark(card.mark) !== wantMark) return false;
      if (foil !== null && foilOf(card.foil) !== foil) return false;
      if (!bayHit(card.bay, exact, pick)) return false;
      if (weight === "blank" && card.weight !== null) return false;
      if (typeof weight === "number" && card.weight !== weight) return false;
      if (reach === "blank" && card.reach !== null) return false;
      if (typeof reach === "number" && card.reach !== reach) return false;
      if (peakOnly && !waitingPeak(card)) return false;
      if (homeOnly && !homeMark(card.mark)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (foilScore(a.foil) !== foilScore(b.foil)) return foilScore(b.foil) - foilScore(a.foil);
      return a.title.localeCompare(b.title);
    });
}

/** The bay orders the desk. An unset bay stays at the end. Search matches the title, the note, and the mark. */
export function bayTimeline(cards: readonly Slip[], query: string): Slip[] {
  const text = query.trim().toLowerCase();
  return readSlips(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.bay === null && b.bay !== null) return 1;
      if (a.bay !== null && b.bay === null) return -1;
      if (a.bay !== null && b.bay !== null && a.bay !== b.bay) return a.bay - b.bay;
      return a.title.localeCompare(b.title);
    });
}

export function slipCounts(cards: readonly Slip[], desk: unknown): SlipCounts {
  const rows = readSlips(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    boxed: rows.filter((card) => inTray(card, "boxed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => waitingPeak(card)).length,
    late: rows.filter((card) => lateSlip(card, desk)).length,
    soon: rows.filter((card) => soonSlip(card)).length,
    home: rows.filter((card) => homeMark(card.mark)).length,
  };
}

/** How many distinct bays the saved slips already use. An unset bay is not counted. */
export function usedBays(cards: readonly Slip[]): number {
  const seen = new Set<number>();
  for (const card of readSlips(cards)) if (card.bay !== null) seen.add(card.bay);
  return seen.size;
}

/** Share of the saved slips. A zero total stays at zero. */
export function slipShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function slipSetters(cards: readonly Slip[]): string[] {
  const out: string[] = [];
  for (const card of readSlips(cards)) {
    if (card.setter && !out.includes(card.setter)) out.push(card.setter);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function slipMarks(cards: readonly Slip[]): string[] {
  const out: string[] = [];
  for (const card of readSlips(cards)) {
    if (card.mark && !out.includes(card.mark)) out.push(card.mark);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function slipDyes(cards: readonly Slip[]): Exclude<SlipDye, "blank">[] {
  const seen = new Set<string>();
  for (const card of readSlips(cards)) if (card.dye) seen.add(card.dye);
  return DYES.filter((dye) => seen.has(dye));
}

export function slipFoils(cards: readonly Slip[]): Exclude<SlipFoil, "blank">[] {
  const seen = new Set<string>();
  for (const card of readSlips(cards)) if (card.foil) seen.add(card.foil);
  return FOILS.filter((foil) => seen.has(foil));
}

/** Open slips already assigned to this setter. A blank setter is not a load. */
export function setterLoad(cards: readonly Slip[], setter: string): number {
  const name = setterLabel(setter);
  if (!name) return 0;
  return readSlips(cards).filter((card) => card.setter === name && inTray(card, "open")).length;
}

/** Three dyes. Index 0 is soot. Index 2 is ivory. */
export function dyeCounts(cards: readonly Slip[]): number[] {
  const rows = readSlips(cards);
  return DYES.map((dye) => rows.filter((card) => dyeOf(card.dye) === dye).length);
}

/** "all" and "blank" stay. A setter that is no longer on a slip falls back to all. */
export function activeSetter(filter: string, setters: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const setter = setterLabel(filter);
  return setter && setters.includes(setter) ? setter : "all";
}

export function setterArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return setterLabel(filter) || null;
}

/** "all" and "blank" stay. A dye that is no longer on a slip falls back to all. */
export function activeDye(filter: string, dyes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const dye = dyeName(filter);
  return dye && dyes.includes(dye) ? dye : "all";
}

export function dyeArg(filter: string): SlipDye | null {
  if (filter === "blank") return "blank";
  return dyeName(filter) || null;
}

/** "all" and "blank" stay. A mark that is no longer on a slip falls back to all. */
export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = slipMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return slipMark(filter) || null;
}

/** "all" and "blank" stay. A foil that is no longer on a slip falls back to all. */
export function activeFoil(filter: string, foils: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const foil = foilName(filter);
  return foil && foils.includes(foil) ? foil : "all";
}

export function foilArg(filter: string): SlipFoil | null {
  if (filter === "blank") return "blank";
  return foilName(filter) || null;
}

/** All, blank, the bands, peak, quiet, and the bays 1 through 6 stay. Anything else is all. */
export function activeBay(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const bay = bayOf(filter);
  return bay === null ? "all" : String(bay);
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as BayPick };
  const bay = bayOf(filter);
  return bay === null ? { exact: null, pick: null } : { exact: bay, pick: null };
}

/** All, blank, and the weights 1, 3, and 5 stay. Anything else is all. */
export function activeWeight(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const weight = weightOf(filter);
  return weight === null ? "all" : String(weight);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

/** All, blank, and the reaches 4, 8, and 12 stay. Anything else is all. */
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
export function bayClashIds(cards: readonly Slip[], id: string): string[] {
  const rows = readSlips(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.dye || card.bay === null) return [];
  return rows
    .filter((item) => item.id !== id && item.dye === card.dye && item.bay === card.bay)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved slips share a dye and a bay with another slip. */
export function clashBayCount(cards: readonly Slip[]): number {
  const rows = readSlips(cards);
  return rows.filter((card) => bayClashIds(rows, card.id).length > 0).length;
}

/** Other slips with the same dye and the same weight. A blank dye or a blank weight clashes with nothing. */
export function weightClashIds(cards: readonly Slip[], id: string): string[] {
  const rows = readSlips(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.dye || card.weight === null) return [];
  return rows
    .filter((item) => item.id !== id && item.dye === card.dye && item.weight === card.weight)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved slips share a dye and a weight with another slip. */
export function weightClashCount(cards: readonly Slip[]): number {
  const rows = readSlips(cards);
  return rows.filter((card) => weightClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open slip at or after the bay you type, skipping umber.
 * After 6, the ring wraps to the earliest open slip that is not umber.
 */
export function nextSlip(cards: readonly Slip[], desk: unknown): string {
  const now = bayOf(desk);
  if (now === null) return "";
  const waiting = readSlips(cards).filter((card) => inTray(card, "open") && card.bay !== null && card.foil !== "umber");
  if (!waiting.length) return "";
  const byBay = (a: Slip, b: Slip) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.bay ?? 0) >= now).sort(byBay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBay)[0].id;
}

/**
 * The dye with the fewest open slips.
 * A tie keeps the earlier dye: soot, then ochre, then ivory.
 * Slips with no dye are not a load. An empty desk still suggests soot.
 */
export function suggestDye(cards: readonly Slip[]): Exclude<SlipDye, "blank"> {
  const rows = readSlips(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<SlipDye, "blank"> = "soot";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const dye of DYES) {
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
export function suggestSetter(cards: readonly Slip[]): string {
  const rows = readSlips(cards).filter((card) => inTray(card, "open") && card.setter);
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
 * A tie keeps 8, then 4, then 12, so a reach of 4 is not the first choice.
 * An empty desk still suggests 8.
 */
export function suggestReach(cards: readonly Slip[]): (typeof REACHES)[number] {
  const rows = readSlips(cards).filter((card) => inTray(card, "open"));
  const order = [8, 4, 12] as const;
  let best: (typeof REACHES)[number] = 8;
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
export function slipsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,setter,bay,dye,mark,foil,weight,reach,band,pinned,held,boxed,gap,late,soon,home,note,audit"];
  for (const card of readSlips(raw)) {
    const gap = bayGap(card.bay, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.setter),
      card.bay === null ? "" : String(card.bay),
      card.dye,
      csvCell(card.mark),
      card.foil,
      card.weight === null ? "" : String(card.weight),
      card.reach === null ? "" : String(card.reach),
      bayBand(card.bay),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.boxed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(card, desk) ? "1" : "0",
      soonSlip(card) ? "1" : "0",
      homeMark(card.mark) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function setterSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return setterLabel(raw) || "all";
}

function dyeSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return dyeName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return slipMark(raw) || "all";
}

function foilSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return foilName(raw) || "all";
}

export function readSlipViews(raw: unknown): SlipView[] {
  if (!Array.isArray(raw)) return [];
  const out: SlipView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SlipView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      setter: setterSlot(row.setter),
      dye: dyeSlot(row.dye),
      mark: markSlot(row.mark),
      foil: foilSlot(row.foil),
      bay: activeBay(String(row.bay || "all")),
      weight: activeWeight(String(row.weight || "all")),
      reach: activeReach(String(row.reach || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlipView(views: readonly SlipView[], view: SlipView): SlipView[] {
  const current = readSlipViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    setter: setterSlot(view.setter),
    dye: dyeSlot(view.dye),
    mark: markSlot(view.mark),
    foil: foilSlot(view.foil),
    bay: activeBay(view.bay),
    weight: activeWeight(view.weight),
    reach: activeReach(view.reach),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropSlipView(views: readonly SlipView[], id: string): SlipView[] {
  return readSlipViews(views).filter((view) => view.id !== id);
}

function codeText(raw: unknown): string {
  return clip(raw, 48);
}

function codeBody(value: CodeValue): { text: string; explicit: boolean } | null {
  if (typeof value === "number") return { text: "", explicit: false };
  if (typeof value === "string") return { text: codeText(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: "", explicit: false };
  if (CODE_BLOCK.some((key) => key in value)) return null;
  if (!("affiliateC" in value)) return { text: "", explicit: false };
  const inner = value.affiliateC;
  if (inner === null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: "", explicit: false };
  return { text: codeText(inner), explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set partner code is text. A clear partner code is an explicit blank. A missing field stays unmarked.
 * A name, an email, a campaign, and the other blocked fields are not a partner code.
 */
export function codeState(value: CodeValue): CodeState {
  const body = codeBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/** The clipped partner code. A clear or unmarked value stays blank. */
export function codeCopy(value: CodeValue): string {
  const body = codeBody(value);
  return body?.text || "";
}

/**
 * Pip is 1–2 characters. Slip is 3–6. Card is 7–10. Eleven and above is a roll.
 * A blank partner code has no band.
 */
export function codeBand(value: CodeValue): CodeBand {
  const text = codeCopy(value);
  if (!text) return "";
  const length = text.length;
  if (length <= 2) return "pip";
  if (length <= 6) return "slip";
  if (length <= 10) return "card";
  return "roll";
}

/**
 * Figure is any digit. Rail is a dot or an underscore and no digit. Seam is a hyphen and neither.
 * Stack is three words or more. Pair is two words. One word is plain.
 * A blank partner code has no depth.
 */
export function codeDepth(value: CodeValue): CodeDepth {
  const text = codeCopy(value);
  if (!text) return "";
  if (/\d/.test(text)) return "figure";
  if (text.includes("_") || text.includes(".")) return "rail";
  if (text.includes("-")) return "seam";
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 3) return "stack";
  if (words === 2) return "pair";
  return "plain";
}

/** How many words the partner code carries. A blank code stays at zero. */
export function codeWords(value: CodeValue): number {
  const text = codeCopy(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** A partner code that contains a dot. Other marks are not. */
export function dotCode(value: CodeValue): boolean {
  return codeCopy(value).includes(".");
}

/** A set partner code with an odd digit count. An even count is not odd. Letters do not count. */
export function oddCode(value: CodeValue): boolean {
  const digits = codeCopy(value).replace(/\D/g, "");
  return Boolean(digits) && digits.length % 2 === 1;
}

export function codeBands(rows: readonly CodeRow[]): CodeBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = codeState(row.note);
    if (state === "") continue;
    const band = state === "set" ? codeBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: CodeBandLine[] = [];
  for (const band of ["", ...CODE_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function codeDepths(rows: readonly CodeRow[]): CodeDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = codeDepth(row.note);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: CodeDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps pip, then slip, card, and roll. An unmarked field is not a lead. */
export function leadingCode(rows: readonly CodeRow[]): string {
  const named = codeBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const tie = ["pip", "slip", "card", "roll"];
  const order = (band: string) => tie.indexOf(band);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps plain, then pair, stack, seam, rail, and figure. A blank code is not a lead. */
export function leadingCodeDepth(rows: readonly CodeRow[]): string {
  const named = codeDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** How many set partner codes have an odd digit count. */
export function oddCodeCount(rows: readonly CodeRow[]): number {
  return rows.filter((row) => codeState(row.note) === "set" && oddCode(row.note)).length;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function codeShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((CODE_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentCodes(rows: readonly CodeRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = codeState(row.note);
    const token = state === "set" ? codeBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenCodes(raw: unknown, present: readonly string[]): string[] {
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

export function toggleCode(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandToken(band);
  if (!token || !present.includes(token)) return readHiddenCodes(hidden, present);
  const current = readHiddenCodes(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleCodeBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenCodes(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeCode(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (CODE_BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function codeArg(filter: string): CodeBand | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (CODE_BANDS as readonly string[]).includes(filter) ? (filter as CodeBand) : null;
}

/** "all" and "blank" stay. A depth that is no longer loaded falls back to all. */
export function activeCodeDepth(filter: string, depths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (DEPTHS as readonly string[]).includes(filter) && depths.includes(filter) ? filter : "all";
}

export function codeDepthArg(filter: string): CodeDepth | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (DEPTHS as readonly string[]).includes(filter) ? (filter as CodeDepth) : null;
}

function rowId(row: CodeRow): string {
  return String(row.id || "").trim();
}

export function readReviewedCodes(raw: unknown, present: readonly string[]): string[] {
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

export function toggleCodeReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedCodes(reviewed, present);
  const current = readReviewedCodes(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkCodeReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedCodes(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the depth, and the partner code are not part of the query. */
export function visibleCodeCustomers<T extends CodeRow>(
  rows: readonly T[],
  band: CodeBand | "blank" | null,
  depth: CodeDepth | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: CodeShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = codeState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && codeBand(row.note) !== band) return false;
    if (depth !== null && codeDepth(row.note) !== depth) return false;
    if (shape === "dot" && !dotCode(row.note)) return false;
    if (shape === "odd" && (state !== "set" || !oddCode(row.note))) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function codesCsv(rows: readonly CodeRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = codeState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of codeBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of codeDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  lines.push(["shape", "odd", String(oddCodeCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function codeRowsCsv(rows: readonly CodeRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,depth,words,dot,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(codeBand(row.note)),
      csvCell(codeDepth(row.note)),
      String(codeWords(row.note)),
      dotCode(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}

export const SLIP_DYES = DYES;
export const CODE_BAND_NAMES = ["pip", "slip", "card", "roll"] as const;
