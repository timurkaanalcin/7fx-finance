/** Local interlude cards, and customer counts grouped by the registration year already on each row. */

export const INTERLUDE_KEY = "crmv4-interlude-cards";
export const INTERLUDE_VIEW_KEY = "crmv4-interlude-views";
export const VINTAGE_KEY = "crmv4-vintage-hide";

export type InterludeShade = "blank" | "ivory" | "graphite" | "gold";

export type InterludeRoom = "blank" | "foyer" | "salon" | "library" | "garden";

export type InterludeTray = "open" | "held" | "done";

export type HourPick = "blank" | "dawn" | "noon" | "dusk" | "i" | "ii" | "iii" | "iv";

export type Interlude = {
  id: string;
  text: string;
  host: string;
  hour: number | null;
  room: string;
  mark: string;
  shade: string;
  pinned: boolean;
  done: boolean;
  held: boolean;
  audit: string;
};

export type InterludeView = {
  id: string;
  name: string;
  tray: InterludeTray;
  query: string;
  host: string;
  room: string;
  mark: string;
  shade: string;
  hour: string;
};

export type InterludeCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  late: number;
};

export type VintageValue =
  | {
      registrationDate?: unknown;
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
      createdAt?: unknown;
    }
  | string
  | number
  | Date
  | null
  | undefined;

export type VintageRow = { year?: VintageValue; label?: string | null };

export type VintageLine = { year: string; kind: string; span: string; decade: string; count: number };

export type KindLine = { kind: string; count: number };

export type SpanLine = { span: string; count: number };

export type SeasonLine = { season: string; count: number };

export type DecadeLine = { decade: string; count: number };

export type VintageKind = "" | "founding" | "house" | "fresh";

export type VintageSpan = "" | "early" | "mid" | "late";

export type VintageSeason = "" | "winter" | "spring" | "summer" | "autumn";

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "done", "reopen"] as const;

const ROOMS = ["foyer", "salon", "library", "garden"] as const;

const SHADES = ["ivory", "graphite", "gold"] as const;

const SHADE_ORDER = ["", "ivory", "graphite", "gold"] as const;

const WATCHES = ["i", "ii", "iii", "iv"] as const;

const KINDS = ["", "founding", "house", "fresh"] as const;

const SPANS = ["", "early", "mid", "late"] as const;

const SEASONS = ["", "winter", "spring", "summer", "autumn"] as const;

const BLOCK = [
  "leadInvalidSource",
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
  "createdAt",
] as const;

type Parts = { year: number; month: number | null };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): InterludeTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function roomName(raw: unknown): Exclude<InterludeRoom, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (ROOMS as readonly string[]).includes(text) ? (text as Exclude<InterludeRoom, "blank">) : "";
}

