/**
 * Dentil tiles for the finance desk, and voussoir marks already stored as type, title, and createdAt on each loaded communication.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_dentil_tile (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   mason text not null default '',
 *   bay integer,
 *   finish text not null default '',
 *   tempo text not null default '',
 *   wick integer,
 *   gauge integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_voussoir_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_voussoir_review (
 *   communication_id text primary key
 * );
 */

export const DNT_KEY = "crmv4-dentil-tile";
export const DNT_VIEW_KEY = "crmv4-dentil-views";
export const DNT_DENSITY_KEY = "crmv4-dentil-density";
export const VOUS_KEY = "crmv4-voussoir-hide";
export const VOUS_REVIEW_KEY = "crmv4-voussoir-review";

export type PigmentName = "blank" | "slate" | "ivory" | "honey";

export type CadenceName = "blank" | "still" | "walk" | "rush";

export type CardTray = "open" | "held" | "archived";

export type SpanPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type CardDensity = "airy" | "tight";

export type CardSort = "span" | "keeper";

export type FriezeCard = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  span: number | null;
  pigment: string;
  cadence: string;
  bell: number | null;
  weight: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  proof: boolean;
  audit: string;
};

export type CardView = {
  id: string;
  name: string;
  tray: CardTray;
  query: string;
  keeper: string;
  pigment: string;
  cadence: string;
  span: string;
  bell: string;
  weight: string;
};

export type CardCounts = {
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
  proof: number;
  cooling: number;
};

export type QuoinLane = "" | "crown" | "springer" | "haunch";

export type QuoinTone = "" | "dawn" | "noon" | "dusk" | "hush" | "mist";

export type QuoinState = "" | "clear" | "set";

export type QuoinShape = "all" | "course" | "wide" | "open" | "shut";

export type QuoinReview = "all" | "reviewed" | "fresh";

export type QuoinValue = string | { type?: unknown; title?: unknown; createdAt?: unknown; [key: string]: unknown } | null | undefined;

export type QuoinRow = { id: string; label: string; note: QuoinValue };

export type QuoinLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "cadence", "pin", "unpin", "hold", "resume", "archive", "open", "pigment", "tag", "weight", "bell", "proof"] as const;

const PIGMENTS = ["slate", "ivory", "honey"] as const;

const CADENCES = ["still", "walk", "rush"] as const;

const CADENCE_CYCLE = ["still", "walk", "rush"] as const;

const PEAK_SPANS = new Set([2, 4]);

const QUIET_SPANS = new Set([5]);

const HOUSE = new Set(["SLATE", "HONEY"]);

const HOUSE_TYPES = new Set(["NOTE", "CHAT"]);

const MONEY_KEYS = ["profit", "volume", "amount", "currency", "balance"];

const CARD_CAP = 6;

const VIEW_CAP = 3;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CardTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function pigmentName(raw: unknown): Exclude<PigmentName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (PIGMENTS as readonly string[]).includes(text) ? (text as Exclude<PigmentName, "blank">) : "";
}

function cadenceName(raw: unknown): Exclude<CadenceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CADENCES as readonly string[]).includes(text) ? (text as Exclude<CadenceName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[xyz]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: FriezeCard, tray: CardTray): boolean {
  if (tray === "held") return card.held && !card.archived;
  if (tray === "archived") return card.archived;
  return !card.held && !card.archived;
}

/** A blank title is left out. The saved title stays short. */
export function cardLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function cardNote(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A finish is SLATE, IVORY, or HONEY. Anything else stays blank. Letters are stored in capitals. */
export function pigmentOf(raw: unknown): string {
  const name = pigmentName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bay is an integer from 1 through 5.
 * A blank value stays unset. 0 is not a bay.
 * A second digit is not a bay.
 */
export function spanOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 5) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-5]$/.test(text)) return null;
  return Number(text);
}

/** A wick is 4, 12, or 24. A blank value stays unset. A leading zero is not a wick. */
export function bellOf(raw: unknown): 4 | 12 | 24 | null {
  if (raw === 4 || raw === "4") return 4;
  if (raw === 12 || raw === "12") return 12;
  if (raw === 24 || raw === "24") return 24;
  return null;
}

