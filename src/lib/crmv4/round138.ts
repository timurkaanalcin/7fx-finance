/** Local place cards, and customer counts grouped by the last browser already on each row. */

export const PLACE_KEY = "crmv4-place-cards";
export const PLACE_VIEW_KEY = "crmv4-place-views";
export const BROWSER_KEY = "crmv4-browser-hide";

export type PlaceRank = 0 | 1 | 2;

export type Course = "first" | "main" | "last" | "blank";

export type PlaceTray = "waiting" | "seated" | "cleared";

export type SeatPick = "blank" | "near" | "far";

export type PlaceCard = {
  id: string;
  text: string;
  table: string;
  seat: number;
  course: string;
  tag: string;
  rank: PlaceRank;
  seated: boolean;
  cleared: boolean;
  hush: boolean;
  audit: string;
};

export type PlaceView = {
  id: string;
  name: string;
  tray: PlaceTray;
  query: string;
  table: string;
  course: string;
  tag: string;
  seat: string;
};

export type PlaceCounts = {
  waiting: number;
  seated: number;
  cleared: number;
  hush: number;
  passed: number;
};

export type BrowserValue =
  | {
      lastBrowser?: unknown;
      language?: unknown;
      country?: unknown;
      registrationCountry?: unknown;
      timezone?: unknown;
      lastCountry?: unknown;
      lastCountryName?: unknown;
      lastRegion?: unknown;
      lastDevice?: unknown;
      lastOs?: unknown;
      lastCity?: unknown;
      lastIp?: unknown;
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

export type BrowserRow = { lastBrowser?: BrowserValue; label?: string | null };

export type BrowserLine = { browser: string; family: string; initial: string; count: number };

export type FamilyLine = { family: string; count: number };

export type InitialLine = { initial: string; count: number };

export type Family = "" | "chrome" | "safari" | "firefox" | "edge" | "other";

const AUDITS = ["save", "edit", "raise", "lower", "seat", "unseat", "clear", "reopen", "hush", "speak"] as const;

const COURSES = ["first", "main", "last"] as const;

const FAMILIES = ["", "chrome", "safari", "firefox", "edge", "other"] as const;

const BROWSER_BLOCK = [
  "language",
  "country",
  "registrationCountry",
  "timezone",
  "lastCountry",
  "lastCountryName",
  "lastRegion",
  "lastDevice",
  "lastOs",
  "lastCity",
  "lastIp",
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

function trayOf(raw: unknown): PlaceTray {
  return raw === "seated" || raw === "cleared" ? raw : "waiting";
}

function rankOf(raw: unknown): PlaceRank {
  return raw === 1 || raw === 2 ? raw : 0;
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function courseName(raw: unknown): Exclude<Course, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (COURSES as readonly string[]).includes(text) ? (text as Exclude<Course, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function placeText(raw: unknown): string {
  return clip(raw, 96);
}

/** A blank table stays blank. It is not filled in. */
export function tableLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank tag stays blank. It is not filled in. */
export function tagLabel(raw: unknown): string {
  return clip(raw, 12);
}

/** A seat is 1 through 12. A blank or any other value stays zero. */
export function seatCount(raw: unknown): number {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 12) return raw;
  if (typeof raw === "string" && /^([1-9]|1[0-2])$/.test(raw.trim())) return Number(raw.trim());
  return 0;
}

/** First, main, last, or blank. Anything else is blank. */
export function courseOf(raw: unknown): Course {
  return courseName(raw) || "blank";
}

/** Near is 1 through 4. Far is 5 through 12. A zero seat is blank. */
export function seatBand(seat: unknown): SeatPick | "blank" {
  const count = seatCount(seat);
  if (!count) return "blank";
  return count <= 4 ? "near" : "far";
}

/** Seats from the card seat to the desk seat. A negative gap is still ahead. A zero seat stays empty. */
export function seatGap(seat: unknown, desk: unknown): number | null {
  const from = seatCount(seat);
  const at = seatCount(desk);
  if (!from || !at) return null;
  return at - from;
}

export function readPlaces(raw: unknown): PlaceCard[] {
  if (!Array.isArray(raw)) return [];
  const out: PlaceCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PlaceCard>;
    const id = String(row.id || "").trim();
    const text = placeText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      table: tableLabel(row.table),
      seat: seatCount(row.seat),
      course: courseName(row.course),
      tag: tagLabel(row.tag),
      rank: rankOf(row.rank),
      seated: row.seated === true,
      cleared: row.cleared === true,
      hush: row.hush === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 36);
}

export function addPlace(
  cards: readonly PlaceCard[],
  card: { id: string; text: string; table?: string; seat?: unknown; course?: string; tag?: string },
): PlaceCard[] {
  const current = readPlaces(cards);
  const id = String(card.id || "").trim();
  const text = placeText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: PlaceCard = {
    id,
    text,
    table: tableLabel(card.table),
    seat: seatCount(card.seat),
    course: courseName(card.course),
    tag: tagLabel(card.tag),
    rank: 0,
    seated: false,
    cleared: false,
    hush: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 36);
}

export function stepPlaceRank(cards: readonly PlaceCard[], id: string, dir: 1 | -1): PlaceCard[] {
  return readPlaces(cards).map((card) => {
    if (card.id !== id) return card;
    const next = rankOf(Math.min(2, Math.max(0, card.rank + dir)));
    if (next === card.rank) return card;
    return { ...card, rank: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setPlaceSeated(cards: readonly PlaceCard[], id: string, seated: boolean): PlaceCard[] {
  return readPlaces(cards).map((card) => (card.id === id ? { ...card, seated, audit: seated ? "seat" : "unseat" } : card));
}

export function setPlaceCleared(cards: readonly PlaceCard[], id: string, cleared: boolean): PlaceCard[] {
  return readPlaces(cards).map((card) => (card.id === id ? { ...card, cleared, audit: cleared ? "clear" : "reopen" } : card));
}

export function setPlaceHush(cards: readonly PlaceCard[], id: string, hush: boolean): PlaceCard[] {
  return readPlaces(cards).map((card) => (card.id === id ? { ...card, hush, audit: hush ? "hush" : "speak" } : card));
}

/** A blank edit is left out. A duplicate of another card is left out. */
export function editPlace(cards: readonly PlaceCard[], id: string, text: string): PlaceCard[] {
  const current = readPlaces(cards);
  const next = placeText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkPlaceSeated(cards: readonly PlaceCard[], ids: readonly string[], seated: boolean): PlaceCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readPlaces(cards).map((card) => (want.has(card.id) ? { ...card, seated, audit: seated ? "seat" : "unseat" } : card));
}

export function bulkPlaceCleared(cards: readonly PlaceCard[], ids: readonly string[], cleared: boolean): PlaceCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readPlaces(cards).map((card) => (want.has(card.id) ? { ...card, cleared, audit: cleared ? "clear" : "reopen" } : card));
}

export function resetPlaces(): PlaceCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function placeCopy(raw: unknown): string {
  return placeText(raw);
}

function inTray(card: PlaceCard, tray: PlaceTray): boolean {
  if (tray === "cleared") return card.cleared;
  if (tray === "seated") return card.seated && !card.cleared;
  return !card.seated && !card.cleared;
}

function seatHit(seat: number, exact: number | null, band: SeatPick | null): boolean {
  if (exact !== null) return seat === exact;
  if (band === null) return true;
  return seatBand(seat) === band;
}

/** Search stays on the note. The table, the seat, the course, and the tag are not part of the query. */
export function visiblePlaces(
  cards: readonly PlaceCard[],
  tray: PlaceTray,
  query: string,
  table: string | null,
  course: Course | null,
  tag: string | null,
  exact: number | null,
  band: SeatPick | null,
  topOnly: boolean,
  passedOnly: boolean,
  desk: unknown,
): PlaceCard[] {
  const text = query.trim().toLowerCase();
  const wantTable = table === null ? null : tableLabel(table);
  const wantTag = tag === null ? null : tagLabel(tag);
  return readPlaces(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (topOnly && card.rank !== 2) return false;
      if (wantTable !== null && tableLabel(card.table) !== wantTable) return false;
      if (course !== null && courseOf(card.course) !== course) return false;
      if (wantTag !== null && tagLabel(card.tag) !== wantTag) return false;
      if (!seatHit(card.seat, exact, band)) return false;
      if (passedOnly) {
        const gap = seatGap(card.seat, desk);
        if (gap === null || gap <= 0 || !inTray(card, "waiting")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return b.rank - a.rank;
      return a.text.localeCompare(b.text);
    });
}

/** The seat orders the room. A blank seat stays at the end. Search stays on the note. */
export function placeTimeline(cards: readonly PlaceCard[], query: string): PlaceCard[] {
  const text = query.trim().toLowerCase();
  return readPlaces(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (!a.seat && b.seat) return 1;
      if (a.seat && !b.seat) return -1;
      if (a.seat !== b.seat) return a.seat - b.seat;
      return a.text.localeCompare(b.text);
    });
}

export function placeCounts(cards: readonly PlaceCard[], desk: unknown): PlaceCounts {
  const rows = readPlaces(cards);
  return {
    waiting: rows.filter((card) => inTray(card, "waiting")).length,
    seated: rows.filter((card) => inTray(card, "seated")).length,
    cleared: rows.filter((card) => inTray(card, "cleared")).length,
    hush: rows.filter((card) => card.hush).length,
    passed: rows.filter((card) => {
      const gap = seatGap(card.seat, desk);
      return gap !== null && gap > 0 && inTray(card, "waiting");
    }).length,
  };
}

/** Share of the saved cards. A zero total stays at zero. */
export function placeShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function placeTables(cards: readonly PlaceCard[]): string[] {
  const out: string[] = [];
  for (const card of readPlaces(cards)) {
    if (card.table && !out.includes(card.table)) out.push(card.table);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function placeTags(cards: readonly PlaceCard[]): string[] {
  const out: string[] = [];
  for (const card of readPlaces(cards)) {
    if (card.tag && !out.includes(card.tag)) out.push(card.tag);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function placeCourses(cards: readonly PlaceCard[]): Exclude<Course, "blank">[] {
  const seen = new Set<string>();
  for (const card of readPlaces(cards)) if (card.course) seen.add(card.course);
  return COURSES.filter((course) => seen.has(course));
}

/** Twelve chairs. The count is the cards that name that seat. */
export function seatCounts(cards: readonly PlaceCard[]): number[] {
  const rows = readPlaces(cards);
  return Array.from({ length: 12 }, (_, index) => rows.filter((card) => card.seat === index + 1).length);
}

/** "all" and "blank" stay. A table that is no longer on a card falls back to all. */
export function activeTable(filter: string, tables: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const table = tableLabel(filter);
  return table && tables.includes(table) ? table : "all";
}

export function tableArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return tableLabel(filter);
}

/** "all" and "blank" stay. A course that is no longer on a card falls back to all. */
export function activeCourse(filter: string, courses: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const course = courseName(filter);
  return course && courses.includes(course) ? course : "all";
}

export function courseArg(filter: string): Course | null {
  if (filter === "blank") return "blank";
  return courseName(filter) || null;
}

/** "all" and "blank" stay. A tag that is no longer on a card falls back to all. */
export function activeTag(filter: string, tags: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tag = tagLabel(filter);
  return tag && tags.includes(tag) ? tag : "all";
}

export function tagArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return tagLabel(filter);
}

/** All, blank, near, far, and seats 1 through 12 stay. Anything else is all. */
export function activeSeat(filter: string): string {
  if (filter === "blank" || filter === "near" || filter === "far") return filter;
  const seat = seatCount(filter);
  return seat ? String(seat) : "all";
}

export function seatArg(filter: string): { exact: number | null; band: SeatPick | null } {
  if (filter === "blank" || filter === "near" || filter === "far") return { exact: null, band: filter };
  const seat = seatCount(filter);
  return seat ? { exact: seat, band: null } : { exact: null, band: null };
}

/** Other cards with the same table and the same seat. A blank table or a zero seat clashes with nothing. */
export function placeClashIds(cards: readonly PlaceCard[], id: string): string[] {
  const rows = readPlaces(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.table || card.seat <= 0) return [];
  return rows
    .filter((item) => item.id !== id && item.table === card.table && item.seat === card.seat)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next waiting card at or after the seat. After the last seat, the room wraps to the earliest waiting seat. */
export function nextPlace(cards: readonly PlaceCard[], seat: unknown): string {
  const now = seatCount(seat);
  if (!now) return "";
  const open = readPlaces(cards).filter((card) => inTray(card, "waiting") && card.seat > 0);
  if (!open.length) return "";
  const bySeat = (a: PlaceCard, b: PlaceCard) => a.seat - b.seat || a.text.localeCompare(b.text);
  const later = open.filter((card) => card.seat >= now).sort(bySeat);
  if (later.length) return later[0].id;
  return open.slice().sort(bySeat)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The gap uses the seat you pass. */
export function placesCsv(raw: unknown, desk: unknown): string {
  const lines = ["text,table,seat,course,tag,band,rank,seated,cleared,hush,gap,audit"];
  for (const card of readPlaces(raw)) {
    const gap = seatGap(card.seat, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.table),
      String(card.seat),
      card.course,
      csvCell(card.tag),
      seatBand(card.seat),
      String(card.rank),
      card.seated ? "1" : "0",
      card.cleared ? "1" : "0",
      card.hush ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function tableSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tableLabel(raw) || "all";
}

function courseSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return courseName(raw) || "all";
}

function tagSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tagLabel(raw) || "all";
}

function seatSlot(raw: unknown): string {
  return activeSeat(String(raw ?? ""));
}

export function readPlaceViews(raw: unknown): PlaceView[] {
  if (!Array.isArray(raw)) return [];
  const out: PlaceView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PlaceView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      table: tableSlot(row.table),
      course: courseSlot(row.course),
      tag: tagSlot(row.tag),
      seat: seatSlot(row.seat),
    });
  }
  return out.slice(0, 12);
}

export function addPlaceView(
  views: readonly PlaceView[],
  view: { id: string; name: string; tray: PlaceTray; query: string; table: string; course: string; tag: string; seat: string },
): PlaceView[] {
  const current = readPlaceViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    table: tableSlot(view.table),
    course: courseSlot(view.course),
    tag: tagSlot(view.tag),
    seat: seatSlot(view.seat),
  }].slice(0, 12);
}

export function dropPlaceView(views: readonly PlaceView[], id: string): PlaceView[] {
  return readPlaceViews(views).filter((view) => view.id !== id);
}

/**
 * The last browser string. A language, a country, a registration country, a timezone,
 * a last country, a last region, a device, an operating system, a last city, an address,
 * a desk name, a desk id, a campaign, a phone, a trading server, a trading group,
 * a broker name, an assignee, a sale status, a retention status, a potential status,
 * a KYC status, an account type, a role, a validation status, a referral code,
 * or a profile city is not a last browser.
 */
export function browserText(value: BrowserValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim().slice(0, 64);
  if (!value || typeof value !== "object") return "";
  if (BROWSER_BLOCK.some((key) => key in value)) return "";
  return typeof value.lastBrowser === "string" ? value.lastBrowser.replace(/\s+/g, " ").trim().slice(0, 64) : "";
}

/** Chrome, Safari, Firefox, Edge, other, or blank. Edge is read before Chrome. */
export function familyOf(value: BrowserValue): Family {
  const text = browserText(value).toLowerCase();
  if (!text) return "";
  if (text.includes("edge")) return "edge";
  if (text.includes("firefox")) return "firefox";
  if (text.includes("chrome") || text.includes("crios")) return "chrome";
  if (text.includes("safari")) return "safari";
  return "other";
}

/** The first A to Z letter. Any other last browser uses a mark. A missing last browser stays blank. */
export function initialOf(value: BrowserValue): string {
  const browser = browserText(value);
  if (!browser) return "";
  const first = browser[0].toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}

export function initialLabel(raw: unknown): string {
  const text = clip(raw, 1).toUpperCase();
  if (text === "#") return "#";
  return /^[A-Z]$/.test(text) ? text : "";
}

export function browserLines(rows: readonly BrowserRow[]): BrowserLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const browser = browserText(row.lastBrowser);
    map.set(browser, (map.get(browser) || 0) + 1);
  }
  const out: BrowserLine[] = [];
  map.forEach((count, browser) => out.push({ browser, family: familyOf(browser), initial: initialOf(browser), count }));
  return out.sort((a, b) => {
    if (!a.browser) return -1;
    if (!b.browser) return 1;
    return a.browser.localeCompare(b.browser);
  });
}

export function namedBrowsers(rows: readonly BrowserRow[]): string[] {
  return browserLines(rows).map((line) => line.browser).filter(Boolean);
}

export function familyLines(rows: readonly BrowserRow[]): FamilyLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const family = familyOf(row.lastBrowser);
    map.set(family, (map.get(family) || 0) + 1);
  }
  const out: FamilyLine[] = [];
  for (const family of FAMILIES) {
    const count = map.get(family);
    if (count) out.push({ family, count });
  }
  return out;
}