function shadeName(raw: unknown): Exclude<InterludeShade, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SHADES as readonly string[]).includes(text) ? (text as Exclude<InterludeShade, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function interludeText(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank host stays blank. It is not filled in. */
export function hostLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A blank mark stays blank. It is not filled in. */
export function markTag(raw: unknown): string {
  return clip(raw, 12);
}

/**
 * An hour is 1 through 12. Zero is not an hour. A blank value stays unset.
 * A leading zero is unset. Thirteen is not an hour.
 */
export function hourCount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 12) return raw;
  if (typeof raw === "string" && /^([1-9]|1[0-2])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Foyer, salon, library, garden, or blank. Anything else is blank. */
export function roomOf(raw: unknown): InterludeRoom {
  return roomName(raw) || "blank";
}

/** Ivory, graphite, gold, or blank. Anything else is blank. */
export function shadeOf(raw: unknown): InterludeShade {
  return shadeName(raw) || "blank";
}

/** Dawn is 1 through 4. Noon is 5 through 8. Dusk is 9 through 12. An unset hour is blank. */
export function hourBand(hour: unknown): "blank" | "dawn" | "noon" | "dusk" {
  const count = hourCount(hour);
  if (count === null) return "blank";
  if (count <= 4) return "dawn";
  if (count <= 8) return "noon";
  return "dusk";
}

/** Four watches. Hours 1–3, 4–6, 7–9, and 10–12. An unset hour is blank. */
export function hourWatch(hour: unknown): "blank" | "i" | "ii" | "iii" | "iv" {
  const count = hourCount(hour);
  if (count === null) return "blank";
  if (count <= 3) return "i";
  if (count <= 6) return "ii";
  if (count <= 9) return "iii";
  return "iv";
}

/** Hours from the card hour to the desk hour. A negative gap is still ahead. An unset hour stays empty. */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourCount(hour);
  const at = hourCount(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readInterludes(raw: unknown): Interlude[] {
  if (!Array.isArray(raw)) return [];
  const out: Interlude[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Interlude>;
    const id = String(row.id || "").trim();
    const text = interludeText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      host: hostLabel(row.host),
      hour: hourCount(row.hour),
      room: roomName(row.room),
      mark: markTag(row.mark),
      shade: shadeName(row.shade),
      pinned: row.pinned === true,
      done: row.done === true,
      held: row.held === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 32);
}

export function addInterlude(
  cards: readonly Interlude[],
  card: { id: string; text: string; host?: string; hour?: unknown; room?: string; mark?: string; shade?: string },
): Interlude[] {
  const current = readInterludes(cards);
  const id = String(card.id || "").trim();
  const text = interludeText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: Interlude = {
    id,
    text,
    host: hostLabel(card.host),
    hour: hourCount(card.hour),
    room: roomName(card.room),
    mark: markTag(card.mark),
    shade: shadeName(card.shade),
    pinned: false,
    done: false,
    held: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 32);
}

export function stepInterludeShade(cards: readonly Interlude[], id: string, dir: 1 | -1): Interlude[] {
  return readInterludes(cards).map((card) => {
    if (card.id !== id) return card;
    const at = SHADE_ORDER.indexOf(card.shade as (typeof SHADE_ORDER)[number]);
    const next = SHADE_ORDER[Math.min(SHADES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.shade) return card;
    return { ...card, shade: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setInterludePinned(cards: readonly Interlude[], id: string, pinned: boolean): Interlude[] {
  return readInterludes(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setInterludeHeld(cards: readonly Interlude[], id: string, held: boolean): Interlude[] {
  return readInterludes(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setInterludeDone(cards: readonly Interlude[], id: string, done: boolean): Interlude[] {
  return readInterludes(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another card is left out. */
export function editInterlude(cards: readonly Interlude[], id: string, text: string): Interlude[] {
  const current = readInterludes(cards);
  const next = interludeText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkInterludePinned(cards: readonly Interlude[], ids: readonly string[], pinned: boolean): Interlude[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readInterludes(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkInterludeDone(cards: readonly Interlude[], ids: readonly string[], done: boolean): Interlude[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readInterludes(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

export function resetInterludes(): Interlude[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function interludeCopy(raw: unknown): string {
  return interludeText(raw);
}

function inTray(card: Interlude, tray: InterludeTray): boolean {
  if (tray === "done") return card.done;
  if (tray === "held") return card.held && !card.done;
  return !card.held && !card.done;
}

function hourHit(hour: number | null, exact: number | null, band: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (band === null) return true;
  if (band === "i" || band === "ii" || band === "iii" || band === "iv") return hourWatch(hour) === band;
  return hourBand(hour) === band;
}

function shadeWeight(shade: string): number {
  if (shade === "gold") return 3;
  if (shade === "graphite") return 2;
  if (shade === "ivory") return 1;
  return 0;
}

/** Search stays on the note. The host, the hour, the room, the mark, and the shade are not part of the query. */
export function visibleInterludes(
  cards: readonly Interlude[],
  tray: InterludeTray,
  query: string,
  host: string | null,
  room: InterludeRoom | null,
  mark: string | null,
  shade: InterludeShade | null,
  exact: number | null,
  band: HourPick | null,
  goldOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): Interlude[] {
  const text = query.trim().toLowerCase();
  const wantHost = host === null ? null : hostLabel(host);
  const wantMark = mark === null ? null : markTag(mark);
  return readInterludes(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (goldOnly && card.shade !== "gold") return false;
      if (wantHost !== null && hostLabel(card.host) !== wantHost) return false;
      if (room !== null && roomOf(card.room) !== room) return false;
      if (wantMark !== null && markTag(card.mark) !== wantMark) return false;
      if (shade !== null && shadeOf(card.shade) !== shade) return false;
      if (!hourHit(card.hour, exact, band)) return false;
      if (lateOnly) {
        const gap = hourGap(card.hour, desk);
        if (gap === null || gap <= 0 || !inTray(card, "open")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (shadeWeight(a.shade) !== shadeWeight(b.shade)) return shadeWeight(b.shade) - shadeWeight(a.shade);
      return a.text.localeCompare(b.text);
    });
}

/** The hour orders the house. An unset hour stays at the end. Search stays on the note. */
export function interludeTimeline(cards: readonly Interlude[], query: string): Interlude[] {
  const text = query.trim().toLowerCase();
  return readInterludes(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.hour === null && b.hour !== null) return 1;
      if (a.hour !== null && b.hour === null) return -1;
      if (a.hour !== null && b.hour !== null && a.hour !== b.hour) return a.hour - b.hour;
      return a.text.localeCompare(b.text);
    });
}

export function interludeCounts(cards: readonly Interlude[], desk: unknown): InterludeCounts {
  const rows = readInterludes(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => {
      const gap = hourGap(card.hour, desk);
      return gap !== null && gap > 0 && inTray(card, "open");
    }).length,
  };
}

/** Share of the saved cards. A zero total stays at zero. */
export function interludeShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function interludeHosts(cards: readonly Interlude[]): string[] {
  const out: string[] = [];
  for (const card of readInterludes(cards)) {
    if (card.host && !out.includes(card.host)) out.push(card.host);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function interludeMarks(cards: readonly Interlude[]): string[] {
  const out: string[] = [];
  for (const card of readInterludes(cards)) {
    if (card.mark && !out.includes(card.mark)) out.push(card.mark);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function interludeRooms(cards: readonly Interlude[]): Exclude<InterludeRoom, "blank">[] {
  const seen = new Set<string>();
  for (const card of readInterludes(cards)) if (card.room) seen.add(card.room);
  return ROOMS.filter((room) => seen.has(room));
}

export function interludeShades(cards: readonly Interlude[]): Exclude<InterludeShade, "blank">[] {
  const seen = new Set<string>();
  for (const card of readInterludes(cards)) if (card.shade) seen.add(card.shade);
  return SHADES.filter((shade) => seen.has(shade));
}

/** Four watches. The count is the cards whose hour falls in that watch. */
export function hourWatchCounts(cards: readonly Interlude[]): number[] {
  const rows = readInterludes(cards);
  return WATCHES.map((watch) => rows.filter((card) => hourWatch(card.hour) === watch).length);
}

/** "all" and "blank" stay. A host that is no longer on a card falls back to all. */
export function activeHost(filter: string, hosts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const host = hostLabel(filter);
  return host && hosts.includes(host) ? host : "all";
}

export function hostArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return hostLabel(filter);
}

/** "all" and "blank" stay. A room that is no longer on a card falls back to all. */
export function activeRoom(filter: string, rooms: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const room = roomName(filter);
  return room && rooms.includes(room) ? room : "all";
}

export function roomArg(filter: string): InterludeRoom | null {
  if (filter === "blank") return "blank";
  return roomName(filter) || null;
}

/** "all" and "blank" stay. A mark that is no longer on a card falls back to all. */
export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = markTag(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return markTag(filter);
}

/** "all" and "blank" stay. A shade that is no longer on a card falls back to all. */
export function activeShade(filter: string, shades: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const shade = shadeName(filter);
  return shade && shades.includes(shade) ? shade : "all";
}

export function shadeArg(filter: string): InterludeShade | null {
  if (filter === "blank") return "blank";
  return shadeName(filter) || null;
}

/** All, blank, dawn, noon, dusk, the four watches, and hours 1 through 12 stay. Anything else is all. */
export function activeHour(filter: string): string {
  if (filter === "blank" || filter === "dawn" || filter === "noon" || filter === "dusk") return filter;
  if ((WATCHES as readonly string[]).includes(filter)) return filter;
  const hour = hourCount(filter);
  return hour === null ? "all" : String(hour);
}

export function hourArg(filter: string): { exact: number | null; band: HourPick | null } {
  if (
    filter === "blank" ||
    filter === "dawn" ||
    filter === "noon" ||
    filter === "dusk" ||
    (WATCHES as readonly string[]).includes(filter)
  ) {
    return { exact: null, band: filter as HourPick };
  }
  const hour = hourCount(filter);
  return hour === null ? { exact: null, band: null } : { exact: hour, band: null };
}

/** Other cards with the same room and the same hour. A blank room or an unset hour clashes with nothing. */
export function interludeClashIds(cards: readonly Interlude[], id: string): string[] {
  const rows = readInterludes(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.room || card.hour === null) return [];
  return rows
    .filter((item) => item.id !== id && item.room === card.room && item.hour === card.hour)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next open card at or after the hour. After the last hour, the house wraps to the earliest open hour. */
export function nextInterlude(cards: readonly Interlude[], hour: unknown): string {
  const now = hourCount(hour);
  if (now === null) return "";
  const waiting = readInterludes(cards).filter((card) => inTray(card, "open") && card.hour !== null);
  if (!waiting.length) return "";
  const byHour = (a: Interlude, b: Interlude) => (a.hour ?? 0) - (b.hour ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The gap uses the hour you pass. */
export function interludesCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,host,hour,room,mark,shade,band,pinned,done,held,gap,audit"];
  for (const card of readInterludes(raw)) {
    const gap = hourGap(card.hour, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.host),
      card.hour === null ? "" : String(card.hour),
      card.room,
      csvCell(card.mark),
      card.shade,
      hourBand(card.hour),
      card.pinned ? "1" : "0",
      card.done ? "1" : "0",
      card.held ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function hostSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return hostLabel(raw) || "all";
}

function roomSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return roomName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return markTag(raw) || "all";
}

function shadeSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return shadeName(raw) || "all";
}

export function readInterludeViews(raw: unknown): InterludeView[] {
  if (!Array.isArray(raw)) return [];
  const out: InterludeView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<InterludeView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      host: hostSlot(row.host),
      room: roomSlot(row.room),
      mark: markSlot(row.mark),
      shade: shadeSlot(row.shade),
      hour: activeHour(String(row.hour ?? "")),
    });
  }
  return out.slice(0, 10);
}

export function addInterludeView(
  views: readonly InterludeView[],
  view: { id: string; name: string; tray: InterludeTray; query: string; host: string; room: string; mark: string; shade: string; hour: string },
): InterludeView[] {
  const current = readInterludeViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    host: hostSlot(view.host),
    room: roomSlot(view.room),
    mark: markSlot(view.mark),
    shade: shadeSlot(view.shade),
    hour: activeHour(view.hour),
  }].slice(0, 10);
}

export function dropInterludeView(views: readonly InterludeView[], id: string): InterludeView[] {
  return readInterludeViews(views).filter((view) => view.id !== id);
}

function partsOf(raw: unknown): Parts | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1970 || raw > 2099) return null;
    return { year: raw, month: null };
  }
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    return partsOf(raw.toISOString());
  }
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:[T\s].*)?)?)?$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  if (year < 1970 || year > 2099) return null;
  if (!match[2]) return { year, month: null };
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  if (match[3]) {
    const day = Number(match[3]);
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  }
  return { year, month };
}

function resolvedParts(value: VintageValue): Parts | null {
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) return partsOf(value);
  if (!value || typeof value !== "object") return null;
  if (BLOCK.some((key) => key in value)) return null;
  const raw = value.registrationDate;
  if (typeof raw === "string" || typeof raw === "number" || raw instanceof Date) return partsOf(raw);
  return null;
}

/**
 * The registration year already on the trader row. A created date is not a registration year.
 * An invalid source, a reason, a region, an address, a device, a system, a browser, a city,
 * a country, a language, a timezone, a desk, a campaign, a phone, a server, a group, a broker,
 * an assignee, a status, an account type, a role, a referral code, or a profile city is not a year.
 * A missing date stays blank and is not filled in. The year is 1970 through 2099.
 */
export function vintageText(value: VintageValue): string {
  const parts = resolvedParts(value);
  return parts ? String(parts.year) : "";
}

/** Founding is before 2018. House is 2018 through 2022. Fresh is 2023 and later. A missing year stays blank. */
export function kindOf(value: VintageValue): VintageKind {
  const parts = resolvedParts(value);
  if (!parts) return "";
  if (parts.year < 2018) return "founding";
  if (parts.year <= 2022) return "house";
  return "fresh";
}

/** Early is before 2020. Mid is 2020 through 2023. Late is 2024 and later. A missing year stays blank. */
export function spanOf(value: VintageValue): VintageSpan {
  const parts = resolvedParts(value);
  if (!parts) return "";
  if (parts.year < 2020) return "early";
  if (parts.year <= 2023) return "mid";
  return "late";
}

/** Winter, spring, summer, autumn. A year with no month stays blank. A missing date stays blank. */
export function seasonOf(value: VintageValue): VintageSeason {
  const parts = resolvedParts(value);
  if (!parts || parts.month === null) return "";
  if (parts.month === 12 || parts.month <= 2) return "winter";
  if (parts.month <= 5) return "spring";
  if (parts.month <= 8) return "summer";
  return "autumn";
}

/** The decade mark, such as 10s or 20s. A missing year stays blank. */
export function decadeOf(value: VintageValue): string {
  const parts = resolvedParts(value);
  if (!parts) return "";
  return `${String(parts.year).slice(2, 3)}0s`;
}

export function vintageLines(rows: readonly VintageRow[]): VintageLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const year = vintageText(row.year);
    map.set(year, (map.get(year) || 0) + 1);
  }
  const out: VintageLine[] = [];
  map.forEach((count, year) => out.push({
    year,
    kind: kindOf(year),
    span: spanOf(year),
    decade: decadeOf(year),
    count,
  }));
  return out.sort((a, b) => {
    if (!a.year) return -1;
    if (!b.year) return 1;
    return a.year.localeCompare(b.year);
  });
}

export function namedYears(rows: readonly VintageRow[]): string[] {
  return vintageLines(rows).map((line) => line.year).filter(Boolean);
}

export function kindLines(rows: readonly VintageRow[]): KindLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const kind = kindOf(row.year);
    map.set(kind, (map.get(kind) || 0) + 1);
  }
  const out: KindLine[] = [];
  for (const kind of KINDS) {
    const count = map.get(kind);
    if (count) out.push({ kind, count });
  }
  return out;
}

export function namedKinds(rows: readonly VintageRow[]): string[] {
  return kindLines(rows).map((line) => line.kind).filter(Boolean);
}

export function spanLines(rows: readonly VintageRow[]): SpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = spanOf(row.year);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: SpanLine[] = [];
  for (const span of SPANS) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly VintageRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

export function seasonLines(rows: readonly VintageRow[]): SeasonLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const season = seasonOf(row.year);
    map.set(season, (map.get(season) || 0) + 1);
  }
  const out: SeasonLine[] = [];
  for (const season of SEASONS) {
    const count = map.get(season);
    if (count) out.push({ season, count });
  }
  return out;
}

export function namedSeasons(rows: readonly VintageRow[]): string[] {
  return seasonLines(rows).map((line) => line.season).filter(Boolean);
}

export function decadeLines(rows: readonly VintageRow[]): DecadeLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const decade = decadeOf(row.year);
    map.set(decade, (map.get(decade) || 0) + 1);
  }
  const out: DecadeLine[] = [];
  map.forEach((count, decade) => out.push({ decade, count }));
  return out.sort((a, b) => {
    if (!a.decade && b.decade) return -1;
    if (a.decade && !b.decade) return 1;
    return a.decade.localeCompare(b.decade);
  });
}

export function namedDecades(rows: readonly VintageRow[]): string[] {
  return decadeLines(rows).map((line) => line.decade).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function vintageShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named year with the most loaded rows. A tie keeps the earlier year. */
export function leadingYear(rows: readonly VintageRow[]): string {
  const named = vintageLines(rows).filter((line) => line.year);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.year.localeCompare(b.year))[0].year;
}

/** The named kind with the most loaded rows. A tie keeps the earlier name. A blank kind is not a lead. */
export function leadingKind(rows: readonly VintageRow[]): string {
  const named = kindLines(rows).filter((line) => line.kind);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind))[0].kind;
}

