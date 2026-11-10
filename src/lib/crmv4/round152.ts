/**
 * Local loom tickets, and account login ids already on each loaded row.
 * Persistence stays in this browser. A future table is a proposal only and is not applied:
 * CREATE TABLE crm_loom_ticket (
 *   id text primary key,
 *   note text not null,
 *   weaver text not null default '',
 *   day integer,
 *   cloth text not null default '',
 *   seal text not null default '',
 *   tempo text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 */

export const LOOM_KEY = "crmv4-loom-tickets";
export const LOOM_VIEW_KEY = "crmv4-loom-views";
export const BAND_KEY = "crmv4-login-band-hide";

export type LoomTempo = "blank" | "hush" | "even" | "brisk";

export type LoomCloth = "blank" | "silk" | "linen" | "wool" | "velvet";

export type LoomTray = "open" | "held" | "filed";

export type DayPick = "blank" | "opening" | "rising" | "settling" | "closing" | "odd" | "even";

export type LoomCard = {
  id: string;
  text: string;
  weaver: string;
  day: number | null;
  cloth: string;
  seal: string;
  tempo: string;
  pinned: boolean;
  filed: boolean;
  held: boolean;
  audit: string;
};

export type LoomView = {
  id: string;
  name: string;
  tray: LoomTray;
  query: string;
  weaver: string;
  cloth: string;
  seal: string;
  tempo: string;
  day: string;
};

export type LoomCounts = {
  open: number;
  held: number;
  filed: number;
  pinned: number;
  late: number;
};

export type LoginFit = "" | "full" | "short" | "other";

export type LoginParity = "" | "odd" | "even";

