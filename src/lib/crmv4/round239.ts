/**
 * Alcove slips for retention follow-ups, and passport stamps already stored as a document name, type, and status.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_alcove_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   steward text not null default '',
 *   bay integer,
 *   cloth text not null default '',
 *   tempo text not null default '',
 *   sla integer,
 *   weight integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_stamp_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_stamp_review (
 *   document_id text primary key
 * );
 */

export const ALV_KEY = "crmv4-alcove-slip";
export const ALV_VIEW_KEY = "crmv4-alcove-views";
export const ALV_DENSITY_KEY = "crmv4-alcove-density";
export const PSP_KEY = "crmv4-stamp-hide";
export const PSP_REVIEW_KEY = "crmv4-stamp-review";

export type ClothName = "blank" | "linen" | "wool" | "velvet";

export type TempoName = "blank" | "still" | "walk" | "rush";

export type AlcoveTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type AlcoveDensity = "airy" | "tight";

export type AlcoveSort = "bay" | "steward";

export type AlcoveCard = {
  id: string;
  title: string;
  note: string;
  steward: string;
  bay: number | null;
  cloth: string;
  tempo: string;
  span: number | null;
  weight: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  seal: boolean;
  audit: string;
};

export type AlcoveView = {
  id: string;
  name: string;
  tray: AlcoveTray;
  query: string;
  steward: string;
  cloth: string;
  tempo: string;
  bay: string;
  span: string;
  weight: string;
};

export type AlcoveCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  weight: number;
  house: number;
  window: number;
  matched: number;
  seal: number;
  cooling: number;
};

export type StampLane = "" | "hall" | "wax" | "queue" | "gate" | "vault" | "cipher";

export type StampTone = "" | "gilt" | "pale" | "linen" | "ash" | "haze";

export type StampState = "" | "clear" | "set";

export type StampShape = "all" | "join" | "wide" | "hall" | "cipher" | "wax";

export type StampReview = "all" | "reviewed" | "fresh";

export type StampValue = string | { name?: unknown; kind?: unknown; state?: unknown; [key: string]: unknown } | null | undefined;

export type StampRow = { id: string; label: string; note: StampValue };

export type StampLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "tempo", "pin", "unpin", "hold", "resume", "archive", "open", "cloth", "tag", "weight", "span", "seal"] as const;

const CLOTHS = ["linen", "wool", "velvet"] as const;

const TEMPOS = ["still", "walk", "rush"] as const;

const TEMPO_CYCLE = ["still", "walk", "rush"] as const;

const PEAK_BAYS = new Set([2, 5]);

const QUIET_BAYS = new Set([6]);

const HOUSE = new Set(["WOOL", "VELVET"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const ALV_CAP = 6;

const VIEW_CAP = 4;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): AlcoveTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ClothName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<ClothName, "blank">) : "";
}

function tempoName(raw: unknown): Exclude<TempoName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TEMPOS as readonly string[]).includes(text) ? (text as Exclude<TempoName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[abcd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: AlcoveCard, tray: AlcoveTray): boolean {
  if (tray === "held") return card.held && !card.archived;
  if (tray === "archived") return card.archived;
  return !card.held && !card.archived;
}

/** A blank title is left out. The saved title stays short. */
export function alcoveLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function alcoveNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A blank steward stays blank. It is not filled in. */
export function alcoveSteward(raw: unknown): string {
  return clip(raw, 20);
}

/** A cloth is LINEN, WOOL, or VELVET. Anything else stays blank. Letters are stored in capitals. */
export function clothOf(raw: unknown): string {
  const name = clothName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bay is an integer from 1 through 6.
 * A blank value stays unset. 0 is not a bay.
 * 7 and 8 are not bays.
 */
export function bayOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-6]$/.test(text)) return null;
  return Number(text);
}

/** A span is 4, 12, or 24 hours. A blank value stays unset. */
export function spanOf(raw: unknown): 4 | 12 | 24 | null {
  if (raw === 4 || raw === "4") return 4;
  if (raw === 12 || raw === "12") return 12;
  if (raw === 24 || raw === "24") return 24;
  return null;
}