/** The named span with the most loaded rows. A tie keeps the earlier name. A blank span is not a lead. */
export function leadingSpan(rows: readonly VintageRow[]): string {
  const named = spanLines(rows).filter((line) => line.span);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.span.localeCompare(b.span))[0].span;
}

/** The named season with the most loaded rows. A tie keeps the earlier name. A blank season is not a lead. */
export function leadingSeason(rows: readonly VintageRow[]): string {
  const named = seasonLines(rows).filter((line) => line.season);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.season.localeCompare(b.season))[0].season;
}

/** The named decade with the most loaded rows. A tie keeps the earlier mark. A blank decade is not a lead. */
export function leadingDecade(rows: readonly VintageRow[]): string {
  const named = decadeLines(rows).filter((line) => line.decade);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.decade.localeCompare(b.decade))[0].decade;
}

export function readHiddenYears(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => vintageText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const year = vintageText(String(item || ""));
    if (!year || !allow.has(year) || out.includes(year)) continue;
    out.push(year);
  }
  return out;
}

export function toggleYear(hidden: readonly string[], year: string, present: readonly string[]): string[] {
  const current = readHiddenYears(hidden, present);
  const next = vintageText(year);
  if (!next || !present.map((item) => vintageText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleYears(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenYears(hidden, present));
  return namedYears(present.map((year) => ({ year }))).filter((year) => (showHidden ? gone.has(year) : !gone.has(year)));
}

export function activeYear(selected: string, visible: readonly string[]): string {
  const year = vintageText(selected);
  if (!year) return "";
  return visible.some((item) => vintageText(item) === year) ? year : "";
}

/** "all" and "blank" stay. A kind that is no longer loaded falls back to all. */
export function activeKind(filter: string, kinds: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return kinds.includes(filter) ? filter : "all";
}

export function kindArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "founding" || filter === "house" || filter === "fresh") return filter;
  return null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "early" || filter === "mid" || filter === "late") return filter;
  return null;
}