export type LoginValue =
  | {
      accountLoginId?: unknown;
      email?: unknown;
      phone?: unknown;
      country?: unknown;
      name?: unknown;
      username?: unknown;
      birthDate?: unknown;
      registrationDate?: unknown;
      language?: unknown;
      city?: unknown;
      jobTitle?: unknown;
      desk?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type LoginRow = { login?: LoginValue; label?: string | null };

export type DigitLine = { digit: string; count: number };

export type FitLine = { fit: string; count: number };

export type ParityLine = { parity: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "file", "reopen"] as const;

const CLOTHS = ["silk", "linen", "wool", "velvet"] as const;

const TEMPOS = ["hush", "even", "brisk"] as const;

const TEMPO_ORDER = ["", "hush", "even", "brisk"] as const;

const PICKS = ["blank", "opening", "rising", "settling", "closing", "odd", "even"] as const;

const QUARTERS = ["opening", "rising", "settling", "closing"] as const;

const FITS = ["", "full", "short", "other"] as const;

const PARITIES = ["", "odd", "even"] as const;

const DIGITS = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

const LOGIN_BLOCK = [
  "email",
  "phone",
  "country",
  "name",
  "username",
  "birthDate",
  "registrationDate",
  "language",
  "city",
  "jobTitle",
  "desk",
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LoomTray {
  return raw === "held" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<LoomCloth, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<LoomCloth, "blank">) : "";
}

function tempoName(raw: unknown): Exclude<LoomTempo, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TEMPOS as readonly string[]).includes(text) ? (text as Exclude<LoomTempo, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function loomText(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank weaver stays blank. It is not filled in. */
export function weaverLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank seal stays blank. It is not filled in. */
export function sealMark(raw: unknown): string {
  return clip(raw, 8);
}

/**
 * A day is 1 through 28.
 * A blank value stays unset. A leading zero is not a day.
 * 0 and 29 are not days.
 */
export function dayOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 28) return raw;
  if (typeof raw === "string" && /^(?:[1-9]|1\d|2[0-8])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Silk, linen, wool, velvet, or blank. Anything else is blank. */
export function clothOf(raw: unknown): LoomCloth {
  return clothName(raw) || "blank";
}

/** Hush, even, brisk, or blank. Anything else is blank. */
export function tempoOf(raw: unknown): LoomTempo {
  return tempoName(raw) || "blank";
}

/** Opening is 1–7. Rising is 8–14. Settling is 15–21. Closing is 22–28. An unset day is blank. */
export function quarterOf(day: unknown): "blank" | "opening" | "rising" | "settling" | "closing" {
  const count = dayOf(day);
  if (count === null) return "blank";
  if (count <= 7) return "opening";
  if (count <= 14) return "rising";
  if (count <= 21) return "settling";
  return "closing";
}

/** Odd days and even days. An unset day is blank. */
export function dayPair(day: unknown): "blank" | "odd" | "even" {
  const count = dayOf(day);
  if (count === null) return "blank";
  return count % 2 === 1 ? "odd" : "even";
}

/** The typed day minus the ticket day. A positive gap is past the day. */
export function dayGap(day: unknown, clock: unknown): number | null {
  const from = dayOf(day);
  const at = dayOf(clock);
  if (from === null || at === null) return null;
  return at - from;
}

export function readLooms(raw: unknown): LoomCard[] {
  if (!Array.isArray(raw)) return [];
  const out: LoomCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LoomCard>;
    const id = String(row.id || "").trim();
    const text = loomText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      weaver: weaverLabel(row.weaver),
      day: dayOf(row.day),
      cloth: clothName(row.cloth),
      seal: sealMark(row.seal),
      tempo: tempoName(row.tempo),
      pinned: row.pinned === true,
      filed: row.filed === true,
      held: row.held === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 24);
}

export function addLoom(
  cards: readonly LoomCard[],
  card: { id: string; text: string; weaver?: string; day?: unknown; cloth?: string; seal?: string; tempo?: string },
): LoomCard[] {
  const current = readLooms(cards);
  const id = String(card.id || "").trim();
  const text = loomText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: LoomCard = {
    id,
    text,
    weaver: weaverLabel(card.weaver),
    day: dayOf(card.day),
    cloth: clothName(card.cloth),
    seal: sealMark(card.seal),
    tempo: tempoName(card.tempo),
    pinned: false,
    filed: false,
    held: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 24);
}

export function stepLoomTempo(cards: readonly LoomCard[], id: string, dir: 1 | -1): LoomCard[] {
  return readLooms(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TEMPO_ORDER.indexOf(card.tempo as (typeof TEMPO_ORDER)[number]);
    const next = TEMPO_ORDER[Math.min(TEMPOS.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.tempo) return card;
    return { ...card, tempo: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setLoomPinned(cards: readonly LoomCard[], id: string, pinned: boolean): LoomCard[] {
  return readLooms(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setLoomHeld(cards: readonly LoomCard[], id: string, held: boolean): LoomCard[] {
  return readLooms(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setLoomFiled(cards: readonly LoomCard[], id: string, filed: boolean): LoomCard[] {
  return readLooms(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another ticket is left out. */
export function editLoom(cards: readonly LoomCard[], id: string, text: string): LoomCard[] {
  const current = readLooms(cards);
  const next = loomText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkLoomPinned(cards: readonly LoomCard[], ids: readonly string[], pinned: boolean): LoomCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readLooms(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkLoomFiled(cards: readonly LoomCard[], ids: readonly string[], filed: boolean): LoomCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readLooms(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

export function resetLooms(): LoomCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function loomCopy(raw: unknown): string {
  return loomText(raw);
}

function inTray(card: LoomCard, tray: LoomTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "held") return card.held && !card.filed;
  return !card.held && !card.filed;
}

function dayHit(day: number | null, exact: number | null, band: DayPick | null): boolean {
  if (exact !== null) return day === exact;
  if (band === null) return true;
  if (band === "blank") return day === null;
  if (band === "odd" || band === "even") return dayPair(day) === band;
  return quarterOf(day) === band;
}

function tempoScore(tempo: string): number {
  if (tempo === "brisk") return 3;
  if (tempo === "even") return 2;
  if (tempo === "hush") return 1;
  return 0;
}

/** Search stays on the note. The weaver, the day, the cloth, the seal, and the tempo are not part of the query. */
export function visibleLooms(
  cards: readonly LoomCard[],
  tray: LoomTray,
  query: string,
  weaver: string | null,
  cloth: LoomCloth | null,
  seal: string | null,
  tempo: LoomTempo | null,
  exact: number | null,
  band: DayPick | null,
  briskOnly: boolean,
  lateOnly: boolean,
  clock: unknown,
): LoomCard[] {
  const text = query.trim().toLowerCase();
  const wantWeaver = weaver === null ? null : weaverLabel(weaver);
  const wantSeal = seal === null ? null : sealMark(seal);
  return readLooms(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (briskOnly && card.tempo !== "brisk") return false;
      if (wantWeaver !== null && weaverLabel(card.weaver) !== wantWeaver) return false;
      if (cloth !== null && clothOf(card.cloth) !== cloth) return false;
      if (wantSeal !== null && sealMark(card.seal) !== wantSeal) return false;
      if (tempo !== null && tempoOf(card.tempo) !== tempo) return false;
      if (!dayHit(card.day, exact, band)) return false;
      if (lateOnly) {
        const gap = dayGap(card.day, clock);
        if (gap === null || gap <= 0 || !inTray(card, "open")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (tempoScore(a.tempo) !== tempoScore(b.tempo)) return tempoScore(b.tempo) - tempoScore(a.tempo);
      return a.text.localeCompare(b.text);
    });
}

/** The day orders the desk. An unset day stays at the end. Search stays on the note. */
export function loomTimeline(cards: readonly LoomCard[], query: string): LoomCard[] {
  const text = query.trim().toLowerCase();
  return readLooms(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.day === null && b.day !== null) return 1;
      if (a.day !== null && b.day === null) return -1;
      if (a.day !== null && b.day !== null && a.day !== b.day) return a.day - b.day;
      return a.text.localeCompare(b.text);
    });
}

export function loomCounts(cards: readonly LoomCard[], clock: unknown): LoomCounts {
  const rows = readLooms(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => {
      const gap = dayGap(card.day, clock);
      return gap !== null && gap > 0 && inTray(card, "open");
    }).length,
  };
}

/** Share of the saved tickets. A zero total stays at zero. */
export function loomShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function loomWeavers(cards: readonly LoomCard[]): string[] {
  const out: string[] = [];
  for (const card of readLooms(cards)) {
    if (card.weaver && !out.includes(card.weaver)) out.push(card.weaver);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function loomSeals(cards: readonly LoomCard[]): string[] {
  const out: string[] = [];
  for (const card of readLooms(cards)) {
    if (card.seal && !out.includes(card.seal)) out.push(card.seal);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function loomCloths(cards: readonly LoomCard[]): Exclude<LoomCloth, "blank">[] {
  const seen = new Set<string>();
  for (const card of readLooms(cards)) if (card.cloth) seen.add(card.cloth);
  return CLOTHS.filter((cloth) => seen.has(cloth));
}

export function loomTempos(cards: readonly LoomCard[]): Exclude<LoomTempo, "blank">[] {
  const seen = new Set<string>();
  for (const card of readLooms(cards)) if (card.tempo) seen.add(card.tempo);
  return TEMPOS.filter((tempo) => seen.has(tempo));
}

/** Four month quarters. Index 0 is opening. Index 3 is closing. */
export function quarterCounts(cards: readonly LoomCard[]): number[] {
  const rows = readLooms(cards);
  return QUARTERS.map((band) => rows.filter((card) => quarterOf(card.day) === band).length);
}

/** "all" and "blank" stay. A weaver that is no longer on a ticket falls back to all. */
export function activeWeaver(filter: string, weavers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const weaver = weaverLabel(filter);
  return weaver && weavers.includes(weaver) ? weaver : "all";
}

export function weaverArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return weaverLabel(filter);
}

/** "all" and "blank" stay. A cloth that is no longer on a ticket falls back to all. */
export function activeCloth(filter: string, cloths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cloth = clothName(filter);
  return cloth && cloths.includes(cloth) ? cloth : "all";
}

export function clothArg(filter: string): LoomCloth | null {
  if (filter === "blank") return "blank";
  return clothName(filter) || null;
}

/** "all" and "blank" stay. A seal that is no longer on a ticket falls back to all. */
export function activeSeal(filter: string, seals: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const seal = sealMark(filter);
  return seal && seals.includes(seal) ? seal : "all";
}

export function sealArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return sealMark(filter);
}

/** "all" and "blank" stay. A tempo that is no longer on a ticket falls back to all. */
export function activeTempo(filter: string, tempos: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tempo = tempoName(filter);
  return tempo && tempos.includes(tempo) ? tempo : "all";
}

export function tempoArg(filter: string): LoomTempo | null {
  if (filter === "blank") return "blank";
  return tempoName(filter) || null;
}

/** All, blank, the four quarters, the two pairs, and the days 1 through 28 stay. Anything else is all. */
export function activeDay(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const day = dayOf(filter);
  return day === null ? "all" : String(day);
}

export function dayArg(filter: string): { exact: number | null; band: DayPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, band: filter as DayPick };
  const day = dayOf(filter);
  return day === null ? { exact: null, band: null } : { exact: day, band: null };
}

/** Other tickets with the same cloth and the same day. A blank cloth or an unset day clashes with nothing. */
export function loomClashIds(cards: readonly LoomCard[], id: string): string[] {
  const rows = readLooms(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.cloth || card.day === null) return [];
  return rows
    .filter((item) => item.id !== id && item.cloth === card.cloth && item.day === card.day)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open ticket at or after the day you type. After the last day, the desk wraps to the earliest open day. */
export function nextLoom(cards: readonly LoomCard[], clock: unknown): string {
  const now = dayOf(clock);
  if (now === null) return "";
  const waiting = readLooms(cards).filter((card) => inTray(card, "open") && card.day !== null);
  if (!waiting.length) return "";
  const byDay = (a: LoomCard, b: LoomCard) => (a.day ?? 0) - (b.day ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.day ?? 0) >= now).sort(byDay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byDay)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the tickets saved in this browser. The gap uses the day you pass. */
export function loomsCsv(raw: unknown, clock: unknown): string {
  const lines = ["note,weaver,day,cloth,seal,tempo,quarter,pinned,held,filed,gap,audit"];
  for (const card of readLooms(raw)) {
    const gap = dayGap(card.day, clock);
    lines.push([
      csvCell(card.text),
      csvCell(card.weaver),
      card.day === null ? "" : String(card.day),
      card.cloth,
      csvCell(card.seal),
      card.tempo,
      quarterOf(card.day),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function weaverSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return weaverLabel(raw) || "all";
}

function clothSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return clothName(raw) || "all";
}

function sealSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return sealMark(raw) || "all";
}

function tempoSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tempoName(raw) || "all";
}

export function readLoomViews(raw: unknown): LoomView[] {
  if (!Array.isArray(raw)) return [];
  const out: LoomView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LoomView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 64),
      weaver: weaverSlot(row.weaver),
      cloth: clothSlot(row.cloth),
      seal: sealSlot(row.seal),
      tempo: tempoSlot(row.tempo),
      day: activeDay(String(row.day ?? "")),
    });
  }
  return out.slice(0, 8);
}

export function addLoomView(
  views: readonly LoomView[],
  view: { id: string; name: string; tray: LoomTray; query: string; weaver: string; cloth: string; seal: string; tempo: string; day: string },
): LoomView[] {
  const current = readLoomViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 64),
    weaver: weaverSlot(view.weaver),
    cloth: clothSlot(view.cloth),
    seal: sealSlot(view.seal),
    tempo: tempoSlot(view.tempo),
    day: activeDay(view.day),
  }].slice(0, 8);
}

export function dropLoomView(views: readonly LoomView[], id: string): LoomView[] {
  return readLoomViews(views).filter((view) => view.id !== id);
}

function resolvedLogin(value: LoginValue): string {
  if (typeof value === "string") return clip(value, 16);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (LOGIN_BLOCK.some((key) => key in value)) return "";
  return clip(value.accountLoginId, 16);
}

/**
 * An account login id from the login field, or blank.
 * A name, an email, and a phone are not a login id.
 * A missing login id stays unmarked and is not filled in.
 */
export function assignedLogin(value: LoginValue): string {
  return resolvedLogin(value);
}

/** The first digit of a digit login id that does not start with zero. Anything else stays blank. */
export function digitOf(value: LoginValue): string {
  const login = resolvedLogin(value);
  if (!/^[1-9]\d*$/.test(login)) return "";
  return login[0];
}

/** Full is 16 digits with no leading zero. Short is 1–15 digits. Other is anything else that is present. */
export function fitOf(value: LoginValue): LoginFit {
  const login = resolvedLogin(value);
  if (!login) return "";
  if (/^[1-9]\d{15}$/.test(login)) return "full";
  if (/^\d{1,15}$/.test(login)) return "short";
  return "other";
}

/** Odd or even from the last digit. A blank id and a non-digit id stay blank. */
export function parityOf(value: LoginValue): LoginParity {
  const login = resolvedLogin(value);
  if (!/^\d+$/.test(login)) return "";
  return Number(login[login.length - 1]) % 2 === 1 ? "odd" : "even";
}

export function digitLines(rows: readonly LoginRow[]): DigitLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const digit = digitOf(row.login);
    map.set(digit, (map.get(digit) || 0) + 1);
  }
  const out: DigitLine[] = [];
  for (const digit of DIGITS) {
    const count = map.get(digit);
    if (count) out.push({ digit, count });
  }
  return out;
}

export function namedDigits(rows: readonly LoginRow[]): string[] {
  return digitLines(rows).map((line) => line.digit).filter(Boolean);
}

export function fitLines(rows: readonly LoginRow[]): FitLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const fit = fitOf(row.login);
    map.set(fit, (map.get(fit) || 0) + 1);
  }
  const out: FitLine[] = [];
  for (const fit of FITS) {
    const count = map.get(fit);
    if (count) out.push({ fit, count });
  }
  return out;
}

export function namedFits(rows: readonly LoginRow[]): string[] {
  return fitLines(rows).map((line) => line.fit).filter(Boolean);
}

export function parityLines(rows: readonly LoginRow[]): ParityLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const parity = parityOf(row.login);
    map.set(parity, (map.get(parity) || 0) + 1);
  }
  const out: ParityLine[] = [];
  for (const parity of PARITIES) {
    const count = map.get(parity);
    if (count) out.push({ parity, count });
  }
  return out;
}

