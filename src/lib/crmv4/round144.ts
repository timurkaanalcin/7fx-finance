/** Local playbill cards, and customer counts grouped by the invalid source already on each row. */

export const PLAYBILL_KEY = "crmv4-playbill-cards";
export const PLAYBILL_VIEW_KEY = "crmv4-playbill-views";
export const SOURCE_KEY = "crmv4-source-hide";

export type PlaybillTone = "blank" | "hush" | "warm" | "bright";

export type PlaybillWing = "blank" | "pit" | "box" | "circle" | "gallery";

export type PlaybillTray = "open" | "held" | "done";

export type ActPick = "blank" | "opening" | "hinge" | "finale" | "i" | "ii" | "iii";

export type Playbill = {
  id: string;
  text: string;
  player: string;
  act: number | null;
  wing: string;
  cue: string;
  tone: string;
  pinned: boolean;
  done: boolean;
  held: boolean;
  audit: string;
};

export type PlaybillView = {
  id: string;
  name: string;
  tray: PlaybillTray;
  query: string;
  player: string;
  wing: string;
  cue: string;
  tone: string;
  act: string;
};

export type PlaybillCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  late: number;
};

export type SourceValue =
  | {
      leadInvalidSource?: unknown;
      leadInvalidReason?: unknown;
      lastRegion?: unknown;
      address?: unknown;
      lastDevice?: unknown;
      lastOs?: unknown;
      lastBrowser?: unknown;
      lastCity?: unknown;
      lastCountry?: unknown;
      lastCountryName?: unknown;
      lastIp?: unknown;
      language?: unknown;
      country?: unknown;
      registrationCountry?: unknown;
      timezone?: unknown;
      desk?: unknown;
      deskId?: unknown;
      campaign?: unknown;
      phone?: unknown;
      tradingServer?: unknown;
      tradingGroup?: unknown;
      brokerName?: unknown;
      assigneeName?: unknown;
      saleStatus?: unknown;
      retentionStatus?: unknown;
      potentialStatus?: unknown;
      documentsStatus?: unknown;
      accountType?: unknown;
      role?: unknown;
      validation?: unknown;
      validationStatus?: unknown;
      referralCodeUsed?: unknown;
      city?: unknown;
    }
  | string
  | null
  | undefined;

export type SourceRow = { source?: SourceValue; label?: string | null };

export type SourceLine = { source: string; kind: string; span: string; letter: string; count: number };

export type KindLine = { kind: string; count: number };

export type SpanLine = { span: string; count: number };

export type SourceMarkLine = { letter: string; count: number };

export type Kind = "" | "hand" | "clock" | "other";

export type SourceSpan = "" | "brief" | "full" | "wide";

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "done", "reopen"] as const;

const WINGS = ["pit", "box", "circle", "gallery"] as const;

const TONES = ["hush", "warm", "bright"] as const;

const TONE_ORDER = ["", "hush", "warm", "bright"] as const;

const THIRDS = ["i", "ii", "iii"] as const;

const KINDS = ["", "hand", "clock", "other"] as const;

const SPANS = ["", "brief", "full", "wide"] as const;

const SOURCE_BLOCK = [
  "leadInvalidReason",
  "lastRegion",
  "address",
  "lastDevice",
  "lastOs",
  "lastBrowser",
  "lastCity",
  "lastCountry",
  "lastCountryName",
  "lastIp",
  "language",
  "country",
  "registrationCountry",
  "timezone",
  "desk",
  "deskId",
  "campaign",
  "phone",
  "tradingServer",
  "tradingGroup",
  "brokerName",
  "assigneeName",
  "saleStatus",
  "retentionStatus",
  "potentialStatus",
  "documentsStatus",
  "accountType",
  "role",
  "validation",
  "validationStatus",
  "referralCodeUsed",
  "city",
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): PlaybillTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function wingName(raw: unknown): Exclude<PlaybillWing, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WINGS as readonly string[]).includes(text) ? (text as Exclude<PlaybillWing, "blank">) : "";
}