/** Gauge is 1, 3, or 5. Anything else is not a gauge. 1 is the resting gauge. */
export function weightOf(raw: unknown): 1 | 3 | 5 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 5 || raw === "5") return 5;
  return null;
}

export function spanBand(span: unknown): "blank" | "early" | "mid" | "late" {
  const value = spanOf(span);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
}

/** Peak bays are 2 and 4. An unset bay is not a peak bay. */
export function peakSpan(span: unknown): boolean {
  const value = spanOf(span);
  return value !== null && PEAK_SPANS.has(value);
}

/** The quiet bay is 5. A peak bay is not quiet. An unset bay is not quiet. */
export function quietSpan(span: unknown): boolean {
  const value = spanOf(span);
  return value !== null && QUIET_SPANS.has(value);
}

/**
 * How far a span sits behind the desk span.
 * A positive gap means the card is behind. A negative gap means it is ahead.
 * A gap of zero means the same span. An unset span has no gap. Spans do not wrap.
 */
export function spanGap(span: unknown, desk: unknown): number | null {
  const from = spanOf(span);
  const at = spanOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** SLATE and HONEY are house finishes. IVORY is a guest finish. A blank finish is not a house finish. */
export function housePigment(pigment: unknown): boolean {
  return HOUSE.has(pigmentOf(pigment));
}

export function densityOf(raw: unknown): CardDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function sortMode(raw: unknown): CardSort {
  return raw === "keeper" ? "keeper" : "span";
}

function readOne(raw: unknown): FriezeCard | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = cardLine(row.title);
  if (!id || !title) return null;
  const weight = weightOf(row.weight);
  return {
    id,
    title,
    note: cardNote(row.note),
    keeper: keeperLabel(row.keeper),
    span: spanOf(row.span),
    pigment: pigmentOf(row.pigment),
    cadence: cadenceName(row.cadence),
    bell: bellOf(row.bell),
    weight: weight === null ? 1 : weight,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    proof: row.proof === true,
    audit: auditCode(row.audit),
  };
}

export function readCards(raw: unknown): FriezeCard[] {
  if (!Array.isArray(raw)) return [];
  const out: FriezeCard[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, CARD_CAP);
}

