/**
 * Local orchard ladders for the follow-up desk, and the presence country already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_orchard_ladder (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   picker text not null default '',
 *   rung integer,
 *   gait text not null default '',
 *   row text not null default '',
 *   tint text not null default '',
 *   pitch integer,
 *   hold integer,
 *   pinned boolean not null default false,
 *   climbed boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_country_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_country_review (
 *   customer_id text primary key
 * );
 */

export const LADDER_KEY = "crmv4-orchard-ladders";
export const LADDER_VIEW_KEY = "crmv4-orchard-views";
export const MARK_KEY = "crmv4-country-hide";
export const MARK_REVIEW_KEY = "crmv4-country-review";

export type LadderTint = "blank" | "dew" | "amber" | "garnet";

export type LadderGait = "blank" | "step" | "climb" | "reach";

export type LadderTray = "open" | "climbed" | "filed";

export type LadderPick = "blank" | "low" | "mid" | "high" | "end" | "body";

export type Ladder = {
  id: string;
  title: string;
  note: string;
  picker: string;
  rung: number | null;
  gait: string;
  row: string;
  tint: string;
  pitch: number | null;
  hold: number | null;
  pinned: boolean;
  climbed: boolean;
  filed: boolean;
  audit: string;
};

export type LadderView = {
  id: string;
  name: string;
  tray: LadderTray;
  query: string;
  picker: string;
  gait: string;
  row: string;
  tint: string;
  rung: string;
  pitch: string;
  hold: string;
};

export type LadderCounts = {
  open: number;
  climbed: number;
  filed: number;
  pinned: number;
  end: number;
  late: number;
};

export type MarkState = "" | "set" | "clear";

export type MarkBand = "" | "mote" | "pair" | "span" | "name";

export type MarkDepth = "" | "near" | "mid" | "far";

export type MarkShape = "all" | "pair" | "odd";

export type MarkValue =
  | {
      lastCountry?: unknown;
      failedLoginCount?: unknown;
      loginBlockedAt?: unknown;
      loginBlockedMessage?: unknown;
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
      withdrawalsEnabled?: unknown;
      isTest?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      country?: unknown;
      desk?: unknown;
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
      city?: unknown;
      address?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type MarkRow = { id?: string; note?: MarkValue; label?: string | null };

export type MarkBandLine = { band: string; count: number };

export type MarkDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "tint", "pin", "unpin", "climb", "ground", "file", "reopen", "move"] as const;

const GAITS = ["step", "climb", "reach"] as const;

const TINTS = ["dew", "amber", "garnet"] as const;

const TINT_ORDER = ["", "dew", "amber", "garnet"] as const;

const PICKS = ["blank", "low", "mid", "high", "end", "body"] as const;

const ENDS = new Set([1, 9]);

const PITCHES = [1, 2, 3, 4, 5] as const;

const HOLDS = [6, 12, 18, 24] as const;

const MARK_BANDS = ["mote", "pair", "span", "name"] as const;

const DEPTHS = ["near", "mid", "far"] as const;

const STATES = ["set", "clear"] as const;

const MARK_BLOCK = [
  "failedLoginCount",
  "loginBlockedAt",
  "loginBlockedMessage",
  "loginEnabled",
  "tradingEnabled",
  "withdrawalsEnabled",
  "isTest",
  "name",
  "email",
  "phone",
  "country",
  "desk",
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
  "city",
  "address",
] as const;

const LADDER_CAP = 9;

const VIEW_CAP = 6;

const CODE_CAP = 24;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LadderTray {
  return raw === "climbed" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function gaitName(raw: unknown): Exclude<LadderGait, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GAITS as readonly string[]).includes(text) ? (text as Exclude<LadderGait, "blank">) : "";
}