function toneName(raw: unknown): Exclude<PlaybillTone, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<PlaybillTone, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function playbillText(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank player stays blank. It is not filled in. */
export function playerLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A blank cue stays blank. It is not filled in. */
export function cueTag(raw: unknown): string {
  return clip(raw, 12);
}

/**
 * An act is 1 through 5. Zero is not an act. A blank value stays unset.
 * A leading zero is unset.
 */
export function actCount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 5) return raw;
  if (typeof raw === "string" && /^[1-5]$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Pit, box, circle, gallery, or blank. Anything else is blank. */
export function wingOf(raw: unknown): PlaybillWing {
  return wingName(raw) || "blank";
}

/** Hush, warm, bright, or blank. Anything else is blank. */
export function toneOf(raw: unknown): PlaybillTone {
  return toneName(raw) || "blank";
}

/** Opening is 1 and 2. The hinge is 3. The finale is 4 and 5. An unset act is blank. */
export function actBand(act: unknown): "blank" | "opening" | "hinge" | "finale" {
  const count = actCount(act);
  if (count === null) return "blank";
  if (count <= 2) return "opening";
  if (count === 3) return "hinge";
  return "finale";
}

/** Three parts of the house. Act 1 is the first. Acts 2 and 3 are the second. Acts 4 and 5 are the third. */
export function actThird(act: unknown): "blank" | "i" | "ii" | "iii" {
  const count = actCount(act);
  if (count === null) return "blank";
  if (count === 1) return "i";
  if (count <= 3) return "ii";
  return "iii";
}

/** Acts from the card act to the desk act. A negative gap is still ahead. An unset act stays empty. */
export function actGap(act: unknown, desk: unknown): number | null {
  const from = actCount(act);
  const at = actCount(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readPlaybills(raw: unknown): Playbill[] {
  if (!Array.isArray(raw)) return [];
  const out: Playbill[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Playbill>;
    const id = String(row.id || "").trim();
    const text = playbillText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      player: playerLabel(row.player),
      act: actCount(row.act),
      wing: wingName(row.wing),
      cue: cueTag(row.cue),
      tone: toneName(row.tone),
      pinned: row.pinned === true,
      done: row.done === true,
      held: row.held === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 32);
}

export function addPlaybill(
  cards: readonly Playbill[],
  card: { id: string; text: string; player?: string; act?: unknown; wing?: string; cue?: string; tone?: string },
): Playbill[] {
  const current = readPlaybills(cards);
  const id = String(card.id || "").trim();
  const text = playbillText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: Playbill = {
    id,
    text,
    player: playerLabel(card.player),
    act: actCount(card.act),
    wing: wingName(card.wing),
    cue: cueTag(card.cue),
    tone: toneName(card.tone),
    pinned: false,
    done: false,
    held: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 32);
}

export function stepPlaybillTone(cards: readonly Playbill[], id: string, dir: 1 | -1): Playbill[] {
  return readPlaybills(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TONE_ORDER.indexOf(card.tone as (typeof TONE_ORDER)[number]);
    const next = TONE_ORDER[Math.min(TONES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.tone) return card;
    return { ...card, tone: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setPlaybillPinned(cards: readonly Playbill[], id: string, pinned: boolean): Playbill[] {
  return readPlaybills(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setPlaybillHeld(cards: readonly Playbill[], id: string, held: boolean): Playbill[] {
  return readPlaybills(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setPlaybillDone(cards: readonly Playbill[], id: string, done: boolean): Playbill[] {
  return readPlaybills(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another card is left out. */
export function editPlaybill(cards: readonly Playbill[], id: string, text: string): Playbill[] {
  const current = readPlaybills(cards);
  const next = playbillText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkPlaybillPinned(cards: readonly Playbill[], ids: readonly string[], pinned: boolean): Playbill[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readPlaybills(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkPlaybillDone(cards: readonly Playbill[], ids: readonly string[], done: boolean): Playbill[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readPlaybills(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

export function resetPlaybills(): Playbill[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function playbillCopy(raw: unknown): string {
  return playbillText(raw);
}

function inTray(card: Playbill, tray: PlaybillTray): boolean {
  if (tray === "done") return card.done;
  if (tray === "held") return card.held && !card.done;
  return !card.held && !card.done;
}

function actHit(act: number | null, exact: number | null, band: ActPick | null): boolean {
  if (exact !== null) return act === exact;
  if (band === null) return true;
  if (band === "i" || band === "ii" || band === "iii") return actThird(act) === band;
  return actBand(act) === band;
}

function toneWeight(tone: string): number {
  if (tone === "bright") return 3;
  if (tone === "warm") return 2;
  if (tone === "hush") return 1;
  return 0;
}

/** Search stays on the note. The player, the act, the wing, the cue, and the tone are not part of the query. */
export function visiblePlaybills(
  cards: readonly Playbill[],
  tray: PlaybillTray,
  query: string,
  player: string | null,
  wing: PlaybillWing | null,
  cue: string | null,
  tone: PlaybillTone | null,
  exact: number | null,
  band: ActPick | null,
  brightOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): Playbill[] {
  const text = query.trim().toLowerCase();
  const wantPlayer = player === null ? null : playerLabel(player);
  const wantCue = cue === null ? null : cueTag(cue);
  return readPlaybills(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (brightOnly && card.tone !== "bright") return false;
      if (wantPlayer !== null && playerLabel(card.player) !== wantPlayer) return false;
      if (wing !== null && wingOf(card.wing) !== wing) return false;
      if (wantCue !== null && cueTag(card.cue) !== wantCue) return false;
      if (tone !== null && toneOf(card.tone) !== tone) return false;
      if (!actHit(card.act, exact, band)) return false;
      if (lateOnly) {
        const gap = actGap(card.act, desk);
        if (gap === null || gap <= 0 || !inTray(card, "open")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (toneWeight(a.tone) !== toneWeight(b.tone)) return toneWeight(b.tone) - toneWeight(a.tone);
      return a.text.localeCompare(b.text);
    });
}

/** The act orders the house. An unset act stays at the end. Search stays on the note. */
export function playbillTimeline(cards: readonly Playbill[], query: string): Playbill[] {
  const text = query.trim().toLowerCase();
  return readPlaybills(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.act === null && b.act !== null) return 1;
      if (a.act !== null && b.act === null) return -1;
      if (a.act !== null && b.act !== null && a.act !== b.act) return a.act - b.act;
      return a.text.localeCompare(b.text);
    });
}

export function playbillCounts(cards: readonly Playbill[], desk: unknown): PlaybillCounts {
  const rows = readPlaybills(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => {
      const gap = actGap(card.act, desk);
      return gap !== null && gap > 0 && inTray(card, "open");
    }).length,
  };
}

/** Share of the saved cards. A zero total stays at zero. */
export function playbillShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function playbillPlayers(cards: readonly Playbill[]): string[] {
  const out: string[] = [];
  for (const card of readPlaybills(cards)) {
    if (card.player && !out.includes(card.player)) out.push(card.player);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function playbillCues(cards: readonly Playbill[]): string[] {
  const out: string[] = [];
  for (const card of readPlaybills(cards)) {
    if (card.cue && !out.includes(card.cue)) out.push(card.cue);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function playbillWings(cards: readonly Playbill[]): Exclude<PlaybillWing, "blank">[] {
  const seen = new Set<string>();
  for (const card of readPlaybills(cards)) if (card.wing) seen.add(card.wing);
  return WINGS.filter((wing) => seen.has(wing));
}

export function playbillTones(cards: readonly Playbill[]): Exclude<PlaybillTone, "blank">[] {
  const seen = new Set<string>();
  for (const card of readPlaybills(cards)) if (card.tone) seen.add(card.tone);
  return TONES.filter((tone) => seen.has(tone));
}

/** Three parts. The count is the cards whose act falls in that part. */
export function actThirdCounts(cards: readonly Playbill[]): number[] {
  const rows = readPlaybills(cards);
  return THIRDS.map((third) => rows.filter((card) => actThird(card.act) === third).length);
}

/** "all" and "blank" stay. A player that is no longer on a card falls back to all. */
export function activePlayer(filter: string, players: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const player = playerLabel(filter);
  return player && players.includes(player) ? player : "all";
}

export function playerArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return playerLabel(filter);
}

/** "all" and "blank" stay. A wing that is no longer on a card falls back to all. */
export function activeWing(filter: string, wings: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const wing = wingName(filter);
  return wing && wings.includes(wing) ? wing : "all";
}

export function wingArg(filter: string): PlaybillWing | null {
  if (filter === "blank") return "blank";
  return wingName(filter) || null;
}

/** "all" and "blank" stay. A cue that is no longer on a card falls back to all. */
export function activeCue(filter: string, cues: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cue = cueTag(filter);
  return cue && cues.includes(cue) ? cue : "all";
}

export function cueArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return cueTag(filter);
}

/** "all" and "blank" stay. A tone that is no longer on a card falls back to all. */
export function activeTone(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tone = toneName(filter);
  return tone && tones.includes(tone) ? tone : "all";
}

export function toneArg(filter: string): PlaybillTone | null {
  if (filter === "blank") return "blank";
  return toneName(filter) || null;
}

/** All, blank, opening, hinge, finale, the three parts, and acts 1 through 5 stay. Anything else is all. */
export function activeAct(filter: string): string {
  if (filter === "blank" || filter === "opening" || filter === "hinge" || filter === "finale") return filter;
  if ((THIRDS as readonly string[]).includes(filter)) return filter;
  const act = actCount(filter);
  return act === null ? "all" : String(act);
}

export function actArg(filter: string): { exact: number | null; band: ActPick | null } {
  if (
    filter === "blank" ||
    filter === "opening" ||
    filter === "hinge" ||
    filter === "finale" ||
    (THIRDS as readonly string[]).includes(filter)
  ) {
    return { exact: null, band: filter as ActPick };
  }
  const act = actCount(filter);
  return act === null ? { exact: null, band: null } : { exact: act, band: null };
}

/** Other cards with the same wing and the same act. A blank wing or an unset act clashes with nothing. */
export function playbillClashIds(cards: readonly Playbill[], id: string): string[] {
  const rows = readPlaybills(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.wing || card.act === null) return [];
  return rows
    .filter((item) => item.id !== id && item.wing === card.wing && item.act === card.act)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open card at or after the act. After the last act, the house wraps to the earliest open act. */
export function nextPlaybill(cards: readonly Playbill[], act: unknown): string {
  const now = actCount(act);
  if (now === null) return "";
  const waiting = readPlaybills(cards).filter((card) => inTray(card, "open") && card.act !== null);
  if (!waiting.length) return "";
  const byAct = (a: Playbill, b: Playbill) => (a.act ?? 0) - (b.act ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.act ?? 0) >= now).sort(byAct);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byAct)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The gap uses the act you pass. */
export function playbillsCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,player,act,wing,cue,tone,band,pinned,done,held,gap,audit"];
  for (const card of readPlaybills(raw)) {
    const gap = actGap(card.act, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.player),
      card.act === null ? "" : String(card.act),
      card.wing,
      csvCell(card.cue),
      card.tone,
      actBand(card.act),
      card.pinned ? "1" : "0",
      card.done ? "1" : "0",
      card.held ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function playerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return playerLabel(raw) || "all";
}

function wingSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return wingName(raw) || "all";
}

function cueSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return cueTag(raw) || "all";
}

function toneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return toneName(raw) || "all";
}

export function readPlaybillViews(raw: unknown): PlaybillView[] {
  if (!Array.isArray(raw)) return [];
  const out: PlaybillView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PlaybillView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      player: playerSlot(row.player),
      wing: wingSlot(row.wing),
      cue: cueSlot(row.cue),
      tone: toneSlot(row.tone),
      act: activeAct(String(row.act ?? "")),
    });
  }
  return out.slice(0, 10);
}

export function addPlaybillView(
  views: readonly PlaybillView[],
  view: { id: string; name: string; tray: PlaybillTray; query: string; player: string; wing: string; cue: string; tone: string; act: string },
): PlaybillView[] {
  const current = readPlaybillViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    player: playerSlot(view.player),
    wing: wingSlot(view.wing),
    cue: cueSlot(view.cue),
    tone: toneSlot(view.tone),
    act: activeAct(view.act),
  }].slice(0, 10);
}

export function dropPlaybillView(views: readonly PlaybillView[], id: string): PlaybillView[] {
  return readPlaybillViews(views).filter((view) => view.id !== id);
}

/**
 * The invalid source already on the trader row. A last region, an address, a last device,
 * a last operating system, a last browser, a last city, a last country, a language, a country,
 * a registration country, a timezone, a desk name, a desk id, a campaign, a phone, a trading server,
 * a trading group, a broker name, an assignee, a sale status, a retention status, a potential status,
 * a KYC status, an account type, a role, a validation status, a referral code, a profile city,
 * or an invalid reason is not an invalid source.
 */
export function sourceText(value: SourceValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim().slice(0, 16);
  if (!value || typeof value !== "object") return "";
  if (SOURCE_BLOCK.some((key) => key in value)) return "";
  return typeof value.leadInvalidSource === "string" ? value.leadInvalidSource.replace(/\s+/g, " ").trim().slice(0, 16) : "";
}

/** Hand, clock, other, or blank. MANUAL is hand. AUTO is clock. Known codes are read before other. */
export function kindOf(value: SourceValue): Kind {
  const text = sourceText(value).toUpperCase();
  if (!text) return "";
  if (text === "MANUAL") return "hand";
  if (text === "AUTO") return "clock";
  return "other";
}

/** Brief is 1 through 4 characters. Full is 5 through 8. A longer code is wide. A missing source stays blank. */
export function spanOf(value: SourceValue): SourceSpan {
  const text = sourceText(value);
  if (!text) return "";
  if (text.length <= 4) return "brief";
  if (text.length <= 8) return "full";
  return "wide";
}

/** The first A to Z letter. Any other source uses a mark. A missing source stays blank. */
export function sourceMarkOf(value: SourceValue): string {
  const source = sourceText(value);
  if (!source) return "";
  const first = source[0].toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}

export function sourceMarkLabel(raw: unknown): string {
  const text = clip(raw, 1).toUpperCase();
  if (text === "#") return "#";
  return /^[A-Z]$/.test(text) ? text : "";
}

export function sourceLines(rows: readonly SourceRow[]): SourceLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const source = sourceText(row.source);
    map.set(source, (map.get(source) || 0) + 1);
  }
  const out: SourceLine[] = [];
  map.forEach((count, source) => out.push({ source, kind: kindOf(source), span: spanOf(source), letter: sourceMarkOf(source), count }));
  return out.sort((a, b) => {
    if (!a.source) return -1;
    if (!b.source) return 1;
    return a.source.localeCompare(b.source);
  });
}

export function namedSources(rows: readonly SourceRow[]): string[] {
  return sourceLines(rows).map((line) => line.source).filter(Boolean);
}

export function kindLines(rows: readonly SourceRow[]): KindLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const kind = kindOf(row.source);
    map.set(kind, (map.get(kind) || 0) + 1);
  }
  const out: KindLine[] = [];
  for (const kind of KINDS) {
    const count = map.get(kind);
    if (count) out.push({ kind, count });
  }
  return out;
}

export function namedKinds(rows: readonly SourceRow[]): string[] {
  return kindLines(rows).map((line) => line.kind).filter(Boolean);
}

export function spanLines(rows: readonly SourceRow[]): SpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = spanOf(row.source);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: SpanLine[] = [];
  for (const span of SPANS) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly SourceRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

export function sourceMarkLines(rows: readonly SourceRow[]): SourceMarkLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const letter = sourceMarkOf(row.source);
    map.set(letter, (map.get(letter) || 0) + 1);
  }
  const out: SourceMarkLine[] = [];
  map.forEach((count, letter) => out.push({ letter, count }));
  return out.sort((a, b) => {
    if (!a.letter && b.letter) return -1;
    if (a.letter && !b.letter) return 1;
    if (a.letter === "#" && b.letter !== "#") return 1;
    if (b.letter === "#" && a.letter !== "#") return -1;
    return a.letter.localeCompare(b.letter);
  });
}

export function namedSourceMarks(rows: readonly SourceRow[]): string[] {
  return sourceMarkLines(rows).map((line) => line.letter).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function sourceShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named source with the most loaded rows. A tie keeps the earlier name. */
export function leadingSource(rows: readonly SourceRow[]): string {
  const named = sourceLines(rows).filter((line) => line.source);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.source.localeCompare(b.source))[0].source;
}

/** The named kind with the most loaded rows. A tie keeps the earlier name. A blank kind is not a lead. */
export function leadingKind(rows: readonly SourceRow[]): string {
  const named = kindLines(rows).filter((line) => line.kind);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind))[0].kind;
}

/** The named span with the most loaded rows. A tie keeps the earlier name. A blank span is not a lead. */
export function leadingSpan(rows: readonly SourceRow[]): string {
  const named = spanLines(rows).filter((line) => line.span);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.span.localeCompare(b.span))[0].span;
}

/** The named letter with the most loaded rows. A tie keeps the earlier letter. A blank letter is not a lead. */
export function leadingSourceMark(rows: readonly SourceRow[]): string {
  const named = sourceMarkLines(rows).filter((line) => line.letter);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter))[0].letter;
}