export function addCard(
  cards: readonly FriezeCard[],
  card: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    span?: unknown;
    pigment?: string;
    cadence?: string;
    bell?: unknown;
    weight?: unknown;
    tags?: unknown;
  },
): FriezeCard[] {
  const current = readCards(cards);
  const id = String(card.id || "").trim();
  const title = cardLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const weight = weightOf(card.weight);
  const next: FriezeCard = {
    id,
    title,
    note: cardNote(card.note),
    keeper: keeperLabel(card.keeper),
    span: spanOf(card.span),
    pigment: pigmentOf(card.pigment),
    cadence: cadenceName(card.cadence),
    bell: bellOf(card.bell),
    weight: weight === null ? 1 : weight,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    archived: false,
    proof: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

/** A blank tempo becomes still, still becomes walk, walk becomes rush, and rush returns to still. */
export function cycleCadence(cards: readonly FriezeCard[], id: string): FriezeCard[] {
  return readCards(cards).map((card) => {
    if (card.id !== id) return card;
    const at = CADENCE_CYCLE.indexOf(card.cadence as (typeof CADENCE_CYCLE)[number]);
    const next = at < 0 ? CADENCE_CYCLE[0] : CADENCE_CYCLE[(at + 1) % CADENCE_CYCLE.length];
    if (!next || next === card.cadence) return card;
    return { ...card, cadence: next, audit: "cadence" };
  });
}

/** A blank title is left as it is. */
export function editCard(cards: readonly FriezeCard[], id: string, title: unknown): FriezeCard[] {
  const next = cardLine(title);
  if (!next) return readCards(cards);
  const current = readCards(cards);
  if (current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

export function editCardNote(cards: readonly FriezeCard[], id: string, note: unknown): FriezeCard[] {
  const next = cardNote(note);
  return readCards(cards).map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "note" } : card));
}

export function addCardTag(cards: readonly FriezeCard[], id: string, tag: unknown): FriezeCard[] {
  const next = tagsOf(tag);
  if (!next.length) return readCards(cards);
  return readCards(cards).map((card) => {
    if (card.id !== id) return card;
    const tags = tagsOf([...card.tags, ...next]);
    if (tags.join() === card.tags.join()) return card;
    return { ...card, tags, audit: "tag" };
  });
}

export function setCardWeight(cards: readonly FriezeCard[], id: string, weight: unknown): FriezeCard[] {
  const next = weightOf(weight);
  if (next === null) return readCards(cards);
  return readCards(cards).map((card) => (card.id === id && card.weight !== next ? { ...card, weight: next, audit: "weight" } : card));
}

/** Snooze lengthens the wick from blank to 4, from 4 to 12, and from 12 to 24. 24 stays. */
export function snoozeCard(cards: readonly FriezeCard[], id: string): FriezeCard[] {
  return readCards(cards).map((card) => {
    if (card.id !== id) return card;
    const next = card.bell === null ? 4 : card.bell === 4 ? 12 : card.bell === 12 ? 24 : null;
    if (next === null) return card;
    return { ...card, bell: next, audit: "bell" };
  });
}

export function setCardPin(cards: readonly FriezeCard[], id: string, pinned: boolean): FriezeCard[] {
  return readCards(cards).map((card) => (card.id === id && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function pinFocused(cards: readonly FriezeCard[], shownIds: readonly string[], index: number): FriezeCard[] {
  const id = shownIds[index];
  if (!id) return readCards(cards);
  const card = readCards(cards).find((item) => item.id === id);
  if (!card) return readCards(cards);
  return setCardPin(cards, id, !card.pinned);
}

export function snoozeFocused(cards: readonly FriezeCard[], shownIds: readonly string[], index: number): FriezeCard[] {
  const id = shownIds[index];
  return id ? snoozeCard(cards, id) : readCards(cards);
}

export function holdFocused(cards: readonly FriezeCard[], shownIds: readonly string[], index: number): FriezeCard[] {
  const id = shownIds[index];
  if (!id) return readCards(cards);
  const card = readCards(cards).find((item) => item.id === id);
  if (!card || card.archived) return readCards(cards);
  return setCardHold(cards, id, !card.held);
}

export function cadenceFocused(cards: readonly FriezeCard[], shownIds: readonly string[], index: number): FriezeCard[] {
  const id = shownIds[index];
  return id ? cycleCadence(cards, id) : readCards(cards);
}

export function proofFocused(cards: readonly FriezeCard[], shownIds: readonly string[], index: number): FriezeCard[] {
  const id = shownIds[index];
  if (!id) return readCards(cards);
  const card = readCards(cards).find((item) => item.id === id);
  if (!card) return readCards(cards);
  return setCardProof(cards, id, !card.proof);
}

export function setCardHold(cards: readonly FriezeCard[], id: string, held: boolean): FriezeCard[] {
  return readCards(cards).map((card) => (card.id === id && !card.archived && card.held !== held ? { ...card, held, audit: held ? "hold" : "resume" } : card));
}

export function setCardArchive(cards: readonly FriezeCard[], id: string, archived: boolean): FriezeCard[] {
  return readCards(cards).map((card) => (card.id === id && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function setCardProof(cards: readonly FriezeCard[], id: string, proof: boolean): FriezeCard[] {
  return readCards(cards).map((card) => (card.id === id && card.proof !== proof ? { ...card, proof, audit: "proof" } : card));
}

export function bulkCardPigment(cards: readonly FriezeCard[], ids: readonly string[], pigment: unknown): FriezeCard[] {
  const next = pigmentOf(pigment);
  if (!next) return readCards(cards);
  const want = new Set(ids);
  return readCards(cards).map((card) => (want.has(card.id) && card.pigment !== next ? { ...card, pigment: next, audit: "pigment" } : card));
}

export function bulkCardPin(cards: readonly FriezeCard[], ids: readonly string[], pinned: boolean): FriezeCard[] {
  const want = new Set(ids);
  return readCards(cards).map((card) => (want.has(card.id) && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkCardArchive(cards: readonly FriezeCard[], ids: readonly string[], archived: boolean): FriezeCard[] {
  const want = new Set(ids);
  return readCards(cards).map((card) => (want.has(card.id) && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function bulkCardCadence(cards: readonly FriezeCard[], ids: readonly string[], cadence: unknown): FriezeCard[] {
  const next = cadenceName(cadence);
  if (!next) return readCards(cards);
  const want = new Set(ids);
  return readCards(cards).map((card) => (want.has(card.id) && card.cadence !== next ? { ...card, cadence: next, audit: "cadence" } : card));
}

export function bulkCardTag(cards: readonly FriezeCard[], ids: readonly string[], tag: unknown): FriezeCard[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addCardTag(rows, id, tag) : rows), readCards(cards));
}

export function resetCards(): FriezeCard[] {
  return [];
}

/** An open tile whose bay sits more than two bays behind the desk. A raised gauge, a hold, or an archive is not late. */
export function lateCard(card: FriezeCard, desk: unknown): boolean {
  const gap = spanGap(card.span, desk);
  return inTray(card, "open") && card.weight === 1 && gap !== null && gap > 2;
}

/** An open tile with a wick of 4 is due now. A raised gauge, a hold, or an archive is not. */
export function soonCard(card: FriezeCard): boolean {
  return inTray(card, "open") && card.weight === 1 && card.bell === 4;
}

/** An open resting tile on a rush tempo whose bay is 1. That short rush is cooling. */
export function coolingCard(card: FriezeCard): boolean {
  return inTray(card, "open") && card.weight === 1 && card.cadence === "rush" && card.span === 1;
}

/** Open tiles that are late or due now. A raised tile stays off the reminder list. */
export function reminderCards(cards: readonly FriezeCard[], desk: unknown): FriezeCard[] {
  return readCards(cards).filter((card) => lateCard(card, desk) || soonCard(card));
}

export function coolingCards(cards: readonly FriezeCard[]): FriezeCard[] {
  return readCards(cards).filter((card) => coolingCard(card));
}

/** Open tiles whose bay sits within two bays of the desk. A raised gauge, a hold, or an archive stays out. */
export function windowCards(cards: readonly FriezeCard[], desk: unknown): FriezeCard[] {
  return readCards(cards).filter((card) => {
    const gap = spanGap(card.span, desk);
    return inTray(card, "open") && card.weight === 1 && gap !== null && gap >= -2 && gap <= 2;
  });
}

export function matchedCards(cards: readonly FriezeCard[], desk: unknown): number {
  const at = spanOf(desk);
  if (at === null) return 0;
  return readCards(cards).filter((card) => inTray(card, "open") && card.weight === 1 && card.span === at).length;
}

function spanHit(span: number | null, exact: number | null, pick: SpanPick | null): boolean {
  if (exact !== null) return span === exact;
  if (pick === null) return true;
  if (pick === "blank") return span === null;
  if (pick === "peak") return peakSpan(span);
  if (pick === "quiet") return quietSpan(span);
  return spanBand(span) === pick;
}

/** Search matches the title, the note, the keeper, and the tags. */
export function visibleCards(
  cards: readonly FriezeCard[],
  tray: CardTray,
  query: string,
  keeper: string | null,
  pigment: string | null,
  cadence: string | null,
  exact: number | null,
  pick: SpanPick | null,
  bell: number | "blank" | null,
  weight: number | "blank" | null,
  surgeOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): FriezeCard[] {
  const text = query.trim().toLowerCase();
  return readCards(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text) {
      const hay = `${card.title} ${card.note} ${card.keeper} ${card.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (keeper !== null && card.keeper !== keeper) return false;
    if (pigment === "blank" ? Boolean(card.pigment) : pigment && card.pigment !== pigment) return false;
    if (cadence === "blank" ? Boolean(card.cadence) : cadence && card.cadence !== cadence) return false;
    if (!spanHit(card.span, exact, pick)) return false;
    if (bell === "blank" ? card.bell !== null : bell !== null && card.bell !== bell) return false;
    if (weight === "blank" ? card.weight !== 1 : weight !== null && card.weight !== weight) return false;
    if (surgeOnly && card.cadence !== "rush") return false;
    if (peakOnly && !peakSpan(card.span)) return false;
    if (houseOnly && !housePigment(card.pigment)) return false;
    if (quietOnly && !quietSpan(card.span)) return false;
    if (restingOnly && card.weight !== 1) return false;
    return true;
  });
}

export function sortCards(cards: readonly FriezeCard[], mode: CardSort): FriezeCard[] {
  const rows = cards.slice();
  if (mode === "keeper") return rows.sort((a, b) => a.keeper.localeCompare(b.keeper) || (a.span ?? 99) - (b.span ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.span ?? 99) - (b.span ?? 99) || a.title.localeCompare(b.title));
}

export function cardLedger(cards: readonly FriezeCard[], query: string): FriezeCard[] {
  const text = query.trim().toLowerCase();
  return sortCards(
    readCards(cards).filter((card) => card.span !== null && (!text || card.title.toLowerCase().includes(text))),
    "span",
  );
}

export function cardCounts(cards: readonly FriezeCard[], desk: unknown): CardCounts {
  const rows = readCards(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    archived: rows.filter((card) => inTray(card, "archived")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => inTray(card, "open") && card.weight === 1 && peakSpan(card.span)).length,
    late: rows.filter((card) => lateCard(card, desk)).length,
    soon: rows.filter((card) => soonCard(card)).length,
    weight: rows.filter((card) => inTray(card, "open") && card.weight > 1).length,
    house: rows.filter((card) => inTray(card, "open") && housePigment(card.pigment)).length,
    window: windowCards(rows, desk).length,
    matched: matchedCards(rows, desk),
    proof: rows.filter((card) => card.proof).length,
    cooling: rows.filter((card) => coolingCard(card)).length,
  };
}

export function cardShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open cards as a share of every open card. */
export function lateShare(cards: readonly FriezeCard[], desk: unknown): number {
  const rows = readCards(cards).filter((card) => inTray(card, "open"));
  return cardShare(rows.filter((card) => lateCard(card, desk)).length, rows.length);
}

export function usedSpans(cards: readonly FriezeCard[]): number {
  return new Set(readCards(cards).filter((card) => inTray(card, "open") && card.span !== null).map((card) => card.span)).size;
}

/** Open cards that share a span. */
export function clashSpanCount(cards: readonly FriezeCard[]): number {
  const open = readCards(cards).filter((card) => inTray(card, "open") && card.span !== null);
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

/** Open cards that share a bell. */
export function bellClashCount(cards: readonly FriezeCard[]): number {
  const open = readCards(cards).filter((card) => inTray(card, "open") && card.bell !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].bell === open[j].bell) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open tiles whose bays sit exactly two bays apart. */
export function adjacentCardCount(cards: readonly FriezeCard[]): number {
  const open = readCards(cards).filter((card) => inTray(card, "open") && card.span !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].span || 0) - (open[j].span || 0)) === 2) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The finish with the fewest open tiles.
 * A tie keeps SLATE, then HONEY, then IVORY.
 * An empty desk still suggests SLATE.
 */
export function suggestPigment(cards: readonly FriezeCard[]): "SLATE" | "HONEY" | "IVORY" {
  const rows = readCards(cards).filter((card) => inTray(card, "open"));
  const order = ["SLATE", "HONEY", "IVORY"] as const;
  let best: "SLATE" | "HONEY" | "IVORY" = "SLATE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const pigment of order) {
    const count = rows.filter((card) => card.pigment === pigment).length;
    if (count < bestCount) {
      best = pigment;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The wick with the fewest open tiles.
 * A tie keeps 12, then 4, then 24.
 * An empty desk still suggests 12.
 */
export function suggestBell(cards: readonly FriezeCard[]): 4 | 12 | 24 {
  const rows = readCards(cards).filter((card) => inTray(card, "open"));
  const order = [12, 4, 24] as const;
  let best: 4 | 12 | 24 = 12;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const bell of order) {
    const count = rows.filter((card) => card.bell === bell).length;
    if (count < bestCount) {
      best = bell;
      bestCount = count;
    }
  }
  return best;
}

/** The newest keeper already written on a card. A blank keeper is skipped. */
export function suggestKeeper(cards: readonly FriezeCard[]): string {
  const found = readCards(cards).find((card) => card.keeper);
  return found ? found.keeper : "";
}

/**
 * The mason carrying the fewest open tiles.
 * A tie keeps the earlier name on the roster. A blank mason is not a load.
 * An empty roster falls back to the newest mason.
 */
export function fairKeeper(cards: readonly FriezeCard[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = keeperLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestKeeper(cards);
  const open = readCards(cards).filter((card) => inTray(card, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.keeper === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The keeper with the most open cards. A tie keeps the name that sorts later. */
export function busiestKeeper(cards: readonly FriezeCard[]): string {
  const rows = readCards(cards).filter((card) => inTray(card, "open") && card.keeper);
  const names: string[] = [];
  for (const card of rows) if (!names.includes(card.keeper)) names.push(card.keeper);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((card) => card.keeper === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function cardKeepers(cards: readonly FriezeCard[]): string[] {
  const out: string[] = [];
  for (const card of readCards(cards)) {
    if (card.keeper && !out.includes(card.keeper)) out.push(card.keeper);
  }
  return out;
}

export function cardPigments(cards: readonly FriezeCard[]): string[] {
  const out: string[] = [];
  for (const card of readCards(cards)) {
    if (card.pigment && !out.includes(card.pigment)) out.push(card.pigment);
  }
  return out;
}

/** Open cards whose keeper also watches another open card on a different span. */
export function pairKeeperCount(cards: readonly FriezeCard[]): number {
  const open = readCards(cards).filter((card) => inTray(card, "open") && card.keeper && card.span !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].keeper === open[j].keeper && open[i].span !== open[j].span) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open cards that share a pigment on different spans. */
export function sharedPigmentCount(cards: readonly FriezeCard[]): number {
  const open = readCards(cards).filter((card) => inTray(card, "open") && card.pigment && card.span !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].pigment === open[j].pigment && open[i].span !== open[j].span) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The gauge of open tiles. The resting gauge of 1 still counts. */
export function weightLoad(cards: readonly FriezeCard[]): number {
  return readCards(cards).filter((card) => inTray(card, "open")).reduce((sum, card) => sum + card.weight, 0);
}

/** Open cards that are both the quiet span and a house pigment. */
export function quietGalleryCount(cards: readonly FriezeCard[]): number {
  return readCards(cards).filter((card) => inTray(card, "open") && quietSpan(card.span) && housePigment(card.pigment)).length;
}

/** Open tiles whose tempo is rush. */
export function surgeLoad(cards: readonly FriezeCard[]): number {
  return readCards(cards).filter((card) => inTray(card, "open") && card.cadence === "rush").length;
}

export function spanWidth(cards: readonly FriezeCard[]): number {
  const spans = readCards(cards).filter((card) => inTray(card, "open") && card.span !== null).map((card) => card.span as number);
  if (!spans.length) return 0;
  return Math.max(...spans) - Math.min(...spans);
}

/** The next open card whose span sits ahead of the desk. An unset desk has no next card. */
export function nextCard(cards: readonly FriezeCard[], desk: unknown): string {
  const at = spanOf(desk);
  if (at === null) return "";
  const rows = readCards(cards)
    .filter((card) => inTray(card, "open") && card.weight === 1 && card.span !== null && (card.span as number) > at)
    .sort((a, b) => (a.span || 0) - (b.span || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function cardCopy(card: FriezeCard, desk: unknown): string {
  const gap = spanGap(card.span, desk);
  return [card.title, card.keeper, card.span ?? "", card.pigment, card.cadence, card.bell ?? "", card.weight, card.tags.join(" "), card.proof ? "1" : "0", card.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The gap and the late mark use the span you pass. */
export function cardsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,mason,bay,finish,tempo,wick,gauge,tags,pinned,held,archived,seal,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readCards(raw);
  const windowIds = new Set(windowCards(rows, desk).map((card) => card.id));
  const at = spanOf(desk);
  for (const card of rows) {
    const gap = spanGap(card.span, desk);
    lines.push([
      card.title,
      card.keeper,
      card.span === null ? "" : String(card.span),
      card.pigment,
      card.cadence,
      card.bell === null ? "" : String(card.bell),
      String(card.weight),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.archived ? "1" : "0",
      card.proof ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCard(card, desk) ? "1" : "0",
      soonCard(card) ? "1" : "0",
      housePigment(card.pigment) ? "1" : "0",
      windowIds.has(card.id) ? "1" : "0",
      at !== null && card.span === at && card.weight === 1 && inTray(card, "open") ? "1" : "0",
      coolingCard(card) ? "1" : "0",
      card.note,
      card.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeKeeper(raw: string, keepers: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return keepers.includes(raw) ? raw : "all";
}

export function activePigment(raw: string, pigments: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = pigmentOf(raw);
  return name && pigments.map((item) => item.toUpperCase()).includes(name) ? name : pigments.includes(raw) ? raw : "all";
}

export function activeCadence(raw: string, cadences: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return cadences.includes(raw) ? raw : "all";
}

export function activeSpan(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return spanOf(raw) === null ? "all" : raw;
}

export function activeBell(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return bellOf(raw) === null ? "all" : raw;
}

export function activeWeight(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return weightOf(raw) === null ? "all" : raw;
}

export function keeperArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function pigmentArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return pigmentOf(filter) || null;
}

export function cadenceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return cadenceName(filter) || null;
}

export function spanArg(filter: string): { exact: number | null; pick: SpanPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: spanOf(filter), pick: null };
}

export function bellArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return bellOf(filter);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

function readView(raw: unknown): CardView | null {
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
    keeper: clip(row.keeper, 18),
    pigment: clip(row.pigment, 12),
    cadence: clip(row.cadence, 8),
    span: clip(row.span, 8),
    bell: clip(row.bell, 8),
    weight: clip(row.weight, 8),
  };
}

export function readCardViews(raw: unknown): CardView[] {
  if (!Array.isArray(raw)) return [];
  const out: CardView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addCardView(views: readonly CardView[], view: CardView): CardView[] {
  const current = readCardViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropCardView(views: readonly CardView[], id: string): CardView[] {
  return readCardViews(views).filter((view) => view.id !== id);
}

function titleBody(raw: unknown): string {
  return clip(raw, 40);
}

function typeBody(raw: unknown): string {
  return clip(raw, 8).toUpperCase();
}

function dayClock(raw: unknown): number | null {
  if (typeof raw !== "string" || !raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCDay();
}

function quoinParts(value: QuoinValue): { type: string; title: string; day: number | null; ok: boolean } {
  if (typeof value === "string") return { type: "", title: titleBody(value), day: null, ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { type: "", title: "", day: null, ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { type: "", title: "", day: null, ok: false };
  if (!("type" in value) && !("title" in value) && !("createdAt" in value)) return { type: "", title: "", day: null, ok: false };
  const kind = "type" in value ? value.type : "";
  const title = "title" in value ? value.title : "";
  const createdAt = "createdAt" in value ? value.createdAt : "";
  if ((kind != null && typeof kind !== "string") || (title != null && typeof title !== "string") || (createdAt != null && typeof createdAt !== "string")) {
    return { type: "", title: "", day: null, ok: false };
  }
  return { type: typeBody(kind), title: titleBody(title), day: dayClock(createdAt), ok: true };
}

export function quoinState(value: QuoinValue): QuoinState {
  const found = quoinParts(value);
  if (!found.ok) return "";
  return found.title || found.type ? "set" : "clear";
}

export function quoinCopy(value: QuoinValue): string {
  const found = quoinParts(value);
  return found.ok ? found.title : "";
}

/** The mark is the first three letters of the title. */
export function markOf(value: QuoinValue): string {
  const text = quoinCopy(value).replace(/\s+/g, "").toUpperCase();
  return text ? text.slice(0, 3) : "";
}

/**
 * CALL is the crown. NOTE is the springer. CHAT is the haunch.
 * A title with a question mark is the crown. A title that ends with an exclamation is the springer.
 * A title with a colon is the haunch. Any other title is the springer.
 */
export function quoinLane(value: QuoinValue): QuoinLane {
  const found = quoinParts(value);
  if (!found.ok || (!found.title && !found.type)) return "";
  if (found.type === "CALL") return "crown";
  if (found.type === "NOTE") return "springer";
  if (found.type === "CHAT") return "haunch";
  if (found.title.includes("?")) return "crown";
  if (found.title.endsWith("!")) return "springer";
  if (found.title.includes(":")) return "haunch";
  return found.title ? "springer" : "";
}

/** Sunday and Monday are dawn. Tuesday and Wednesday are noon. Thursday through Saturday are dusk. A known house type with no day is hush. Any other type is mist. */
export function quoinTone(value: QuoinValue): QuoinTone {
  const found = quoinParts(value);
  if (!found.ok || (!found.title && !found.type)) return "";
  if (found.day !== null) {
    if (found.day === 0 || found.day === 1) return "dawn";
    if (found.day === 2 || found.day === 3) return "noon";
    return "dusk";
  }
  if (found.type && !HOUSE_TYPES.has(found.type)) return "mist";
  return "hush";
}

export function coursedQuoin(value: QuoinValue): boolean {
  const found = quoinParts(value);
  return found.ok && HOUSE_TYPES.has(found.type);
}

export function coursedQuoinCount(rows: readonly QuoinRow[]): number {
  return rows.filter((row) => coursedQuoin(row.note)).length;
}

export function wideQuoin(value: QuoinValue): boolean {
  return quoinCopy(value).length >= 10;
}

export function wideQuoinCount(rows: readonly QuoinRow[]): number {
  return rows.filter((row) => wideQuoin(row.note)).length;
}

export function stoneQuoinCount(rows: readonly QuoinRow[]): number {
  return rows.filter((row) => quoinTone(row.note) === "dawn").length;
}

export function openQuoinCount(rows: readonly QuoinRow[]): number {
  return rows.filter((row) => {
    const found = quoinParts(row.note);
    return found.ok && found.type === "NOTE";
  }).length;
}

export function shutQuoinCount(rows: readonly QuoinRow[]): number {
  return rows.filter((row) => {
    const found = quoinParts(row.note);
    return found.ok && found.type === "CHAT";
  }).length;
}

export function sharedMarkCount(rows: readonly QuoinRow[]): number {
  const marks = rows.map((row) => markOf(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(markOf(row.note))).length;
}

export function quoinLanes(rows: readonly QuoinRow[]): QuoinLaneLine[] {
  const lanes = ["crown", "springer", "haunch"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => quoinLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingQuoin(rows: readonly QuoinRow[]): string {
  const lines = quoinLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingQuoinTone(rows: readonly QuoinRow[]): string {
  const tones = ["dawn", "noon", "dusk", "hush", "mist"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => quoinTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function quoinShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function quoinStep(value: QuoinValue): 0 | 1 | 2 | 3 {
  const text = quoinCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words <= 3) return 2;
  return 3;
}

export function presentLanes(rows: readonly QuoinRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = quoinState(row.note);
    const lane = state === "set" ? quoinLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenLanes(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "crown" || lane === "springer" || lane === "haunch" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedQuoins(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleQuoin(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleQuoinReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkQuoinReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleQuoinLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleQuoins(
  rows: readonly QuoinRow[],
  lane: QuoinLane | "blank" | null,
  tone: QuoinTone | null,
  query: string,
  review: QuoinReview,
  reviewed: readonly string[],
  shape: QuoinShape,
): QuoinRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = quoinState(row.note);
    if (!state) return false;
    const token = state === "set" ? quoinLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && quoinTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${quoinCopy(row.note)} ${markOf(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "course" && !coursedQuoin(row.note)) return false;
    if (shape === "wide" && !wideQuoin(row.note)) return false;
    if (shape === "open" && quoinParts(row.note).type !== "NOTE") return false;
    if (shape === "shut" && quoinParts(row.note).type !== "CHAT") return false;
    return true;
  });
}

export function activeQuoinLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeQuoinTone(raw: string): string {
  return raw === "dawn" || raw === "noon" || raw === "dusk" || raw === "hush" || raw === "mist" || raw === "all" ? raw : "all";
}

export function quoinLaneArg(filter: string): QuoinLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "crown" || filter === "springer" || filter === "haunch") return filter;
  return null;
}

export function quoinToneArg(filter: string): QuoinTone | null {
  if (filter === "all") return null;
  if (filter === "dawn" || filter === "noon" || filter === "dusk" || filter === "hush" || filter === "mist") return filter;
  return null;
}

export function quoinsCsv(rows: readonly QuoinRow[]): string {
  const lines = ["lane,count"];
  for (const line of quoinLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function quoinRowsCsv(rows: readonly QuoinRow[], reviewed: readonly string[]): string {
  const lines = ["title,mark,lane,tone,step,course,wide,open,shut,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = quoinParts(row.note);
    if (!found.ok) continue;
    lines.push([
      found.title,
      markOf(row.note),
      quoinLane(row.note),
      quoinTone(row.note),
      String(quoinStep(row.note)),
      coursedQuoin(row.note) ? "1" : "0",
      wideQuoin(row.note) ? "1" : "0",
      found.type === "NOTE" ? "1" : "0",
      found.type === "CHAT" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