export function namedParities(rows: readonly LoginRow[]): string[] {
  return parityLines(rows).map((line) => line.parity).filter(Boolean);
}

/** The digit with the most loaded rows. A tie keeps the earlier digit. An unmarked id is not a lead. */
export function leadingDigit(rows: readonly LoginRow[]): string {
  const named = digitLines(rows).filter((line) => line.digit);
  if (!named.length) return "";
  const order = (digit: string) => DIGITS.indexOf(digit as (typeof DIGITS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.digit) - order(b.digit))[0].digit;
}

/** The named fit with the most loaded rows. A tie keeps the earlier fit. A blank fit is not a lead. */
export function leadingFit(rows: readonly LoginRow[]): string {
  const named = fitLines(rows).filter((line) => line.fit);
  if (!named.length) return "";
  const order = (fit: string) => FITS.indexOf(fit as (typeof FITS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.fit) - order(b.fit))[0].fit;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function bandShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenDigits(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = clip(item, 1);
    if (!/^[1-9]$/.test(mark) || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleDigit(hidden: readonly string[], digit: string, present: readonly string[]): string[] {
  const mark = digitOf(digit);
  if (!mark || !present.includes(mark)) return readHiddenDigits(hidden, present);
  const current = readHiddenDigits(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleDigits(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenDigits(hidden, present));
  return present.filter((digit) => (showHidden ? gone.has(digit) : !gone.has(digit)));
}

/** "all" and "blank" stay. A digit that is no longer loaded falls back to all. */
export function activeDigit(filter: string, digits: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const digit = digitOf(filter);
  return digit && digits.includes(digit) ? digit : "all";
}

export function digitArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const digit = digitOf(filter);
  return digit || null;
}

/** "all" and "blank" stay. A fit that is no longer loaded falls back to all. */
export function activeFit(filter: string, fits: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (FITS as readonly string[]).includes(filter) && fits.includes(filter) ? filter : "all";
}

export function fitArg(filter: string): LoginFit | null {
  if (filter === "blank") return "";
  if ((FITS as readonly string[]).includes(filter) && filter !== "") return filter as LoginFit;
  return null;
}

/** "all" and "blank" stay. A parity that is no longer loaded falls back to all. */
export function activeParity(filter: string, parities: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (PARITIES as readonly string[]).includes(filter) && parities.includes(filter) ? filter : "all";
}

export function parityArg(filter: string): LoginParity | null {
  if (filter === "blank") return "";
  if ((PARITIES as readonly string[]).includes(filter) && filter !== "") return filter as LoginParity;
  return null;
}

/** Search stays on the name. The login id is not part of the query. */
export function visibleLoginCustomers<T extends LoginRow>(
  rows: readonly T[],
  digit: string | null,
  parity: LoginParity | null,
  fit: LoginFit | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (digit !== null && digitOf(row.login) !== digit) return false;
    if (parity !== null && parityOf(row.login) !== parity) return false;
    if (fit !== null && fitOf(row.login) !== fit) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the digits, fits, and parities on this page. */
export function bandsCsv(rows: readonly LoginRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of digitLines(rows)) lines.push(["digit", csvCell(line.digit), String(line.count)].join(","));
  for (const line of fitLines(rows)) lines.push(["fit", line.fit, String(line.count)].join(","));
  for (const line of parityLines(rows)) lines.push(["parity", line.parity, String(line.count)].join(","));
  return lines.join("\n");
}