export function namedFamilies(rows: readonly BrowserRow[]): string[] {
  return familyLines(rows).map((line) => line.family).filter(Boolean);
}

export function initialLines(rows: readonly BrowserRow[]): InitialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const initial = initialOf(row.lastBrowser);
    map.set(initial, (map.get(initial) || 0) + 1);
  }
  const out: InitialLine[] = [];
  map.forEach((count, initial) => out.push({ initial, count }));
  return out.sort((a, b) => {
    if (!a.initial && b.initial) return -1;
    if (a.initial && !b.initial) return 1;
    if (a.initial === "#" && b.initial !== "#") return 1;
    if (b.initial === "#" && a.initial !== "#") return -1;
    return a.initial.localeCompare(b.initial);
  });
}

export function namedInitials(rows: readonly BrowserRow[]): string[] {
  return initialLines(rows).map((line) => line.initial).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function browserShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named last browser with the most loaded rows. A tie keeps the earlier name. */
export function leadingBrowser(rows: readonly BrowserRow[]): string {
  const named = browserLines(rows).filter((line) => line.browser);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.browser.localeCompare(b.browser))[0].browser;
}

/** The named family with the most loaded rows. A tie keeps the earlier name. A blank family is not a lead. */
export function leadingFamily(rows: readonly BrowserRow[]): string {
  const named = familyLines(rows).filter((line) => line.family);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.family.localeCompare(b.family))[0].family;
}