function tintName(raw: unknown): Exclude<LadderTint, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TINTS as readonly string[]).includes(text) ? (text as Exclude<LadderTint, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function ladderLine(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank note stays blank. It is not filled in. */
export function ladderNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank picker stays blank. It is not filled in. */
export function pickerLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank row stays blank. It is not filled in. */
export function ladderRow(raw: unknown): string {
  return clip(raw, 6);
}

/**
 * A rung is an integer from 1 through 9.
 * A blank value stays unset. 0 and 10 are not rungs.
 * A leading zero is the same rung: 01 is 1, and 09 is 9.
 */
export function rungOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 9) return raw;
  if (typeof raw === "string" && /^(?:[1-9]|0[1-9])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A pitch is an integer from 1 through 5.
 * A blank value stays unset. 0 and 6 are not pitches.
 * A leading zero is the same pitch: 01 is 1.
 */
export function pitchOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && (PITCHES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:[1-5]|0[1-5])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A hold is 6, 12, 18, or 24 minutes. A blank value stays unset. A leading zero is not a hold. */
export function holdOf(raw: unknown): number | null {
  if (typeof raw === "number" && (HOLDS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:6|12|18|24)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Step, climb, reach, or blank. Anything else is blank. */
export function gaitOf(raw: unknown): LadderGait {
  return gaitName(raw) || "blank";
}

/** Dew, amber, garnet, or blank. Anything else is blank. */
export function tintOf(raw: unknown): LadderTint {
  return tintName(raw) || "blank";
}

/** Low is 1–3. Mid is 4–6. High is 7–9. An unset rung is blank. */
export function rungBand(rung: unknown): "blank" | "low" | "mid" | "high" {
  const value = rungOf(rung);
  if (value === null) return "blank";
  if (value <= 3) return "low";
  if (value <= 6) return "mid";
  return "high";
}

/** End rungs are 1 and 9. An unset rung is not an end. */
export function endRung(rung: unknown): boolean {
  const value = rungOf(rung);
  return value !== null && ENDS.has(value);
}

/** Body rungs are 2 through 8. An unset rung is not body. */
export function bodyRung(rung: unknown): boolean {
  const value = rungOf(rung);
  return value !== null && !ENDS.has(value);
}

/**
 * The shortest signed step from the saved rung to the typed rung.
 * The orchard wraps at 9. A step of 4 stays. A step of -4 stays.
 * A positive step means the typed rung is ahead of the climb.
 */
export function rungGap(rung: unknown, desk: unknown): number | null {
  const from = rungOf(rung);
  const at = rungOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 4) diff -= 9;
  if (diff < -4) diff += 9;
  return diff;
}

export function readLadders(raw: unknown): Ladder[] {
  if (!Array.isArray(raw)) return [];
  const out: Ladder[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Ladder>;
    const id = String(row.id || "").trim();
    const title = ladderLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: ladderNote(row.note),
      picker: pickerLabel(row.picker),
      rung: rungOf(row.rung),
      gait: gaitName(row.gait),
      row: ladderRow(row.row),
      tint: tintName(row.tint),
      pitch: pitchOf(row.pitch),
      hold: holdOf(row.hold),
      pinned: row.pinned === true,
      climbed: row.climbed === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, LADDER_CAP);
}

export function addLadder(
  cards: readonly Ladder[],
  card: {
    id: string;
    title: string;
    note?: string;
    picker?: string;
    rung?: unknown;
    gait?: string;
    row?: string;
    tint?: string;
    pitch?: unknown;
    hold?: unknown;
  },
): Ladder[] {
  const current = readLadders(cards);
  const id = String(card.id || "").trim();
  const title = ladderLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Ladder = {
    id,
    title,
    note: ladderNote(card.note),
    picker: pickerLabel(card.picker),
    rung: rungOf(card.rung),
    gait: gaitName(card.gait),
    row: ladderRow(card.row),
    tint: tintName(card.tint),
    pitch: pitchOf(card.pitch),
    hold: holdOf(card.hold),
    pinned: false,
    climbed: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, LADDER_CAP);
}

/** Blank becomes dew. Dew becomes amber, amber becomes garnet, and garnet returns to dew. */
export function cycleTint(cards: readonly Ladder[], id: string): Ladder[] {
  return readLadders(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TINT_ORDER.indexOf(card.tint as (typeof TINT_ORDER)[number]);
    const next = at < 0 || at >= TINTS.length ? TINTS[0] : TINTS[at % TINTS.length];
    if (!next || next === card.tint) return card;
    return { ...card, tint: next, audit: "tint" };
  });
}

export function setLadderPin(cards: readonly Ladder[], id: string, pinned: boolean): Ladder[] {
  return readLadders(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setLadderClimb(cards: readonly Ladder[], id: string, climbed: boolean): Ladder[] {
  return readLadders(cards).map((card) => (card.id === id ? { ...card, climbed, audit: climbed ? "climb" : "ground" } : card));
}

export function setLadderFiled(cards: readonly Ladder[], id: string, filed: boolean): Ladder[] {
  return readLadders(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editLadder(cards: readonly Ladder[], id: string, title: string): Ladder[] {
  const current = readLadders(cards);
  const next = ladderLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editLadderNote(cards: readonly Ladder[], id: string, note: string): Ladder[] {
  const current = readLadders(cards);
  const next = ladderNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkLadderPin(cards: readonly Ladder[], ids: readonly string[], pinned: boolean): Ladder[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readLadders(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkLadderFile(cards: readonly Ladder[], ids: readonly string[], filed: boolean): Ladder[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readLadders(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank or unknown gait is left out. A ladder already at that gait is left as it is. */
export function bulkLadderGait(cards: readonly Ladder[], ids: readonly string[], gait: string): Ladder[] {
  const name = gaitName(gait);
  const current = readLadders(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.gait !== name ? { ...card, gait: name, audit: "move" } : card));
}

export function resetLadders(): Ladder[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function ladderCopy(raw: unknown): string {
  return ladderLine(raw);
}

function inTray(card: Ladder, tray: LadderTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "climbed") return card.climbed && !card.filed;
  return !card.climbed && !card.filed;
}

function rungHit(rung: number | null, exact: number | null, pick: LadderPick | null): boolean {
  if (exact !== null) return rung === exact;
  if (pick === null) return true;
  if (pick === "blank") return rung === null;
  if (pick === "end") return endRung(rung);
  if (pick === "body") return bodyRung(rung);
  return rungBand(rung) === pick;
}

function tintScore(tint: string): number {
  if (tint === "garnet") return 3;
  if (tint === "amber") return 2;
  if (tint === "dew") return 1;
  return 0;
}

function waitingEnd(card: Ladder): boolean {
  return endRung(card.rung) && inTray(card, "open");
}

function haystack(card: Ladder): string {
  return `${card.title}\n${card.note}\n${card.row}`.toLowerCase();
}

/** An open ladder is late when the desk rung is more than three rungs ahead. */
export function lateLadder(card: Ladder, desk: unknown): boolean {
  const gap = rungGap(card.rung, desk);
  return inTray(card, "open") && gap !== null && gap > 3;
}

/** Search matches the title, the note, and the row. The picker, the rung, and the gait are not part of the query. */
export function visibleLadders(
  cards: readonly Ladder[],
  tray: LadderTray,
  query: string,
  picker: string | null,
  gait: LadderGait | null,
  row: string | null,
  tint: LadderTint | null,
  exact: number | null,
  pick: LadderPick | null,
  pitch: number | "blank" | null,
  hold: number | "blank" | null,
  garnetOnly: boolean,
  endOnly: boolean,
): Ladder[] {
  const text = query.trim().toLowerCase();
  const wantPicker = picker === null ? null : pickerLabel(picker);
  const wantRow = row === null ? null : ladderRow(row);
  return readLadders(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (garnetOnly && card.tint !== "garnet") return false;
      if (wantPicker !== null && pickerLabel(card.picker) !== wantPicker) return false;
      if (gait !== null && gaitOf(card.gait) !== gait) return false;
      if (wantRow !== null && ladderRow(card.row) !== wantRow) return false;
      if (tint !== null && tintOf(card.tint) !== tint) return false;
      if (!rungHit(card.rung, exact, pick)) return false;
      if (pitch === "blank" && card.pitch !== null) return false;
      if (typeof pitch === "number" && card.pitch !== pitch) return false;
      if (hold === "blank" && card.hold !== null) return false;
      if (typeof hold === "number" && card.hold !== hold) return false;
      if (endOnly && !waitingEnd(card)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (tintScore(a.tint) !== tintScore(b.tint)) return tintScore(b.tint) - tintScore(a.tint);
      return a.title.localeCompare(b.title);
    });
}

/** The rung orders the orchard. An unset rung stays at the end. Search matches the title, the note, and the row. */
export function rungTimeline(cards: readonly Ladder[], query: string): Ladder[] {
  const text = query.trim().toLowerCase();
  return readLadders(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.rung === null && b.rung !== null) return 1;
      if (a.rung !== null && b.rung === null) return -1;
      if (a.rung !== null && b.rung !== null && a.rung !== b.rung) return a.rung - b.rung;
      return a.title.localeCompare(b.title);
    });
}

export function ladderCounts(cards: readonly Ladder[], desk: unknown): LadderCounts {
  const rows = readLadders(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    climbed: rows.filter((card) => inTray(card, "climbed")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    end: rows.filter((card) => waitingEnd(card)).length,
    late: rows.filter((card) => lateLadder(card, desk)).length,
  };
}

/** How many distinct rungs the saved ladders already use. An unset rung is not a span. */
export function usedRungs(cards: readonly Ladder[]): number {
  const seen = new Set<number>();
  for (const card of readLadders(cards)) if (card.rung !== null) seen.add(card.rung);
  return seen.size;
}

/** Share of the saved ladders. A zero total stays at zero. */
export function ladderShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function ladderPickers(cards: readonly Ladder[]): string[] {
  const out: string[] = [];
  for (const card of readLadders(cards)) {
    if (card.picker && !out.includes(card.picker)) out.push(card.picker);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function ladderRows(cards: readonly Ladder[]): string[] {
  const out: string[] = [];
  for (const card of readLadders(cards)) {
    if (card.row && !out.includes(card.row)) out.push(card.row);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function ladderGaits(cards: readonly Ladder[]): Exclude<LadderGait, "blank">[] {
  const seen = new Set<string>();
  for (const card of readLadders(cards)) if (card.gait) seen.add(card.gait);
  return GAITS.filter((gait) => seen.has(gait));
}

export function ladderTints(cards: readonly Ladder[]): Exclude<LadderTint, "blank">[] {
  const seen = new Set<string>();
  for (const card of readLadders(cards)) if (card.tint) seen.add(card.tint);
  return TINTS.filter((tint) => seen.has(tint));
}

/** How many open ladders a picker still holds. A blank picker is not a load. */
export function pickerLoad(cards: readonly Ladder[], picker: string): number {
  const name = pickerLabel(picker);
  if (!name) return 0;
  return readLadders(cards).filter((card) => card.picker === name && inTray(card, "open")).length;
}

/** Three gaits. Index 0 is step. Index 2 is reach. */
export function gaitCounts(cards: readonly Ladder[]): number[] {
  const rows = readLadders(cards);
  return GAITS.map((gait) => rows.filter((card) => gaitOf(card.gait) === gait).length);
}

/** "all" and "blank" stay. A picker that is no longer on a ladder falls back to all. */
export function activePicker(filter: string, pickers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const picker = pickerLabel(filter);
  return picker && pickers.includes(picker) ? picker : "all";
}

export function pickerArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return pickerLabel(filter);
}

/** "all" and "blank" stay. A gait that is no longer on a ladder falls back to all. */
export function activeGait(filter: string, gaits: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const gait = gaitName(filter);
  return gait && gaits.includes(gait) ? gait : "all";
}

export function gaitArg(filter: string): LadderGait | null {
  if (filter === "blank") return "blank";
  return gaitName(filter) || null;
}

/** "all" and "blank" stay. A row that is no longer on a ladder falls back to all. */
export function activeRow(filter: string, rows: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const row = ladderRow(filter);
  return row && rows.includes(row) ? row : "all";
}

export function rowArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return ladderRow(filter);
}

/** "all" and "blank" stay. A tint that is no longer on a ladder falls back to all. */
export function activeTint(filter: string, tints: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tint = tintName(filter);
  return tint && tints.includes(tint) ? tint : "all";
}

export function tintArg(filter: string): LadderTint | null {
  if (filter === "blank") return "blank";
  return tintName(filter) || null;
}

/** All, blank, the bands, end, body, and the rungs 1 through 9 stay. Anything else is all. */
export function activeRung(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const rung = rungOf(filter);
  return rung === null ? "all" : String(rung);
}

export function rungArg(filter: string): { exact: number | null; pick: LadderPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as LadderPick };
  const rung = rungOf(filter);
  return rung === null ? { exact: null, pick: null } : { exact: rung, pick: null };
}

/** All, blank, and the pitches 1 through 5 stay. Anything else is all. */
export function activePitch(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const pitch = pitchOf(filter);
  return pitch === null ? "all" : String(pitch);
}

export function pitchArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return pitchOf(filter);
}

/** All, blank, and the holds 6, 12, 18, and 24 stay. Anything else is all. */
export function activeHold(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const hold = holdOf(filter);
  return hold === null ? "all" : String(hold);
}

export function holdArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return holdOf(filter);
}

/** Other ladders with the same gait and the same rung. A blank gait or a blank rung clashes with nothing. */
export function rungClashIds(cards: readonly Ladder[], id: string): string[] {
  const rows = readLadders(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.gait || card.rung === null) return [];
  return rows
    .filter((item) => item.id !== id && item.gait === card.gait && item.rung === card.rung)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved ladders share a gait and a rung with another ladder. */
export function clashRungCount(cards: readonly Ladder[]): number {
  const rows = readLadders(cards);
  return rows.filter((card) => rungClashIds(rows, card.id).length > 0).length;
}

/** Other ladders with the same gait and the same pitch. A blank gait or a blank pitch clashes with nothing. */
export function pitchClashIds(cards: readonly Ladder[], id: string): string[] {
  const rows = readLadders(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.gait || card.pitch === null) return [];
  return rows
    .filter((item) => item.id !== id && item.gait === card.gait && item.pitch === card.pitch)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved ladders share a gait and a pitch with another ladder. */
export function pitchClashCount(cards: readonly Ladder[]): number {
  const rows = readLadders(cards);
  return rows.filter((card) => pitchClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open ladder at or after the rung you type, skipping garnet.
 * After 9, the orchard wraps to the earliest open ladder that is not garnet.
 */
export function nextLadder(cards: readonly Ladder[], desk: unknown): string {
  const now = rungOf(desk);
  if (now === null) return "";
  const waiting = readLadders(cards).filter((card) => inTray(card, "open") && card.rung !== null && card.tint !== "garnet");
  if (!waiting.length) return "";
  const byRung = (a: Ladder, b: Ladder) => (a.rung ?? 0) - (b.rung ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.rung ?? 0) >= now).sort(byRung);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byRung)[0].id;
}

/**
 * The gait with the fewest open ladders.
 * A tie keeps the earlier gait: step, then climb, then reach.
 * Ladders with no gait are not a load. An empty desk still suggests step.
 */
export function suggestGait(cards: readonly Ladder[]): Exclude<LadderGait, "blank"> {
  const rows = readLadders(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<LadderGait, "blank"> = "step";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const gait of GAITS) {
    const count = rows.filter((card) => card.gait === gait).length;
    if (count < bestCount) {
      best = gait;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The picker with the fewest open ladders.
 * A tie keeps the earlier name. A blank picker is not a candidate.
 * A desk with no named picker suggests nothing.
 */
export function suggestPicker(cards: readonly Ladder[]): string {
  const rows = readLadders(cards).filter((card) => inTray(card, "open") && card.picker);
  const pickers: string[] = [];
  for (const card of rows) {
    if (!pickers.includes(card.picker)) pickers.push(card.picker);
  }
  pickers.sort((a, b) => a.localeCompare(b));
  if (!pickers.length) return "";
  let best = pickers[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const picker of pickers) {
    const count = rows.filter((card) => card.picker === picker).length;
    if (count < bestCount) {
      best = picker;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the ladders saved in this browser. The gap and the late mark use the rung you pass. */
export function laddersCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,picker,rung,gait,row,tint,pitch,hold,band,pinned,climbed,filed,gap,late,note,audit"];
  for (const card of readLadders(raw)) {
    const gap = rungGap(card.rung, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.picker),
      card.rung === null ? "" : String(card.rung),
      card.gait,
      csvCell(card.row),
      card.tint,
      card.pitch === null ? "" : String(card.pitch),
      card.hold === null ? "" : String(card.hold),
      rungBand(card.rung),
      card.pinned ? "1" : "0",
      card.climbed ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateLadder(card, desk) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function pickerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return pickerLabel(raw) || "all";
}

function gaitSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return gaitName(raw) || "all";
}

function rowSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ladderRow(raw) || "all";
}

function tintSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tintName(raw) || "all";
}

export function readLadderViews(raw: unknown): LadderView[] {
  if (!Array.isArray(raw)) return [];
  const out: LadderView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LadderView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      picker: pickerSlot(row.picker),
      gait: gaitSlot(row.gait),
      row: rowSlot(row.row),
      tint: tintSlot(row.tint),
      rung: activeRung(String(row.rung ?? "")),
      pitch: activePitch(String(row.pitch ?? "")),
      hold: activeHold(String(row.hold ?? "")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addLadderView(
  views: readonly LadderView[],
  view: {
    id: string;
    name: string;
    tray: LadderTray;
    query: string;
    picker: string;
    gait: string;
    row: string;
    tint: string;
    rung: string;
    pitch: string;
    hold: string;
  },
): LadderView[] {
  const current = readLadderViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    picker: pickerSlot(view.picker),
    gait: gaitSlot(view.gait),
    row: rowSlot(view.row),
    tint: tintSlot(view.tint),
    rung: activeRung(view.rung),
    pitch: activePitch(view.pitch),
    hold: activeHold(view.hold),
  }].slice(0, VIEW_CAP);
}

export function dropLadderView(views: readonly LadderView[], id: string): LadderView[] {
  return readLadderViews(views).filter((view) => view.id !== id);
}

function markText(raw: unknown): string {
  return clip(raw, CODE_CAP);
}

function markBody(value: MarkValue): { text: string; explicit: boolean } | null {
  if (typeof value === "number") return { text: "", explicit: false };
  if (typeof value === "string") return { text: markText(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: "", explicit: false };
  if (MARK_BLOCK.some((key) => key in value)) return null;
  if (!("lastCountry" in value)) return { text: "", explicit: false };
  const inner = value.lastCountry;
  if (inner === null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: "", explicit: false };
  return { text: markText(inner), explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set code is text. A clear code is an explicit blank. A missing field stays unmarked.
 * A profile country, a name, and the other blocked fields are not a presence country.
 */
export function markState(value: MarkValue): MarkState {
  const body = markBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/** The clipped length of a set code. A clear or unmarked value stays unset. */
export function markLength(value: MarkValue): number | null {
  const body = markBody(value);
  if (!body || !body.text) return null;
  return body.text.length;
}

/** The clipped code. A clear or unmarked value stays blank. */
export function markCopy(value: MarkValue): string {
  const body = markBody(value);
  return body?.text || "";
}

/**
 * Mote is one character. Pair is two. Span is three. Four and above is a name.
 * A blank code has no band.
 */
export function markBand(value: MarkValue): MarkBand {
  const length = markLength(value);
  if (length === null) return "";
  if (length <= 1) return "mote";
  if (length === 2) return "pair";
  if (length === 3) return "span";
  return "name";
}

/**
 * Near is A–I, mid is J–R, and anything else is far.
 * The first character decides. A blank code has no depth.
 */
export function markDepth(value: MarkValue): MarkDepth {
  const text = markCopy(value);
  if (!text) return "";
  const code = text.toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 73) return "near";
  if (code >= 74 && code <= 82) return "mid";
  return "far";
}

/** A two-letter alphabetic code is an ISO-style pair. Digits, spaces, and longer codes are not. */
export function isoPair(value: MarkValue): boolean {
  return /^[A-Za-z]{2}$/.test(markCopy(value));
}

export function markBands(rows: readonly MarkRow[]): MarkBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = markState(row.note);
    if (state === "") continue;
    const band = state === "set" ? markBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: MarkBandLine[] = [];
  for (const band of ["", ...MARK_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function markDepths(rows: readonly MarkRow[]): MarkDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = markDepth(row.note);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: MarkDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps mote, then pair, span, and name. An unmarked field is not a lead. */
export function leadingMark(rows: readonly MarkRow[]): string {
  const named = markBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const tie = ["mote", "pair", "span", "name"];
  const order = (band: string) => tie.indexOf(band);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps near, then mid, then far. A blank code is not a lead. */
export function leadingMarkDepth(rows: readonly MarkRow[]): string {
  const named = markDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** How many set codes are not a two-letter alphabetic pair. */
export function oddCodeCount(rows: readonly MarkRow[]): number {
  return rows.filter((row) => markState(row.note) === "set" && !isoPair(row.note)).length;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function markShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((MARK_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentMarks(rows: readonly MarkRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = markState(row.note);
    const token = state === "set" ? markBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenMarks(raw: unknown, present: readonly string[]): string[] {
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

export function toggleMark(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandToken(band);
  if (!token || !present.includes(token)) return readHiddenMarks(hidden, present);
  const current = readHiddenMarks(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleMarkBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenMarks(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeMark(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (MARK_BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function markArg(filter: string): MarkBand | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (MARK_BANDS as readonly string[]).includes(filter) ? (filter as MarkBand) : null;
}

/** "all" and "blank" stay. A depth that is no longer loaded falls back to all. */
export function activeMarkDepth(filter: string, depths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (DEPTHS as readonly string[]).includes(filter) && depths.includes(filter) ? filter : "all";
}

export function markDepthArg(filter: string): MarkDepth | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (DEPTHS as readonly string[]).includes(filter) ? (filter as MarkDepth) : null;
}

function rowId(row: MarkRow): string {
  return String(row.id || "").trim();
}

export function readReviewed(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present.map((id) => String(id || "").trim()).filter(Boolean));
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (!id || !known.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out.slice(0, 40);
}

export function toggleReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewed(reviewed, present);
  const current = readReviewed(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewed(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 40);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the depth, and the code are not part of the query. */
export function visibleMarkCustomers<T extends MarkRow>(
  rows: readonly T[],
  band: MarkBand | "blank" | null,
  depth: MarkDepth | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: MarkShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = markState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && markBand(row.note) !== band) return false;
    if (depth !== null && markDepth(row.note) !== depth) return false;
    if (shape === "pair" && !isoPair(row.note)) return false;
    if (shape === "odd" && (state !== "set" || isoPair(row.note))) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function marksCsv(rows: readonly MarkRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = markState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of markBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of markDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  lines.push(["shape", "odd", String(oddCodeCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function markRowsCsv(rows: readonly MarkRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,depth,length,pair,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const length = markLength(row.note);
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(markBand(row.note)),
      csvCell(markDepth(row.note)),
      length === null ? "" : String(length),
      isoPair(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}

export const LADDER_GAITS = GAITS;
export const MARK_BAND_NAMES = ["mote", "pair", "span", "name"] as const;