/** Weight is 1, 3, or 6. Anything else is not a weight. 1 is the resting weight. */
export function weightOf(raw: unknown): 1 | 3 | 6 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 6 || raw === "6") return 6;
  return null;
}

export function bayBand(bay: unknown): "blank" | "early" | "mid" | "late" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
}

/** Peak bays are 2 and 5. An unset bay is not a peak bay. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAK_BAYS.has(value);
}

/** The quiet bay is 6. A peak bay is not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * How far a bay sits behind the desk bay.
 * A positive gap means the slip is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Bays do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** WOOL and VELVET are house cloth. LINEN is a guest cloth. A blank cloth is not house cloth. */
export function houseCloth(cloth: unknown): boolean {
  return HOUSE.has(clothOf(cloth));
}

export function alcoveDensity(raw: unknown): AlcoveDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function alcoveSort(raw: unknown): AlcoveSort {
  return raw === "steward" ? "steward" : "bay";
}

function readOne(raw: unknown): AlcoveCard | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = alcoveLine(row.title);
  if (!id || !title) return null;
  const weight = weightOf(row.weight);
  return {
    id,
    title,
    note: alcoveNote(row.note),
    steward: alcoveSteward(row.steward),
    bay: bayOf(row.bay),
    cloth: clothOf(row.cloth),
    tempo: tempoName(row.tempo),
    span: spanOf(row.span),
    weight: weight === null ? 1 : weight,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    seal: row.seal === true,
    audit: auditCode(row.audit),
  };
}

export function readAlcoves(raw: unknown): AlcoveCard[] {
  if (!Array.isArray(raw)) return [];
  const out: AlcoveCard[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, ALV_CAP);
}

export function addAlcove(
  cards: readonly AlcoveCard[],
  card: {
    id: string;
    title: string;
    note?: string;
    steward?: string;
    bay?: unknown;
    cloth?: string;
    tempo?: string;
    span?: unknown;
    weight?: unknown;
    tags?: unknown;
  },
): AlcoveCard[] {
  const current = readAlcoves(cards);
  const id = String(card.id || "").trim();
  const title = alcoveLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const weight = weightOf(card.weight);
  const next: AlcoveCard = {
    id,
    title,
    note: alcoveNote(card.note),
    steward: alcoveSteward(card.steward),
    bay: bayOf(card.bay),
    cloth: clothOf(card.cloth),
    tempo: tempoName(card.tempo),
    span: spanOf(card.span),
    weight: weight === null ? 1 : weight,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, ALV_CAP);
}

/** A blank tempo becomes still, still becomes walk, walk becomes rush, and rush returns to still. */
export function cycleTempo(cards: readonly AlcoveCard[], id: string): AlcoveCard[] {
  return readAlcoves(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TEMPO_CYCLE.indexOf(card.tempo as (typeof TEMPO_CYCLE)[number]);
    const next = at < 0 ? TEMPO_CYCLE[0] : TEMPO_CYCLE[(at + 1) % TEMPO_CYCLE.length];
    if (!next || next === card.tempo) return card;
    return { ...card, tempo: next, audit: "tempo" };
  });
}

/** A blank title is left as it is. */
export function editAlcove(cards: readonly AlcoveCard[], id: string, title: unknown): AlcoveCard[] {
  const next = alcoveLine(title);
  if (!next) return readAlcoves(cards);
  const current = readAlcoves(cards);
  if (current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

export function editAlcoveNote(cards: readonly AlcoveCard[], id: string, note: unknown): AlcoveCard[] {
  const next = alcoveNote(note);
  return readAlcoves(cards).map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "note" } : card));
}

export function addAlcoveTag(cards: readonly AlcoveCard[], id: string, tag: unknown): AlcoveCard[] {
  const next = tagsOf(tag);
  if (!next.length) return readAlcoves(cards);
  return readAlcoves(cards).map((card) => {
    if (card.id !== id) return card;
    const tags = tagsOf([...card.tags, ...next]);
    if (tags.join() === card.tags.join()) return card;
    return { ...card, tags, audit: "tag" };
  });
}

export function setAlcoveWeight(cards: readonly AlcoveCard[], id: string, weight: unknown): AlcoveCard[] {
  const next = weightOf(weight);
  if (next === null) return readAlcoves(cards);
  return readAlcoves(cards).map((card) => (card.id === id && card.weight !== next ? { ...card, weight: next, audit: "weight" } : card));
}