/** "all" and "blank" stay. A season that is no longer loaded falls back to all. */
export function activeSeason(filter: string, seasons: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return seasons.includes(filter) ? filter : "all";
}

export function seasonArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "winter" || filter === "spring" || filter === "summer" || filter === "autumn") return filter;
  return null;
}

/** "all" and "blank" stay. A decade that is no longer loaded falls back to all. */
export function activeDecade(filter: string, decades: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return decades.includes(filter) ? filter : "all";
}

export function decadeArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return /^\d0s$/.test(filter) ? filter : null;
}

/** Search stays on the name. The year is not part of the query. */
export function visibleVintageCustomers<T extends VintageRow>(
  rows: readonly T[],
  year: string,
  blank: boolean,
  kind: string | null,
  span: string | null,
  season: string | null,
  decade: string | null,
  query: string,
): T[] {
  const want = vintageText(year);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = vintageText(row.year);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (kind !== null && kindOf(row.year) !== kind) return false;
    if (span !== null && spanOf(row.year) !== span) return false;
    if (season !== null && seasonOf(row.year) !== season) return false;
    if (decade !== null && decadeOf(row.year) !== decade) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the years, kinds, spans, decades, and counts on this page. A season stays on the row filter. */
export function vintagesCsv(rows: readonly VintageRow[]): string {
  const lines = ["year,kind,span,decade,count"];
  for (const line of vintageLines(rows)) {
    lines.push([csvCell(line.year), line.kind, line.span, line.decade, String(line.count)].join(","));
  }
  return lines.join("\n");
}