/** The named initial with the most loaded rows. A tie keeps the earlier letter. A blank initial is not a lead. */
export function leadingInitial(rows: readonly BrowserRow[]): string {
  const named = initialLines(rows).filter((line) => line.initial);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.initial.localeCompare(b.initial))[0].initial;
}

export function readHiddenBrowsers(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => browserText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const browser = browserText(String(item || ""));
    if (!browser || !allow.has(browser) || out.includes(browser)) continue;
    out.push(browser);
  }
  return out;
}

export function toggleBrowser(hidden: readonly string[], browser: string, present: readonly string[]): string[] {
  const current = readHiddenBrowsers(hidden, present);
  const next = browserText(browser);
  if (!next || !present.map((item) => browserText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleBrowsers(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenBrowsers(hidden, present));
  return namedBrowsers(present.map((lastBrowser) => ({ lastBrowser }))).filter((browser) => (showHidden ? gone.has(browser) : !gone.has(browser)));
}

export function activeBrowser(selected: string, visible: readonly string[]): string {
  const browser = browserText(selected);
  if (!browser) return "";
  return visible.some((item) => browserText(item) === browser) ? browser : "";
}

/** "all" and "blank" stay. A family that is no longer loaded falls back to all. */
export function activeFamily(filter: string, families: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return families.includes(filter) ? filter : "all";
}

export function familyArg(filter: string): Family | null {
  if (filter === "blank") return "";
  if (filter === "chrome" || filter === "safari" || filter === "firefox" || filter === "edge" || filter === "other") return filter;
  return null;
}

/** "all" and "blank" stay. An initial that is no longer loaded falls back to all. */
export function activeInitial(filter: string, initials: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const initial = filter === "#" ? "#" : initialLabel(filter);
  return initial && initials.includes(initial) ? initial : "all";
}

export function initialArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  if (filter === "#") return "#";
  return initialLabel(filter) || null;
}

/** Search stays on the name. The last browser is not part of the query. */
export function visibleBrowserCustomers<T extends BrowserRow>(
  rows: readonly T[],
  browser: string,
  blank: boolean,
  family: Family | null,
  initial: string | null,
  query: string,
): T[] {
  const want = browserText(browser);
  const wantInitial = initial === null ? null : initial === "#" ? "#" : initialLabel(initial);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = browserText(row.lastBrowser);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (family !== null && familyOf(got) !== family) return false;
    if (wantInitial !== null && initialOf(got) !== wantInitial) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the last browsers, families, initials, and counts on this page. */
export function browsersCsv(rows: readonly BrowserRow[]): string {
  const lines = ["browser,family,initial,count"];
  for (const line of browserLines(rows)) lines.push([csvCell(line.browser), csvCell(line.family), csvCell(line.initial), String(line.count)].join(","));
  return lines.join("\n");
}