/** Snooze steps a blank span to 12, 4 to 12, and 12 to 24. A span of 24 stays. */
export function snoozeAlcove(cards: readonly AlcoveCard[], id: string): AlcoveCard[] {
  return readAlcoves(cards).map((card) => {
    if (card.id !== id || card.span === 24) return card;
    const next = card.span === 12 ? 24 : 12;
    return { ...card, span: next, audit: "span" };
  });
}

export function setAlcovePin(cards: readonly AlcoveCard[], id: string, pinned: boolean): AlcoveCard[] {
  return readAlcoves(cards).map((card) => (card.id === id && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function pinFocusedAlcove(cards: readonly AlcoveCard[], shownIds: readonly string[], index: number): AlcoveCard[] {
  const id = shownIds[index];
  if (!id) return readAlcoves(cards);
  const card = readAlcoves(cards).find((item) => item.id === id);
  if (!card) return readAlcoves(cards);
  return setAlcovePin(cards, id, !card.pinned);
}

export function snoozeFocusedAlcove(cards: readonly AlcoveCard[], shownIds: readonly string[], index: number): AlcoveCard[] {
  const id = shownIds[index];
  return id ? snoozeAlcove(cards, id) : readAlcoves(cards);
}

export function holdFocusedAlcove(cards: readonly AlcoveCard[], shownIds: readonly string[], index: number): AlcoveCard[] {
  const id = shownIds[index];
  if (!id) return readAlcoves(cards);
  const card = readAlcoves(cards).find((item) => item.id === id);
  if (!card || card.archived) return readAlcoves(cards);
  return setAlcoveHold(cards, id, !card.held);
}

export function tempoFocusedAlcove(cards: readonly AlcoveCard[], shownIds: readonly string[], index: number): AlcoveCard[] {
  const id = shownIds[index];
  return id ? cycleTempo(cards, id) : readAlcoves(cards);
}

export function sealFocusedAlcove(cards: readonly AlcoveCard[], shownIds: readonly string[], index: number): AlcoveCard[] {
  const id = shownIds[index];
  if (!id) return readAlcoves(cards);
  const card = readAlcoves(cards).find((item) => item.id === id);
  if (!card) return readAlcoves(cards);
  return setAlcoveSeal(cards, id, !card.seal);
}

export function setAlcoveHold(cards: readonly AlcoveCard[], id: string, held: boolean): AlcoveCard[] {
  return readAlcoves(cards).map((card) => (card.id === id && !card.archived && card.held !== held ? { ...card, held, audit: held ? "hold" : "resume" } : card));
}

export function setAlcoveArchive(cards: readonly AlcoveCard[], id: string, archived: boolean): AlcoveCard[] {
  return readAlcoves(cards).map((card) => (card.id === id && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function setAlcoveSeal(cards: readonly AlcoveCard[], id: string, seal: boolean): AlcoveCard[] {
  return readAlcoves(cards).map((card) => (card.id === id && card.seal !== seal ? { ...card, seal, audit: "seal" } : card));
}

export function bulkAlcoveCloth(cards: readonly AlcoveCard[], ids: readonly string[], cloth: unknown): AlcoveCard[] {
  const next = clothOf(cloth);
  if (!next) return readAlcoves(cards);
  const want = new Set(ids);
  return readAlcoves(cards).map((card) => (want.has(card.id) && card.cloth !== next ? { ...card, cloth: next, audit: "cloth" } : card));
}

export function bulkAlcovePin(cards: readonly AlcoveCard[], ids: readonly string[], pinned: boolean): AlcoveCard[] {
  const want = new Set(ids);
  return readAlcoves(cards).map((card) => (want.has(card.id) && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkAlcoveArchive(cards: readonly AlcoveCard[], ids: readonly string[], archived: boolean): AlcoveCard[] {
  const want = new Set(ids);
  return readAlcoves(cards).map((card) => (want.has(card.id) && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function bulkAlcoveTempo(cards: readonly AlcoveCard[], ids: readonly string[], tempo: unknown): AlcoveCard[] {
  const next = tempoName(tempo);
  if (!next) return readAlcoves(cards);
  const want = new Set(ids);
  return readAlcoves(cards).map((card) => (want.has(card.id) && card.tempo !== next ? { ...card, tempo: next, audit: "tempo" } : card));
}

export function bulkAlcoveTag(cards: readonly AlcoveCard[], ids: readonly string[], tag: unknown): AlcoveCard[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addAlcoveTag(rows, id, tag) : rows), readAlcoves(cards));
}

/** An open slip whose bay sits more than two bays behind the desk. A raised weight, a hold, or an archive is not late. */
export function lateAlcove(card: AlcoveCard, desk: unknown): boolean {
  const gap = bayGap(card.bay, desk);
  return inTray(card, "open") && card.weight === 1 && gap !== null && gap > 2;
}

/** An open slip with a span of 4 hours is due now. A raised weight, a hold, or an archive is not. */
export function soonAlcove(card: AlcoveCard): boolean {
  return inTray(card, "open") && card.weight === 1 && card.span === 4;
}

/** An open resting slip on a rush tempo whose bay is 6. That quiet rush is cooling. */
export function coolingAlcove(card: AlcoveCard): boolean {
  return inTray(card, "open") && card.weight === 1 && card.tempo === "rush" && card.bay === 6;
}

/** Open slips that are late or due now. A raised slip stays off the reminder list. */
export function reminderAlcoves(cards: readonly AlcoveCard[], desk: unknown): AlcoveCard[] {
  return readAlcoves(cards).filter((card) => lateAlcove(card, desk) || soonAlcove(card));
}

export function coolingAlcoves(cards: readonly AlcoveCard[]): AlcoveCard[] {
  return readAlcoves(cards).filter((card) => coolingAlcove(card));
}

/** Open slips whose bay sits within one bay of the desk. A raised weight, a hold, or an archive stays out. */
export function windowAlcoves(cards: readonly AlcoveCard[], desk: unknown): AlcoveCard[] {
  return readAlcoves(cards).filter((card) => {
    const gap = bayGap(card.bay, desk);
    return inTray(card, "open") && card.weight === 1 && gap !== null && gap >= -1 && gap <= 1;
  });
}

export function matchedAlcoves(cards: readonly AlcoveCard[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readAlcoves(cards).filter((card) => inTray(card, "open") && card.weight === 1 && card.bay === at).length;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

/** Search matches the title, the note, the steward, and the tags. */
export function visibleAlcoves(
  cards: readonly AlcoveCard[],
  tray: AlcoveTray,
  query: string,
  steward: string | null,
  cloth: string | null,
  tempo: string | null,
  exact: number | null,
  pick: BayPick | null,
  span: number | "blank" | null,
  weight: number | "blank" | null,
  rushOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): AlcoveCard[] {
  const text = query.trim().toLowerCase();
  return readAlcoves(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text) {
      const hay = `${card.title} ${card.note} ${card.steward} ${card.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (steward !== null && card.steward !== steward) return false;
    if (cloth === "blank" ? Boolean(card.cloth) : cloth && card.cloth !== cloth) return false;
    if (tempo === "blank" ? Boolean(card.tempo) : tempo && card.tempo !== tempo) return false;
    if (!bayHit(card.bay, exact, pick)) return false;
    if (span === "blank" ? card.span !== null : span !== null && card.span !== span) return false;
    if (weight === "blank" ? card.weight !== 1 : weight !== null && card.weight !== weight) return false;
    if (rushOnly && card.tempo !== "rush") return false;
    if (peakOnly && !peakBay(card.bay)) return false;
    if (houseOnly && !houseCloth(card.cloth)) return false;
    if (quietOnly && !quietBay(card.bay)) return false;
    if (restingOnly && card.weight !== 1) return false;
    return true;
  });
}

export function sortAlcoves(cards: readonly AlcoveCard[], mode: AlcoveSort): AlcoveCard[] {
  const rows = cards.slice();
  if (mode === "steward") return rows.sort((a, b) => a.steward.localeCompare(b.steward) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function alcoveIndex(cards: readonly AlcoveCard[], query: string): AlcoveCard[] {
  const text = query.trim().toLowerCase();
  return sortAlcoves(
    readAlcoves(cards).filter((card) => card.bay !== null && (!text || card.title.toLowerCase().includes(text))),
    "bay",
  );
}

/** Open slips grouped by bay, earliest bay first. A blank bay stays off the timeline. */
export function alcoveTimeline(cards: readonly AlcoveCard[]): { bay: number; titles: string[] }[] {
  const rows = readAlcoves(cards).filter((card) => inTray(card, "open") && card.bay !== null);
  const bays = Array.from(new Set(rows.map((card) => card.bay as number))).sort((a, b) => a - b);
  return bays.map((bay) => ({
    bay,
    titles: rows.filter((card) => card.bay === bay).map((card) => card.title).sort((a, b) => a.localeCompare(b)),
  }));
}

export function alcoveCounts(cards: readonly AlcoveCard[], desk: unknown): AlcoveCounts {
  const rows = readAlcoves(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    archived: rows.filter((card) => inTray(card, "archived")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => inTray(card, "open") && card.weight === 1 && peakBay(card.bay)).length,
    late: rows.filter((card) => lateAlcove(card, desk)).length,
    soon: rows.filter((card) => soonAlcove(card)).length,
    weight: rows.filter((card) => inTray(card, "open") && card.weight > 1).length,
    house: rows.filter((card) => inTray(card, "open") && houseCloth(card.cloth)).length,
    window: windowAlcoves(rows, desk).length,
    matched: matchedAlcoves(rows, desk),
    seal: rows.filter((card) => card.seal).length,
    cooling: rows.filter((card) => coolingAlcove(card)).length,
  };
}

export function alcoveShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open slips as a share of every open slip. */
export function lateAlcoveShare(cards: readonly AlcoveCard[], desk: unknown): number {
  const rows = readAlcoves(cards).filter((card) => inTray(card, "open"));
  return alcoveShare(rows.filter((card) => lateAlcove(card, desk)).length, rows.length);
}

/** Open slips that share a bay. */
export function clashBayCount(cards: readonly AlcoveCard[]): number {
  const open = readAlcoves(cards).filter((card) => inTray(card, "open") && card.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].bay === open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open slips that share a span. */
export function spanClashCount(cards: readonly AlcoveCard[]): number {
  const open = readAlcoves(cards).filter((card) => inTray(card, "open") && card.span !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].span === open[j].span) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open slips whose bays sit exactly three bays apart. */
export function adjacentAlcoveCount(cards: readonly AlcoveCard[]): number {
  const open = readAlcoves(cards).filter((card) => inTray(card, "open") && card.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].bay || 0) - (open[j].bay || 0)) === 3) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The cloth with the fewest open slips.
 * A tie keeps VELVET, then WOOL, then LINEN.
 * An empty desk still suggests VELVET.
 */
export function suggestCloth(cards: readonly AlcoveCard[]): "VELVET" | "WOOL" | "LINEN" {
  const rows = readAlcoves(cards).filter((card) => inTray(card, "open"));
  const order = ["VELVET", "WOOL", "LINEN"] as const;
  let best: "VELVET" | "WOOL" | "LINEN" = "VELVET";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cloth of order) {
    const count = rows.filter((card) => card.cloth === cloth).length;
    if (count < bestCount) {
      best = cloth;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The SLA with the fewest open slips.
 * A tie keeps 12, then 4, then 24.
 * An empty desk still suggests 12.
 */
export function suggestSpan(cards: readonly AlcoveCard[]): 12 | 4 | 24 {
  const rows = readAlcoves(cards).filter((card) => inTray(card, "open"));
  const order = [12, 4, 24] as const;
  let best: 12 | 4 | 24 = 12;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const span of order) {
    const count = rows.filter((card) => card.span === span).length;
    if (count < bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

/** The newest steward already written on a slip. A blank steward is skipped. */
export function suggestSteward(cards: readonly AlcoveCard[]): string {
  const found = readAlcoves(cards).find((card) => card.steward);
  return found ? found.steward : "";
}

/**
 * The steward carrying the fewest open slips.
 * A tie keeps the earlier name on the roster. A blank steward is not a load.
 * An empty roster falls back to the newest steward.
 */
export function fairSteward(cards: readonly AlcoveCard[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = alcoveSteward(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestSteward(cards);
  const open = readAlcoves(cards).filter((card) => inTray(card, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.steward === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The steward with the most open slips. A tie keeps the name that sorts later. */
export function busiestSteward(cards: readonly AlcoveCard[]): string {
  const rows = readAlcoves(cards).filter((card) => inTray(card, "open") && card.steward);
  const names: string[] = [];
  for (const card of rows) if (!names.includes(card.steward)) names.push(card.steward);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((card) => card.steward === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function alcoveStewards(cards: readonly AlcoveCard[]): string[] {
  const out: string[] = [];
  for (const card of readAlcoves(cards)) {
    if (card.steward && !out.includes(card.steward)) out.push(card.steward);
  }
  return out;
}

export function alcoveCloths(cards: readonly AlcoveCard[]): string[] {
  const out: string[] = [];
  for (const card of readAlcoves(cards)) {
    if (card.cloth && !out.includes(card.cloth)) out.push(card.cloth);
  }
  return out;
}

/** Open slips whose steward also keeps another open slip on a different bay. */
export function pairAlcoveCount(cards: readonly AlcoveCard[]): number {
  const open = readAlcoves(cards).filter((card) => inTray(card, "open") && card.steward && card.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].steward === open[j].steward && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open slips that share a cloth on different bays. */
export function sharedClothCount(cards: readonly AlcoveCard[]): number {
  const open = readAlcoves(cards).filter((card) => inTray(card, "open") && card.cloth && card.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].cloth === open[j].cloth && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The weight of open slips. The resting weight of 1 still counts. */
export function weightLoad(cards: readonly AlcoveCard[]): number {
  return readAlcoves(cards).filter((card) => inTray(card, "open")).reduce((sum, card) => sum + card.weight, 0);
}

/** Open slips that are both the quiet bay and a house cloth. */
export function quietHallAlcoves(cards: readonly AlcoveCard[]): number {
  return readAlcoves(cards).filter((card) => inTray(card, "open") && quietBay(card.bay) && houseCloth(card.cloth)).length;
}

/** Open slips whose tempo is rush. */
export function rushAlcoveLoad(cards: readonly AlcoveCard[]): number {
  return readAlcoves(cards).filter((card) => inTray(card, "open") && card.tempo === "rush").length;
}

export function bayWidth(cards: readonly AlcoveCard[]): number {
  const bays = readAlcoves(cards).filter((card) => inTray(card, "open") && card.bay !== null).map((card) => card.bay as number);
  if (!bays.length) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/** The next open slip whose bay sits ahead of the desk. An unset desk has no next slip. */
export function nextAlcove(cards: readonly AlcoveCard[], desk: unknown): string {
  const at = bayOf(desk);
  if (at === null) return "";
  const rows = readAlcoves(cards)
    .filter((card) => inTray(card, "open") && card.weight === 1 && card.bay !== null && (card.bay as number) > at)
    .sort((a, b) => (a.bay || 0) - (b.bay || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveAlcoveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function alcoveCopy(card: AlcoveCard, desk: unknown): string {
  const gap = bayGap(card.bay, desk);
  return [card.title, card.steward, card.bay ?? "", card.cloth, card.tempo, card.span ?? "", card.weight, card.tags.join(" "), card.seal ? "1" : "0", card.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap and the late mark use the bay you pass. */
export function alcovesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,steward,bay,cloth,tempo,span,weight,tags,pinned,held,archived,seal,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readAlcoves(raw);
  const windowIds = new Set(windowAlcoves(rows, desk).map((card) => card.id));
  const at = bayOf(desk);
  for (const card of rows) {
    const gap = bayGap(card.bay, desk);
    lines.push([
      card.title,
      card.steward,
      card.bay === null ? "" : String(card.bay),
      card.cloth,
      card.tempo,
      card.span === null ? "" : String(card.span),
      String(card.weight),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.archived ? "1" : "0",
      card.seal ? "1" : "0",
      gap === null ? "" : String(gap),
      lateAlcove(card, desk) ? "1" : "0",
      soonAlcove(card) ? "1" : "0",
      houseCloth(card.cloth) ? "1" : "0",
      windowIds.has(card.id) ? "1" : "0",
      at !== null && card.bay === at && card.weight === 1 && inTray(card, "open") ? "1" : "0",
      coolingAlcove(card) ? "1" : "0",
      card.note,
      card.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeSteward(raw: string, stewards: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return stewards.includes(raw) ? raw : "all";
}

export function activeCloth(raw: string, cloths: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = clothOf(raw);
  return name && cloths.map((item) => item.toUpperCase()).includes(name) ? name : cloths.includes(raw) ? raw : "all";
}

export function activeTempo(raw: string, tempos: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return tempos.includes(raw) ? raw : "all";
}

export function activeBay(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return bayOf(raw) === null ? "all" : raw;
}

export function activeSpan(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return spanOf(raw) === null ? "all" : raw;
}

export function activeWeight(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return weightOf(raw) === null ? "all" : raw;
}

export function stewardArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function clothArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return clothOf(filter) || null;
}

export function tempoArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return tempoName(filter) || null;
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: bayOf(filter), pick: null };
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

function readView(raw: unknown): AlcoveView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 40),
    steward: clip(row.steward, 20),
    cloth: clip(row.cloth, 12),
    tempo: clip(row.tempo, 8),
    bay: clip(row.bay, 8),
    span: clip(row.span, 8),
    weight: clip(row.weight, 8),
  };
}

export function readAlcoveViews(raw: unknown): AlcoveView[] {
  if (!Array.isArray(raw)) return [];
  const out: AlcoveView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addAlcoveView(views: readonly AlcoveView[], view: AlcoveView): AlcoveView[] {
  const current = readAlcoveViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropAlcoveView(views: readonly AlcoveView[], id: string): AlcoveView[] {
  return readAlcoveViews(views).filter((view) => view.id !== id);
}

function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

function stampParts(value: StampValue): { name: string; kind: string; state: string; ok: boolean } {
  if (typeof value === "string") return { name: clip(value, 48), kind: "", state: "", ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { name: "", kind: "", state: "", ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { name: "", kind: "", state: "", ok: false };
  if (!("name" in value) && !("kind" in value) && !("state" in value)) {
    return { name: "", kind: "", state: "", ok: false };
  }
  const nameRaw = "name" in value ? value.name : "";
  const kindRaw = "kind" in value ? value.kind : "";
  const stateRaw = "state" in value ? value.state : "";
  if (!textOk(nameRaw) || !textOk(kindRaw) || !textOk(stateRaw)) {
    return { name: "", kind: "", state: "", ok: false };
  }
  return {
    name: clip(nameRaw, 48),
    kind: clip(kindRaw, 16).toUpperCase(),
    state: clip(stateRaw, 16).toUpperCase(),
    ok: true,
  };
}

export function stampState(value: StampValue): StampState {
  const found = stampParts(value);
  if (!found.ok) return "";
  return found.name ? "set" : "clear";
}

export function stampCopy(value: StampValue): string {
  const found = stampParts(value);
  return found.ok ? found.name : "";
}

/** The stamp mark is the first letter of each word, up to two. Digits are not letters. */
export function stampMark(value: StampValue): string {
  const text = stampCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the name is a cipher. Approved or verified is wax. Pending or review is a queue.
 * Rejected is a gate. A blank status is a hall. Any other status is a vault.
 * A digit wins over the status.
 */
export function stampLane(value: StampValue): StampLane {
  const found = stampParts(value);
  if (!found.ok || !found.name) return "";
  if (/\d/.test(found.name)) return "cipher";
  if (!found.state) return "hall";
  if (found.state === "APPROVED" || found.state === "VERIFIED") return "wax";
  if (found.state === "PENDING" || found.state === "REVIEW") return "queue";
  if (found.state === "REJECTED") return "gate";
  return "vault";
}

/**
 * A blank document type is haze. Passport and id are gilt. Address and utility are linen.
 * Selfie and photo are pale. Any other type is ash.
 */
export function stampTone(value: StampValue): StampTone {
  const found = stampParts(value);
  if (!found.ok || !found.name) return "";
  if (!found.kind) return "haze";
  if (found.kind === "PASSPORT" || found.kind === "ID") return "gilt";
  if (found.kind === "ADDRESS" || found.kind === "UTILITY") return "linen";
  if (found.kind === "SELFIE" || found.kind === "PHOTO") return "pale";
  return "ash";
}

export function joinedStamp(value: StampValue): boolean {
  return stampCopy(value).includes("/");
}

export function joinedStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => joinedStamp(row.note)).length;
}

export function wideStamp(value: StampValue): boolean {
  return stampCopy(value).length >= 12;
}

export function giltStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampTone(row.note) === "gilt").length;
}

export function hallStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampLane(row.note) === "hall").length;
}

export function queueStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampLane(row.note) === "queue").length;
}

export function gateStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampLane(row.note) === "gate").length;
}

export function waxStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampLane(row.note) === "wax").length;
}

export function vaultStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampLane(row.note) === "vault").length;
}

export function cipherStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampLane(row.note) === "cipher").length;
}

export function sharedStampCount(rows: readonly StampRow[]): number {
  const marks = rows.map((row) => stampMark(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(stampMark(row.note))).length;
}

export function stampLanes(rows: readonly StampRow[]): StampLaneLine[] {
  const lanes = ["hall", "wax", "queue", "gate", "vault", "cipher"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => stampLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts earlier. */
export function leadingStamp(rows: readonly StampRow[]): string {
  const lines = stampLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || a.lane.localeCompare(b.lane))[0].lane;
}

export function leadingStampTone(rows: readonly StampRow[]): string {
  const tones = ["gilt", "pale", "linen", "ash", "haze"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => stampTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || a.tone.localeCompare(b.tone))[0].tone;
}

export function stampShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words or more. */
export function stampStep(value: StampValue): 0 | 1 | 2 {
  const text = stampCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return words <= 1 ? 1 : 2;
}

export function presentStampLanes(rows: readonly StampRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = stampState(row.note);
    const lane = state === "set" ? stampLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenStamps(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "hall" || lane === "wax" || lane === "queue" || lane === "gate" || lane === "vault" || lane === "cipher" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedStamps(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleStamp(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleStampReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkStampReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleStampLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleStamps(
  rows: readonly StampRow[],
  lane: StampLane | "blank" | null,
  tone: StampTone | null,
  query: string,
  review: StampReview,
  reviewed: readonly string[],
  shape: StampShape,
): StampRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = stampState(row.note);
    if (!state) return false;
    const token = state === "set" ? stampLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && stampTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${stampCopy(row.note)} ${stampMark(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "join" && !joinedStamp(row.note)) return false;
    if (shape === "wide" && !wideStamp(row.note)) return false;
    if (shape === "hall" && stampLane(row.note) !== "hall") return false;
    if (shape === "cipher" && stampLane(row.note) !== "cipher") return false;
    if (shape === "wax" && stampLane(row.note) !== "wax") return false;
    return true;
  });
}

export function activeStampLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeStampTone(raw: string): string {
  return raw === "gilt" || raw === "pale" || raw === "linen" || raw === "ash" || raw === "haze" || raw === "all" ? raw : "all";
}

export function stampLaneArg(filter: string): StampLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "hall" || filter === "wax" || filter === "queue" || filter === "gate" || filter === "vault" || filter === "cipher") return filter;
  return null;
}

export function stampToneArg(filter: string): StampTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "pale" || filter === "linen" || filter === "ash" || filter === "haze") return filter;
  return null;
}

export function stampsCsv(rows: readonly StampRow[]): string {
  const lines = ["lane,count"];
  for (const line of stampLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function stampRowsCsv(rows: readonly StampRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,tone,step,join,wide,hall,queue,gate,wax,vault,cipher,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = stampParts(row.note);
    if (!found.ok) continue;
    const lane = stampLane(row.note);
    lines.push([
      found.name,
      stampMark(row.note),
      lane,
      stampTone(row.note),
      String(stampStep(row.note)),
      joinedStamp(row.note) ? "1" : "0",
      wideStamp(row.note) ? "1" : "0",
      lane === "hall" ? "1" : "0",
      lane === "queue" ? "1" : "0",
      lane === "gate" ? "1" : "0",
      lane === "wax" ? "1" : "0",
      lane === "vault" ? "1" : "0",
      lane === "cipher" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