export function readHiddenSources(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => sourceText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const source = sourceText(String(item || ""));
    if (!source || !allow.has(source) || out.includes(source)) continue;
    out.push(source);
  }
  return out;
}

export function toggleSource(hidden: readonly string[], source: string, present: readonly string[]): string[] {
  const current = readHiddenSources(hidden, present);
  const next = sourceText(source);
  if (!next || !present.map((item) => sourceText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleSources(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSources(hidden, present));
  return namedSources(present.map((source) => ({ source }))).filter((source) => (showHidden ? gone.has(source) : !gone.has(source)));
}

export function activeSource(selected: string, visible: readonly string[]): string {
  const source = sourceText(selected);
  if (!source) return "";
  return visible.some((item) => sourceText(item) === source) ? source : "";
}

/** "all" and "blank" stay. A kind that is no longer loaded falls back to all. */
export function activeKind(filter: string, kinds: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return kinds.includes(filter) ? filter : "all";
}

export function kindArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "hand" || filter === "clock" || filter === "other") return filter;
  return null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "brief" || filter === "full" || filter === "wide") return filter;
  return null;
}

/** "all" and "blank" stay. A letter that is no longer loaded falls back to all. */
export function activeSourceMark(filter: string, letters: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const letter = filter === "#" ? "#" : sourceMarkLabel(filter);
  return letter && letters.includes(letter) ? letter : "all";
}

export function sourceMarkArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const letter = filter === "#" ? "#" : sourceMarkLabel(filter);
  return letter || null;
}

/** Search stays on the name. The source is not part of the query. */
export function visibleSourceCustomers<T extends SourceRow>(
  rows: readonly T[],
  source: string,
  blank: boolean,
  kind: string | null,
  span: string | null,
  letter: string | null,
  query: string,
): T[] {
  const want = sourceText(source);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = sourceText(row.source);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (kind !== null && kindOf(row.source) !== kind) return false;
    if (span !== null && spanOf(row.source) !== span) return false;
    if (letter !== null && sourceMarkOf(row.source) !== letter) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the sources, kinds, spans, letters, and counts on this page. */
export function sourcesCsv(rows: readonly SourceRow[]): string {
  const lines = ["source,kind,span,letter,count"];
  for (const line of sourceLines(rows)) {
    lines.push([csvCell(line.source), line.kind, line.span, line.letter, String(line.count)].join(","));
  }
  return lines.join("\n");
}
